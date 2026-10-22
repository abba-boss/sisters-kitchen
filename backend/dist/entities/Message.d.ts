import { User } from "./User";
import { Vendor } from "./Vendor";
export declare enum MessageType {
    VENDOR_TO_ADMIN = "vendor_to_admin",
    ADMIN_TO_VENDOR = "admin_to_vendor"
}
export declare class Message {
    id: number;
    type: MessageType;
    content: string;
    isRead: boolean;
    sender: User;
    senderId: string;
    receiver: User;
    receiverId: string;
    vendor: Vendor;
    vendorId: string;
    attachments: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Message.d.ts.map