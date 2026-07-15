import { User } from "./User";
import { Product } from "./Product";
import { Vendor } from "./Vendor";
export declare class Review {
    id: string;
    rating: number;
    comment: string;
    images: string[];
    isVerifiedPurchase: boolean;
    user: User;
    product: Product;
    vendor: Vendor;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Review.d.ts.map