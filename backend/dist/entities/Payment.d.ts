import { Order } from "./Order";
import { User } from "./User";
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum PaymentMethod {
    PAYSTACK = "paystack",
    CASH_ON_DELIVERY = "cash_on_delivery",
    BANK_TRANSFER = "bank_transfer"
}
export declare class Payment {
    id: string;
    reference: string;
    amount: number;
    status: PaymentStatus;
    method: PaymentMethod;
    paystackReference: string;
    metadata: object;
    order: Order;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Payment.d.ts.map