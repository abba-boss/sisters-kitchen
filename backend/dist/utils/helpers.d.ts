export declare const generateOrderNumber: () => string;
/**
 * Upload a local file to Cloudinary.
 * Falls back to serving locally if Cloudinary is not properly configured.
 */
export declare const uploadToCloudinary: (filePath: string, folder?: string) => Promise<string>;
export declare const deleteFromCloudinary: (imageUrl: string) => Promise<void>;
export declare const paginate: (page?: number, limit?: number) => {
    skip: number;
    take: number;
};
export declare const formatResponse: (success: boolean, message: string, data?: any, meta?: any) => {
    meta: any;
    success: boolean;
    message: string;
    data: any;
};
//# sourceMappingURL=helpers.d.ts.map