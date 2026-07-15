import { Vendor } from "./Vendor";
import { Category } from "./Category";
import { OrderItem } from "./OrderItem";
import { Review } from "./Review";
import { Favorite } from "./Favorite";
export declare class Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discountPrice: number;
    images: string[];
    isAvailable: boolean;
    isFeatured: boolean;
    isFreshToday: boolean;
    stock: number;
    rating: number;
    totalReviews: number;
    totalOrders: number;
    preparationTime: string;
    tags: string[];
    vendor: Vendor;
    category: Category;
    orderItems: OrderItem[];
    reviews: Review[];
    favorites: Favorite[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Product.d.ts.map