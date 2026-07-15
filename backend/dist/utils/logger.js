"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure logs directory exists
const logsDir = path_1.default.join(process.cwd(), "logs");
if (!fs_1.default.existsSync(logsDir)) {
    try {
        fs_1.default.mkdirSync(logsDir, { recursive: true });
    }
    catch { }
}
const { combine, timestamp, colorize, printf, errors } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
});
const transports = [
    new winston_1.default.transports.Console({
        format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), errors({ stack: true }), logFormat),
    }),
];
// Only add file transports if the directory is writable
try {
    fs_1.default.accessSync(logsDir, fs_1.default.constants.W_OK);
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, "error.log"),
        level: "error",
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3,
        format: combine(timestamp(), errors({ stack: true }), winston_1.default.format.json()),
    }));
}
catch {
    // Logs directory not writable — console only
}
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === "production" ? "warn" : "info",
    transports,
    exitOnError: false, // don't crash on logger errors
});
//# sourceMappingURL=logger.js.map