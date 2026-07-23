import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../entities/User";
import { Vendor, VendorStatus } from "../entities/Vendor";
import { AuthRequest } from "../middleware/auth";
import { deliverPasswordResetOtp, generateSixDigitOtp } from "../utils/mail";

const OTP_TTL_MS = 10 * 60 * 1000;
const isDev = process.env.NODE_ENV !== "production";

const stripSensitive = (user: User) => {
  const {
    password: _p,
    refreshToken: _r,
    resetOtpHash: _h,
    resetOtpExpires: _e,
    resetOtpVerified: _v,
    ...safe
  } = user as any;
  return safe;
};

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "30d") as any,
  });
  return { accessToken, refreshToken };
};

const issuePasswordResetOtp = async (user: User) => {
  const userRepo = AppDataSource.getRepository(User);
  const otp = generateSixDigitOtp();
  user.resetOtpHash = await bcrypt.hash(otp, 10);
  user.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.resetOtpVerified = false;
  await userRepo.save(user);
  await deliverPasswordResetOtp(user.email, otp);
  return otp;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === "vendor" ? UserRole.VENDOR : UserRole.CUSTOMER;

    const user = userRepo.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: userRole,
    });

    await userRepo.save(user);

    // If registering as vendor, create vendor profile
    if (userRole === UserRole.VENDOR) {
      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = vendorRepo.create({
        businessName: req.body.businessName || `${firstName}'s Kitchen`,
        user,
        status: VendorStatus.PENDING,
      });
      await vendorRepo.save(vendor);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await userRepo.save(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: stripSensitive(user), accessToken, refreshToken },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { email },
      relations: ["vendor"],
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await userRepo.save(user);

    res.json({
      success: true,
      message: "Login successful",
      data: { user: stripSensitive(user), accessToken, refreshToken },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: "Refresh token required" });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: decoded.userId, refreshToken, isActive: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const tokens = generateTokens(user.id);
    user.refreshToken = tokens.refreshToken;
    await userRepo.save(user);

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      const userRepo = AppDataSource.getRepository(User);
      req.user.refreshToken = "";
      await userRepo.save(req.user);
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: req.user!.id },
      relations: ["vendor"],
    });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, data: stripSensitive(user) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const { firstName, lastName, phone, address } = req.body;

    await userRepo.update(req.user!.id, { firstName, lastName, phone, address });
    const updated = await userRepo.findOne({ where: { id: req.user!.id } });

    res.json({ success: true, message: "Profile updated", data: stripSensitive(updated!) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.user!.id } });

    const isMatch = await bcrypt.compare(currentPassword, user!.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Current password is incorrect" });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await userRepo.update(req.user!.id, { password: hashed });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Step 1 — request password-reset OTP (no email enumeration). */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email, isActive: true } });

    let debugOtp: string | undefined;
    if (user) debugOtp = await issuePasswordResetOtp(user);

    const payload: Record<string, unknown> = {
      success: true,
      message: "If that email is registered, a verification code has been sent.",
    };
    if (isDev && debugOtp) payload.debugOtp = debugOtp;

    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Step 2 — verify OTP. */
export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      res.status(400).json({ success: false, message: "Valid email and 6-digit code are required" });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email, isActive: true } });

    if (
      !user ||
      !user.resetOtpHash ||
      !user.resetOtpExpires ||
      user.resetOtpExpires.getTime() < Date.now()
    ) {
      res.status(400).json({ success: false, message: "Invalid or expired verification code" });
      return;
    }

    const ok = await bcrypt.compare(otp, user.resetOtpHash);
    if (!ok) {
      res.status(400).json({ success: false, message: "Invalid or expired verification code" });
      return;
    }

    user.resetOtpVerified = true;
    await userRepo.save(user);

    res.json({
      success: true,
      message: "Code verified. You can now set a new password.",
      data: { email: user.email, verified: true },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Step 3 — set new password after OTP verification. */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!email || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "Email and a password of at least 6 characters are required",
      });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email, isActive: true } });

    if (
      !user ||
      !user.resetOtpHash ||
      !user.resetOtpExpires ||
      user.resetOtpExpires.getTime() < Date.now()
    ) {
      res.status(400).json({
        success: false,
        message: "Reset session expired. Please request a new code.",
      });
      return;
    }

    if (!user.resetOtpVerified) {
      if (!/^\d{6}$/.test(otp)) {
        res.status(400).json({
          success: false,
          message: "Verify your code before resetting the password",
        });
        return;
      }
      const ok = await bcrypt.compare(otp, user.resetOtpHash);
      if (!ok) {
        res.status(400).json({ success: false, message: "Invalid or expired verification code" });
        return;
      }
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    user.resetOtpVerified = false;
    user.refreshToken = "";
    await userRepo.save(user);

    res.json({
      success: true,
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Resend OTP. */
export const resendResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email, isActive: true } });

    let debugOtp: string | undefined;
    if (user) debugOtp = await issuePasswordResetOtp(user);

    const payload: Record<string, unknown> = {
      success: true,
      message: "If that email is registered, a new verification code has been sent.",
    };
    if (isDev && debugOtp) payload.debugOtp = debugOtp;

    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
