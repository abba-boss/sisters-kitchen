
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Order } from "./Order";
import { User } from "./User";

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  PAYSTACK = "paystack",
  CASH_ON_DELIVERY = "cash_on_delivery",
  BANK_TRANSFER = "bank_transfer",
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: "varchar",
    length: 30,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: "varchar",
    length: 30,
    default: PaymentMethod.PAYSTACK,
  })
  method: PaymentMethod;

  @Column({ type: "varchar", nullable: true })
  paystackReference: string | null;

  @Column({ type: "simple-json", nullable: true })
  metadata: object | null;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn()
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

