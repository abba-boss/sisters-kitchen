"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultiple = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure upload directory exists
const uploadDir = path_1.default.join(__dirname, "..", "uploads");
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path_1.default.extname(file.originalname).toLowerCase());
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path_1.default.extname(file.originalname).toLowerCase()) &&
        allowed.test(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
    }
};
const options = {
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    fileFilter,
};
exports.upload = (0, multer_1.default)(options);
exports.uploadMultiple = (0, multer_1.default)(options);
//# sourceMappingURL=upload.js.map