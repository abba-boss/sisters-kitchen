import { User } from "./User";
import { Vendor } from "./Vendor";
import { OrderItem } from "./OrderItem";
import { Payment } from "./Payment";
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    READY = "ready",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare enum FulfillmentType {
    DELIVERY = "delivery",
    PICKUP = "pickup"
}
export declare class Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    pickupToken: string;
    pickupPin: string;
    pickupVerifiedAt: Date | null;
    pickupVerifiedBy: string;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    deliveryAddress: string;
    deliveryPhone: string;
    notes: string;
    estimatedDeliveryTime: string;
    rejectionReason: string;
    user: User;
    vendor: Vendor;
    items: OrderItem[];
    payments: Payment[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Order.d.ts.map