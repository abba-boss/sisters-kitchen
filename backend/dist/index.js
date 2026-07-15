"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = void 0;
require("reflect-metadata");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const socket_1 = require("./config/socket");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
// ── Crash guards — keep the process alive ─────────────────────
process.on("uncaughtException", (err) => { logger_1.logger.error("Uncaught Exception:", err); });
process.on("unhandledRejection", (err) => { logger_1.logger.error("Unhandled Rejection:", err); });
// Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const httpServer = http_1.default.createServer(app);
exports.httpServer = httpServer;
const PORT = process.env.PORT || 5000;
// ── Security & logging middleware ──────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Dynamic CORS — allow any localhost port + configured FRONTEND_URL
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin)
            return callback(null, true);
        // Allow any localhost / 127.0.0.1 origin dynamically
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "tiny"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads")));
// ── Rate limiting ──────────────────────────────────────────────
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { success: false, message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
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
app.use("/api/auth", authRoutes_1.default);
app.use("/api/vendors", vendorRoutes_1.default);
app.use("/api/products", productRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/favorites", favoriteRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/payments", paymentRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/analytics", analyticsRoutes_1.default);
app.use("/api/stats", statsRoutes_1.default);
// ── Error handling ─────────────────────────────────────────────
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// ── Start server ───────────────────────────────────────────────
database_1.AppDataSource.initialize()
    .then(() => {
    logger_1.logger.info("✅ Database connected");
    // Initialize Socket.IO
    (0, socket_1.initSocket)(httpServer);
    logger_1.logger.info("✅ Socket.IO initialized");
    httpServer.listen(PORT, () => {
        logger_1.logger.info(`🚀 Sisters Kitchen API → http://localhost:${PORT}`);
        logger_1.logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    });
})
    .catch((error) => {
    logger_1.logger.error("❌ Database connection failed:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map