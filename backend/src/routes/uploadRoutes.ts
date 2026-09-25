import { Router } from "express";
import { AuthRequest, authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { uploadToCloudinary } from "../utils/helpers";

const router = Router();

/**
 * Generic authenticated image upload.
 *
 * Vendors can always post images even when the browser-side unsigned Cloudinary
 * preset is not configured — the API uploads server-side and falls back to
 * local /uploads storage.
 */
router.post(
  "/",
  authenticate,
  upload.single("file"),
  async (req: AuthRequest, res: any): Promise<void> => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ success: false, message: "An image file is required" });
        return;
      }

      const folder = typeof req.body?.folder === "string" && req.body.folder.startsWith("sisters-kitchen")
        ? req.body.folder
        : "sisters-kitchen/uploads";

      const url = await uploadToCloudinary(file.path, folder);
      res.json({ success: true, data: { url } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
