import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn, OneToMany,
} from "typeorm";
import { User } from "./User";
import { RewardTransaction } from "./RewardTransaction";

@Entity("reward_wallets")
export class RewardWallet {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  balance: number;          // Kitchen Coins balance

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ default: 0 }) streakDays: number;
  @Column({ nullable: true, type: "timestamp" }) lastActivityAt: Date;
  @Column({ nullable: true, type: "timestamp" }) lastDailyRewardAt: Date;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn() user: User;

  @OneToMany(() => RewardTransaction, (t) => t.wallet)
  transactions: RewardTransaction[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
