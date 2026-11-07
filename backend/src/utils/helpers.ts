import cloudinary from "../config/cloudinary";
import fs from "fs";
import path from "path";

export const generateOrderNumber = (): string => {
  const ts     = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SK-${ts}-${random}`;
};

/**
 * Absolute URL for a file served from the API's own /uploads folder.
 * A relative "/uploads/x.jpg" resolves against the frontend origin in the
 * browser, so the host has to be part of the stored value.
 */
export const localUploadUrl = (filename: string): string => {
  const base = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");
  return `${base}/uploads/${filename}`;
};

/**
 * Upload a local file to Cloudinary.
 * Falls back to serving locally if Cloudinary is not properly configured.
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder = "sisters-kitchen"
): Promise<string> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey    = process.env.CLOUDINARY_API_KEY    || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  const hasCloudinary =
    cloudName.length > 3 &&
    cloudName !== "your_cloud_name" &&
    apiKey.length > 5 &&
    apiSecret.length > 5;

  if (!hasCloudinary) {
    // Serve the file locally via /uploads route
    return localUploadUrl(path.basename(filePath));
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    });

    // Clean up local file after successful upload
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error?.message || error);
    // On failure, serve locally instead of crashing
    return localUploadUrl(path.basename(filePath));
  }
};

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  if (!imageUrl || imageUrl.includes("/uploads/")) return; // local file

  try {
    // Extract public_id from URL: .../<folder>/<filename>.<ext>
    const parts   = imageUrl.split("/upload/");
    if (parts.length < 2) return;
    const withVersion = parts[1]; // e.g. v12345/sisters-kitchen/abc.jpg
    const withoutVersion = withVersion.replace(/^v\d+\//, "");
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
};

export const paginate = (page = 1, limit = 10) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const formatResponse = (
  success: boolean,
  message: string,
  data?: any,
  meta?: any
) => ({ success, message, data, ...(meta && { meta }) });
