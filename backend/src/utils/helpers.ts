import cloudinary from "../config/cloudinary";
import fs from "fs";

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SK-${timestamp}-${random}`;
};

export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "sisters-kitchen"
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    // Remove local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error("Failed to upload image");
  }
};

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete from cloudinary:", error);
  }
};

export const paginate = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

export const formatResponse = (
  success: boolean,
  message: string,
  data?: any,
  meta?: any
) => {
  return { success, message, data, ...(meta && { meta }) };
};
