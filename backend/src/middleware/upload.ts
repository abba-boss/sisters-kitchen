import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
const IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp)$/i;
const VIDEO_MIME = /^video\/(mp4|webm|quicktime|x-m4v)$/i;

/** Images only — used for products, vendor branding and avatars. */
const imageFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (IMAGE_EXT.test(file.originalname) && IMAGE_MIME.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
  }
};

/** Images and short videos — used by the social composer and stories. */
const mediaFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    (IMAGE_EXT.test(file.originalname) && IMAGE_MIME.test(file.mimetype)) ||
    (VIDEO_EXT.test(file.originalname) && VIDEO_MIME.test(file.mimetype))
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image (jpg, png, gif, webp) or video (mp4, webm, mov) files are allowed"));
  }
};

const imageOptions: multer.Options = {
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: imageFilter,
};

const mediaOptions: multer.Options = {
  storage,
  limits: { fileSize: 40 * 1024 * 1024 }, // 40 MB
  fileFilter: mediaFilter,
};

export const upload         = multer(imageOptions);
export const uploadMultiple = multer(imageOptions);
export const uploadMedia    = multer(mediaOptions);
