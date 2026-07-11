import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../entities/User";
import { Vendor, VendorStatus } from "../entities/Vendor";
import { AuthRequest } from "../middleware/auth";

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "30d") as any,
  });
  return { accessToken, refreshToken };
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

    const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: userWithoutSensitive, accessToken, refreshToken },
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

    const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: { user: userWithoutSensitive, accessToken, refreshToken },
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
    const { password: _, refreshToken: __, ...userWithoutSensitive } = user;
    res.json({ success: true, data: userWithoutSensitive });
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
    const { password: _, refreshToken: __, ...userWithoutSensitive } = updated!;

    res.json({ success: true, message: "Profile updated", data: userWithoutSensitive });
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
