import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { RewardWallet } from "./RewardWallet";

export enum RewardTxType {
  EARN_ORDER     = "earn_order",
  EARN_REVIEW    = "earn_review",
  EARN_REFERRAL  = "earn_referral",
  EARN_DAILY     = "earn_daily",
  EARN_FOLLOW    = "earn_follow",
  EARN_POST_LIKE = "earn_post_like",
  SPEND_DISCOUNT = "spend_discount",
  SPEND_COUPON   = "spend_coupon",
  ADMIN_ADJUST   = "admin_adjust",
}

@Entity("reward_transactions")
export class RewardTransaction {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 }) amount: number;

  @Column({ type: "enum", enum: RewardTxType })
  type: RewardTxType;

  @Column({ length: 200 }) description: string;
  @Column({ nullable: true }) referenceId: string;   // orderId / postId etc.
  @Column({ type: "decimal", precision: 10, scale: 2 }) balanceAfter: number;

  @ManyToOne(() => RewardWallet, (w) => w.transactions, { onDelete: "CASCADE" })
  @JoinColumn() wallet: RewardWallet;

  @CreateDateColumn() createdAt: Date;
}
