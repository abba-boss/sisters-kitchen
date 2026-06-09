import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  subtotal: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn()
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}
