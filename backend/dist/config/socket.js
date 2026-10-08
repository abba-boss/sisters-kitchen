"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNotification = exports.emitOrderUpdate = exports.emitToAdmins = exports.emitToUser = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("./database");
const User_1 = require("../entities/User");
let io;
// Map userId → Set of socketIds (user may have multiple tabs)
const userSocketMap = new Map();
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                    return callback(null, true);
                }
                callback(new Error(`Socket CORS blocked: ${origin}`));
            },
            credentials: true,
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });
    // Auth middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(" ")[1];
            if (!token) {
                return next(new Error("Authentication error: No token"));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepo.findOne({ where: { id: decoded.userId, isActive: true } });
            if (!user)
                return next(new Error("Authentication error: User not found"));
            socket.user = user;
            next();
        }
        catch {
            next(new Error("Authentication error: Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.user;
        console.log(`🔌 Socket connected: ${user.email} (${socket.id})`);
        // Track user's sockets
        if (!userSocketMap.has(user.id)) {
            userSocketMap.set(user.id, new Set());
        }
        userSocketMap.get(user.id).add(socket.id);
        // Join role-based rooms
        socket.join(`user:${user.id}`);
        socket.join(`role:${user.role}`);
        // Vendors join their own room
        if (user.role === "vendor") {
            // Join vendor room — we'll use userId as identifier and map to vendorId on emitting
            socket.join(`vendor:user:${user.id}`);
        }
        socket.on("join:order", (orderId) => {
            socket.join(`order:${orderId}`);
        });
        socket.on("leave:order", (orderId) => {
            socket.leave(`order:${orderId}`);
        });
        socket.on("disconnect", () => {
            const sockets = userSocketMap.get(user.id);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0)
                    userSocketMap.delete(user.id);
            }
            console.log(`🔌 Socket disconnected: ${user.email}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket.IO not initialized");
    return io;
};
exports.getIO = getIO;
// ─── Emit helpers ──────────────────────────────────────────────
/** Emit to a specific user by their DB userId */
const emitToUser = (userId, event, data) => {
    if (!io)
        return;
    io.to(`user:${userId}`).emit(event, data);
};
exports.emitToUser = emitToUser;
/** Emit to all admins */
const emitToAdmins = (event, data) => {
    if (!io)
        return;
    io.to("role:admin").emit(event, data);
};
exports.emitToAdmins = emitToAdmins;
/** Emit order update to customer + vendor + admins watching it */
const emitOrderUpdate = (order) => {
    if (!io)
        return;
    const payload = { order };
    // Customer
    (0, exports.emitToUser)(order.user?.id || order.userId, "order:updated", payload);
    // Vendor (via vendor's user id)
    const vendorUserId = order.vendor?.user?.id || order.vendorUserId;
    if (vendorUserId)
        (0, exports.emitToUser)(vendorUserId, "order:updated", payload);
    // Anyone subscribed to this specific order room
    io.to(`order:${order.id}`).emit("order:status_changed", payload);
    // Admins
    (0, exports.emitToAdmins)("order:updated", payload);
};
exports.emitOrderUpdate = emitOrderUpdate;
/** Emit new notification to user */
const emitNotification = (userId, notification) => {
    (0, exports.emitToUser)(userId, "notification:new", notification);
};
exports.emitNotification = emitNotification;
//# sourceMappingURL=socket.js.map