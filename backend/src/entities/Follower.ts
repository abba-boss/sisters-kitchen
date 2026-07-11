import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { Vendor } from "./Vendor";

@Entity("followers")
@Unique(["follower", "vendor"]) // one user can only follow a vendor once
export class Follower {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  follower: User;

  @ManyToOne(() => Vendor, { onDelete: "CASCADE" })
  @JoinColumn()
  vendor: Vendor;

  @CreateDateColumn()
  createdAt: Date;
}
