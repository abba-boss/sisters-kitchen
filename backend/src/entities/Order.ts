import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Vendor } from "./Vendor";
import { OrderItem } from "./OrderItem";
import { Payment } from "./Payment";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total: number;

  @Column({ type: "text", nullable: true })
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryPhone: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ nullable: true })
  estimatedDeliveryTime: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Vendor, (vendor) => vendor.orders)
  @JoinColumn()
  vendor: Vendor;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
