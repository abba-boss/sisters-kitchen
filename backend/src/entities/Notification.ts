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
