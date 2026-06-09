import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Product } from "./Product";
import { Vendor } from "./Vendor";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int" })
  rating: number;

  @Column({ type: "text", nullable: true })
  comment: string;

  @Column({ type: "simple-array", nullable: true })
  images: string[];

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, { nullable: true })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn()
  vendor: Vendor;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
