import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch {}
}

const { combine, timestamp, colorize, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), errors({ stack: true }), logFormat),
  }),
];

// Only add file transports if the directory is writable
try {
  fs.accessSync(logsDir, fs.constants.W_OK);
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      format: combine(timestamp(), errors({ stack: true }), winston.format.json()),
    })
  );
} catch {
  // Logs directory not writable — console only
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  transports,
  exitOnError: false,           // don't crash on logger errors
});
