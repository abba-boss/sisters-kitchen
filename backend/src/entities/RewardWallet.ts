import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, OneToMany, ManyToOne, JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum RewardTransactionType {
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

@Entity("reward_wallets")
export class RewardWallet {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 }) balance: number;
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 }) totalEarned: number;
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 }) totalSpent: number;
  @Column({ default: 0 }) streakDays: number;
  @Column({ type: "timestamp", nullable: true }) lastActivityAt: Date;
  @Column({ type: "timestamp", nullable: true }) lastDailyRewardAt: Date;
  @OneToOne(() => User, { onDelete: "CASCADE" }) @JoinColumn() user: User;
  @OneToMany(() => RewardTransaction, (t) => t.wallet, { cascade: true }) transactions: RewardTransaction[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity("reward_transactions")
export class RewardTransaction {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "decimal", precision: 10, scale: 2 }) amount: number;
  @Column({ type: "enum", enum: RewardTransactionType }) type: RewardTransactionType;
  @Column({ length: 200 }) description: string;
  @Column({ nullable: true }) referenceId: string;
  @Column({ type: "decimal", precision: 10, scale: 2 }) balanceAfter: number;
  @ManyToOne(() => RewardWallet, (w) => w.transactions, { onDelete: "CASCADE" }) @JoinColumn() wallet: RewardWallet;
  @CreateDateColumn() createdAt: Date;
}
