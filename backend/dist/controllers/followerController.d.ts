import { Request, Response } from "express";
export declare const toggleFollow: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFollowStatus: (req: Request, res: Response) => Promise<void>;
export declare const getFollowers: (req: Request, res: Response) => Promise<void>;
export declare const getMyFollowing: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=followerController.d.ts.map