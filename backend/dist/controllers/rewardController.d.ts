import { Request, Response } from "express";
export declare const getWallet: (req: Request, res: Response) => Promise<void>;
export declare const getHistory: (req: Request, res: Response) => Promise<void>;
export declare const claimDaily: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const redeemPoints: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=rewardController.d.ts.map