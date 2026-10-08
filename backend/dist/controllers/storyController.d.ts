import { Request, Response } from "express";
export declare const getStoryFeed: (req: Request, res: Response) => Promise<void>;
export declare const getVendorStories: (req: Request, res: Response) => Promise<void>;
export declare const getMyStories: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createStory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const viewStory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteStory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=storyController.d.ts.map