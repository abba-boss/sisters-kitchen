import { Request, Response } from "express";
export declare const getFeed: (req: Request, res: Response) => Promise<void>;
export declare const getVendorPosts: (req: Request, res: Response) => Promise<void>;
export declare const getMyPosts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSavedPosts: (req: Request, res: Response) => Promise<void>;
export declare const getPost: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPost: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePost: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePost: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleLike: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleSave: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getComments: (req: Request, res: Response) => Promise<void>;
export declare const addComment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteComment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=postController.d.ts.map