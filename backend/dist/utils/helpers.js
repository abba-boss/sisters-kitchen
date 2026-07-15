"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResponse = exports.paginate = exports.deleteFromCloudinary = exports.uploadToCloudinary = exports.generateOrderNumber = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generateOrderNumber = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SK-${ts}-${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
/**
 * Upload a local file to Cloudinary.
 * Falls back to serving locally if Cloudinary is not properly configured.
 */
const uploadToCloudinary = async (filePath, folder = "sisters-kitchen") => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const apiKey = process.env.CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    const hasCloudinary = cloudName.length > 3 &&
        cloudName !== "your_cloud_name" &&
        apiKey.length > 5 &&
        apiSecret.length > 5;
    if (!hasCloudinary) {
        // Serve the file locally via /uploads route
        const filename = path_1.default.basename(filePath);
        return `/uploads/${filename}`;
    }
    try {
        const result = await cloudinary_1.default.uploader.upload(filePath, {
            folder,
            use_filename: false,
            unique_filename: true,
            overwrite: false,
            transformation: [{ quality: "auto", fetch_format: "auto" }],
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        });
        // Clean up local file after successful upload
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
        return result.secure_url;
    }
    catch (error) {
        console.error("Cloudinary upload error:", error?.message || error);
        // On failure, serve locally instead of crashing
        const filename = path_1.default.basename(filePath);
        return `/uploads/${filename}`;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl || imageUrl.startsWith("/uploads/"))
        return; // local file
    try {
        // Extract public_id from URL: .../<folder>/<filename>.<ext>
        const parts = imageUrl.split("/upload/");
        if (parts.length < 2)
            return;
        const withVersion = parts[1]; // e.g. v12345/sisters-kitchen/abc.jpg
        const withoutVersion = withVersion.replace(/^v\d+\//, "");
        const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
        await cloudinary_1.default.uploader.destroy(publicId);
    }
    catch (err) {
        console.error("Cloudinary delete error:", err);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
const paginate = (page = 1, limit = 10) => ({
    skip: (page - 1) * limit,
    take: limit,
});
exports.paginate = paginate;
const formatResponse = (success, message, data, meta) => ({ success, message, data, ...(meta && { meta }) });
exports.formatResponse = formatResponse;
//# sourceMappingURL=helpers.js.map