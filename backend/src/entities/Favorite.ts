import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Product } from "./Product";

@Entity("favorites")
export class Favorite {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Product, (product) => product.favorites, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}
