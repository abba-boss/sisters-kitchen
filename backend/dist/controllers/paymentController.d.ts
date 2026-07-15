import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare const initializePayment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const verifyPayment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMyPayments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPaymentReceipt: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map