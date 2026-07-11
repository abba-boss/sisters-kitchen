import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { AppDataSource } from "./database";
import { User } from "../entities/User";

let io: SocketIOServer;

// Map userId → Set of socketIds (user may have multiple tabs)
const userSocketMap = new Map<string, Set<string>>();

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
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
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: decoded.userId, isActive: true } });

      if (!user) return next(new Error("Authentication error: User not found"));

      (socket as any).user = user;
      next();
    } catch {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as User;
    console.log(`🔌 Socket connected: ${user.email} (${socket.id})`);

    // Track user's sockets
    if (!userSocketMap.has(user.id)) {
      userSocketMap.set(user.id, new Set());
    }
    userSocketMap.get(user.id)!.add(socket.id);

    // Join role-based rooms
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    // Vendors join their own room
    if (user.role === "vendor") {
      // Join vendor room — we'll use userId as identifier and map to vendorId on emitting
      socket.join(`vendor:user:${user.id}`);
    }

    socket.on("join:order", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("leave:order", (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("disconnect", () => {
      const sockets = userSocketMap.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSocketMap.delete(user.id);
      }
      console.log(`🔌 Socket disconnected: ${user.email}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};

// ─── Emit helpers ──────────────────────────────────────────────

/** Emit to a specific user by their DB userId */
export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/** Emit to all admins */
export const emitToAdmins = (event: string, data: any) => {
  if (!io) return;
  io.to("role:admin").emit(event, data);
};

/** Emit order update to customer + vendor + admins watching it */
export const emitOrderUpdate = (order: any) => {
  if (!io) return;
  const payload = { order };
  // Customer
  emitToUser(order.user?.id || order.userId, "order:updated", payload);
  // Vendor (via vendor's user id)
  const vendorUserId = order.vendor?.user?.id || order.vendorUserId;
  if (vendorUserId) emitToUser(vendorUserId, "order:updated", payload);
  // Anyone subscribed to this specific order room
  io.to(`order:${order.id}`).emit("order:status_changed", payload);
  // Admins
  emitToAdmins("order:updated", payload);
};

/** Emit new notification to user */
export const emitNotification = (userId: string, notification: any) => {
  emitToUser(userId, "notification:new", notification);
};

// ─── V2 Social Commerce emit helpers ───────────────────────────

/** Broadcast a new post to followers (uses a "feed" room per vendor) */
export const emitNewPost = (vendorId: string, post: any) => {
  if (!io) return;
  io.to(`feed:vendor:${vendorId}`).emit("post:new", { post });
};

/** Like / unlike event on a post (visible to post author + followers) */
export const emitPostLike = (authorUserId: string, data: any) => {
  if (!io) return;
  emitToUser(authorUserId, "post:liked", data);
};

/** New comment event */
export const emitPostComment = (authorUserId: string, data: any) => {
  if (!io) return;
  emitToUser(authorUserId, "post:commented", data);
};

/** New follower event */
export const emitNewFollower = (vendorUserId: string, data: any) => {
  if (!io) return;
  emitToUser(vendorUserId, "vendor:new_follower", data);
};

/** Let a user join the feed room for a vendor they follow */
export const joinFeedRoom = (socket: any, vendorId: string) => {
  socket.join(`feed:vendor:${vendorId}`);
};
