import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExt  = /jpeg|jpg|png|gif|webp|mp4|mov|webm|ogg/;
  const allowedMime = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|quicktime|webm|ogg)/;
  if (
    allowedExt.test(path.extname(file.originalname).toLowerCase()) &&
    allowedMime.test(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image (jpg/png/gif/webp) or video (mp4/mov/webm) files are allowed"));
  }
};

const options: multer.Options = {
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (videos need more space)
  fileFilter,
};

export const upload         = multer(options);
export const uploadMultiple = multer(options);
