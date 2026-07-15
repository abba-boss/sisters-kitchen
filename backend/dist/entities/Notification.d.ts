import { User } from "./User";
export declare enum NotificationType {
    ORDER_PLACED = "order_placed",
    ORDER_CONFIRMED = "order_confirmed",
    ORDER_PREPARING = "order_preparing",
    ORDER_READY = "order_ready",
    ORDER_DELIVERED = "order_delivered",
    ORDER_CANCELLED = "order_cancelled",
    NEW_ORDER = "new_order",
    PAYMENT_SUCCESS = "payment_success",
    PAYMENT_FAILED = "payment_failed",
    VENDOR_APPROVED = "vendor_approved",
    GENERAL = "general"
}
export declare class Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    link: string;
    referenceId: string;
    user: User;
    createdAt: Date;
}
//# sourceMappingURL=Notification.d.ts.map