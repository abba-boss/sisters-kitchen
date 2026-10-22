import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getConversations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMessagesWithUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUnreadCount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteMessage: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=messageController.d.ts.map