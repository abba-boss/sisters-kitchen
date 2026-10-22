import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Vendor } from "./Vendor";

export enum MessageType {
  VENDOR_TO_ADMIN = "vendor_to_admin",
  ADMIN_TO_VENDOR = "admin_to_vendor",
}

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", enum: MessageType })
  type: MessageType;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "boolean", default: false })
  isRead: boolean;

  // Sender (can be vendor user or admin user)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "senderId" })
  sender: User;

  @Column()
  senderId: string;

  // Receiver (can be admin user or vendor user)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "receiverId" })
  receiver: User;

  @Column()
  receiverId: string;

  // For vendor messages, link to the vendor
  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: "vendorId" })
  vendor: Vendor;

  @Column({ nullable: true })
  vendorId: string;

  // For file attachments (optional - can be added later)
  @Column({ type: "text", nullable: true })
  attachments: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
