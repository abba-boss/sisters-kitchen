import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare const getDashboardStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllUsers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleUserStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllVendorsAdmin: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map