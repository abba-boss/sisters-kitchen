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
import { Vendor } from "./Vendor";
import { Category } from "./Category";
import { OrderItem } from "./OrderItem";
import { Review } from "./Review";
import { Favorite } from "./Favorite";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discountPrice: number;

  @Column({ type: "simple-array", nullable: true })
  images: string[];

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isFreshToday: boolean;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: "float", default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: 0 })
  totalOrders: number;

  @Column({ nullable: true })
  preparationTime: string;

  @Column({ type: "simple-array", nullable: true })
  tags: string[];

  @ManyToOne(() => Vendor, (vendor) => vendor.products, { onDelete: "CASCADE" })
  @JoinColumn()
  vendor: Vendor;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn()
  category: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.product)
  favorites: Favorite[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
