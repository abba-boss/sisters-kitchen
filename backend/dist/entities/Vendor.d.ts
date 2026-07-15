import { User } from "./User";
import { Product } from "./Product";
import { Order } from "./Order";
export declare enum VendorStatus {
    PENDING = "pending",
    APPROVED = "approved",
    SUSPENDED = "suspended"
}
export declare class Vendor {
    id: string;
    businessName: string;
    description: string;
    logo: string;
    coverImage: string;
    address: string;
    phone: string;
    whatsapp: string;
    rating: number;
    totalReviews: number;
    totalOrders: number;
    totalEarnings: number;
    status: VendorStatus;
    isOpen: boolean;
    openingTime: string;
    closingTime: string;
    availableDays: string[];
    bankName: string;
    accountNumber: string;
    accountName: string;
    user: User;
    products: Product[];
    orders: Order[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Vendor.d.ts.map