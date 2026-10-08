import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
export declare const initSocket: (httpServer: HTTPServer) => SocketIOServer;
export declare const getIO: () => SocketIOServer;
/** Emit to a specific user by their DB userId */
export declare const emitToUser: (userId: string, event: string, data: any) => void;
/** Emit to all admins */
export declare const emitToAdmins: (event: string, data: any) => void;
/** Emit order update to customer + vendor + admins watching it */
export declare const emitOrderUpdate: (order: any) => void;
/** Emit new notification to user */
export declare const emitNotification: (userId: string, notification: any) => void;
//# sourceMappingURL=socket.d.ts.map