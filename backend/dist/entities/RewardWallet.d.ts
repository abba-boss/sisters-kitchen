import { User } from "./User";
export declare enum RewardTransactionType {
    EARN_ORDER = "earn_order",
    EARN_REVIEW = "earn_review",
    EARN_REFERRAL = "earn_referral",
    EARN_DAILY = "earn_daily",
    EARN_FOLLOW = "earn_follow",
    EARN_POST_LIKE = "earn_post_like",
    SPEND_DISCOUNT = "spend_discount",
    SPEND_COUPON = "spend_coupon",
    ADMIN_ADJUST = "admin_adjust"
}
export declare class RewardWallet {
    id: string;
    balance: number;
    totalEarned: number;
    totalSpent: number;
    streakDays: number;
    lastActivityAt: Date;
    lastDailyRewardAt: Date;
    user: User;
    transactions: RewardTransaction[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class RewardTransaction {
    id: string;
    amount: number;
    type: RewardTransactionType;
    description: string;
    referenceId: string;
    balanceAfter: number;
    wallet: RewardWallet;
    createdAt: Date;
}
//# sourceMappingURL=RewardWallet.d.ts.map