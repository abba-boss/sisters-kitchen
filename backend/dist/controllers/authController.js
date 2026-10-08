"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getMe = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Vendor_1 = require("../entities/Vendor");
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN || "7d"),
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "30d"),
    });
    return { accessToken, refreshToken };
};
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, role } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const existing = await userRepo.findOne({ where: { email } });
        if (existing) {
            res.status(400).json({ success: false, message: "Email already registered" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const userRole = role === "vendor" ? User_1.UserRole.VENDOR : User_1.UserRole.CUSTOMER;
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
        if (userRole === User_1.UserRole.VENDOR) {
            const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
            const vendor = vendorRepo.create({
                businessName: req.body.businessName || `${firstName}'s Kitchen`,
                user,
                status: Vendor_1.VendorStatus.PENDING,
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { email },
            relations: ["vendor"],
        });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ success: false, message: "Refresh token required" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { id: decoded.userId, refreshToken },
        });
        if (!user) {
            res.status(401).json({ success: false, message: "Invalid refresh token" });
            return;
        }
        const tokens = generateTokens(user.id);
        user.refreshToken = tokens.refreshToken;
        await userRepo.save(user);
        res.json({ success: true, data: tokens });
    }
    catch (error) {
        res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        if (req.user) {
            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
            req.user.refreshToken = "";
            await userRepo.save(req.user);
        }
        res.json({ success: true, message: "Logged out successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { id: req.user.id },
            relations: ["vendor"],
        });
        const { password: _, refreshToken: __, ...userWithoutSensitive } = user;
        res.json({ success: true, data: userWithoutSensitive });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const { firstName, lastName, phone, address } = req.body;
        await userRepo.update(req.user.id, { firstName, lastName, phone, address });
        const updated = await userRepo.findOne({ where: { id: req.user.id } });
        const { password: _, refreshToken: __, ...userWithoutSensitive } = updated;
        res.json({ success: true, message: "Profile updated", data: userWithoutSensitive });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: req.user.id } });
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: "Current password is incorrect" });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await userRepo.update(req.user.id, { password: hashed });
        res.json({ success: true, message: "Password changed successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=authController.js.map