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
    GENERAL = "general",
    NEW_POST_LIKE = "new_post_like",
    NEW_POST_COMMENT = "new_post_comment",
    NEW_FOLLOWER = "new_follower",
    POST_MENTION = "post_mention"
}
export declare class Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    link: string | null;
    referenceId: string | null;
    user: User;
    createdAt: Date;
}
//# sourceMappingURL=Notification.d.ts.map