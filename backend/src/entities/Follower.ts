import {
  Entity, PrimaryGeneratedColumn, CreateDateColumn,
  ManyToOne, JoinColumn,
} from "typeorm";
import { User }   from "./User";
import { Vendor } from "./Vendor";

@Entity("followers")
export class Follower {
  @PrimaryGeneratedColumn("uuid") id: string;
  @ManyToOne(() => User,   { onDelete: "CASCADE" }) @JoinColumn() follower: User;
  @ManyToOne(() => Vendor, { onDelete: "CASCADE" }) @JoinColumn() vendor: Vendor;
  @CreateDateColumn() createdAt: Date;
}
