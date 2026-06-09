import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Product } from "./Product";
import { Order } from "./Order";

export enum VendorStatus {
  PENDING = "pending",
  APPROVED = "approved",
  SUSPENDED = "suspended",
}

@Entity("vendors")
export class Vendor {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 150 })
  businessName: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ type: "float", default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: 0 })
  totalOrders: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({
    type: "enum",
    enum: VendorStatus,
    default: VendorStatus.PENDING,
  })
  status: VendorStatus;

  @Column({ default: false })
  isOpen: boolean;

  @Column({ nullable: true })
  openingTime: string;

  @Column({ nullable: true })
  closingTime: string;

  @Column({ type: "simple-array", nullable: true })
  availableDays: string[];

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  accountName: string;

  @OneToOne(() => User, (user) => user.vendor)
  @JoinColumn()
  user: User;

  @OneToMany(() => Product, (product) => product.vendor)
  products: Product[];

  @OneToMany(() => Order, (order) => order.vendor)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
