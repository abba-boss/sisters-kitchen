import { Order } from "./Order";
import { Review } from "./Review";
import { Favorite } from "./Favorite";
import { Notification } from "./Notification";
import { Vendor } from "./Vendor";
export declare enum UserRole {
    CUSTOMER = "customer",
    VENDOR = "vendor",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    avatar: string;
    address: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    refreshToken: string;
    orders: Order[];
    reviews: Review[];
    favorites: Favorite[];
    notifications: Notification[];
    vendor: Vendor;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=User.d.ts.map