"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardTransaction = exports.RewardWallet = exports.RewardTransactionType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var RewardTransactionType;
(function (RewardTransactionType) {
    RewardTransactionType["EARN_ORDER"] = "earn_order";
    RewardTransactionType["EARN_REVIEW"] = "earn_review";
    RewardTransactionType["EARN_REFERRAL"] = "earn_referral";
    RewardTransactionType["EARN_DAILY"] = "earn_daily";
    RewardTransactionType["EARN_FOLLOW"] = "earn_follow";
    RewardTransactionType["EARN_POST_LIKE"] = "earn_post_like";
    RewardTransactionType["SPEND_DISCOUNT"] = "spend_discount";
    RewardTransactionType["SPEND_COUPON"] = "spend_coupon";
    RewardTransactionType["ADMIN_ADJUST"] = "admin_adjust";
})(RewardTransactionType || (exports.RewardTransactionType = RewardTransactionType = {}));
let RewardWallet = class RewardWallet {
};
exports.RewardWallet = RewardWallet;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RewardWallet.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RewardWallet.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RewardWallet.prototype, "totalEarned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RewardWallet.prototype, "totalSpent", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], RewardWallet.prototype, "streakDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], RewardWallet.prototype, "lastActivityAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], RewardWallet.prototype, "lastDailyRewardAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", User_1.User)
], RewardWallet.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RewardTransaction, (t) => t.wallet, { cascade: true }),
    __metadata("design:type", Array)
], RewardWallet.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RewardWallet.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RewardWallet.prototype, "updatedAt", void 0);
exports.RewardWallet = RewardWallet = __decorate([
    (0, typeorm_1.Entity)("reward_wallets")
], RewardWallet);
let RewardTransaction = class RewardTransaction {
};
exports.RewardTransaction = RewardTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RewardTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], RewardTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: RewardTransactionType }),
    __metadata("design:type", String)
], RewardTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], RewardTransaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RewardTransaction.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], RewardTransaction.prototype, "balanceAfter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => RewardWallet, (w) => w.transactions, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", RewardWallet)
], RewardTransaction.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RewardTransaction.prototype, "createdAt", void 0);
exports.RewardTransaction = RewardTransaction = __decorate([
    (0, typeorm_1.Entity)("reward_transactions")
], RewardTransaction);
//# sourceMappingURL=RewardWallet.js.map