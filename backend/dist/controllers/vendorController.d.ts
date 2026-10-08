import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare const getAllVendors: (req: Request, res: Response) => Promise<void>;
export declare const getVendorById: (req: Request, res: Response) => Promise<void>;
export declare const getMyVendorProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateVendorProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleVendorStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getVendorStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateVendorApproval: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=vendorController.d.ts.map