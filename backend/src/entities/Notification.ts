import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum NotificationType {
  // V1
  ORDER_PLACED    = "order_placed",
  ORDER_CONFIRMED = "order_confirmed",
  ORDER_PREPARING = "order_preparing",
  ORDER_READY     = "order_ready",
  ORDER_DELIVERED = "order_delivered",
  ORDER_CANCELLED = "order_cancelled",
  NEW_ORDER       = "new_order",
  PAYMENT_SUCCESS = "payment_success",
  PAYMENT_FAILED  = "payment_failed",
  VENDOR_APPROVED = "vendor_approved",
  GENERAL         = "general",
  // V2 Social
  NEW_POST_LIKE    = "new_post_like",
  NEW_POST_COMMENT = "new_post_comment",
  NEW_FOLLOWER     = "new_follower",
  POST_MENTION     = "post_mention",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  referenceId: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
