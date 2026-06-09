import "reflect-metadata";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

import { AppDataSource } from "./config/database";
import { initSocket } from "./config/socket";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

// Routes
import authRoutes from "./routes/authRoutes";
import vendorRoutes from "./routes/vendorRoutes";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import adminRoutes from "./routes/adminRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ── Security & logging middleware ──────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Rate limiting ──────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts, try again in 15 minutes." },
});

app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Health check ───────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Sisters Kitchen API is running 🍽️",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

// ── Error handling ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────
AppDataSource.initialize()
  .then(() => {
    logger.info("✅ Database connected");

    // Initialize Socket.IO
    initSocket(httpServer);
    logger.info("✅ Socket.IO initialized");

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Sisters Kitchen API → http://localhost:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    logger.error("❌ Database connection failed:", error);
    process.exit(1);
  });

export { app, httpServer };
