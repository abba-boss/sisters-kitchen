"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemPoints = exports.claimDaily = exports.getHistory = exports.getWallet = void 0;
const database_1 = require("../config/database");
const RewardWallet_1 = require("../entities/RewardWallet");
const logger_1 = require("../utils/logger");
const walletRepo = () => database_1.AppDataSource.getRepository(RewardWallet_1.RewardWallet);
const txRepo = () => database_1.AppDataSource.getRepository(RewardWallet_1.RewardTransaction);
async function getOrCreateWallet(userId) {
    let wallet = await walletRepo().findOne({ where: { user: { id: userId } } });
    if (!wallet) {
        wallet = walletRepo().create({ user: { id: userId }, balance: 0, totalEarned: 0, totalSpent: 0 });
        wallet = await walletRepo().save(wallet);
    }
    return wallet;
}
// GET /rewards/wallet
const getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const wallet = await getOrCreateWallet(userId);
        res.json({ success: true, data: wallet });
    }
    catch (err) {
        logger_1.logger.error("getWallet:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getWallet = getWallet;
// GET /rewards/history
const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const wallet = await getOrCreateWallet(userId);
        const [transactions, total] = await txRepo().findAndCount({
            where: { wallet: { id: wallet.id } },
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
        });
        // Normalise: expose type as "credit" / "debit" for UI
        const data = transactions.map((t) => ({
            ...t,
            type: t.type.startsWith("earn") ? "credit" : "debit",
            points: Number(t.amount),
        }));
        res.json({ success: true, data, meta: { total, page, pages: Math.ceil(total / limit) } });
    }
    catch (err) {
        logger_1.logger.error("getHistory:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getHistory = getHistory;
// POST /rewards/daily  — claim daily check-in
const claimDaily = async (req, res) => {
    try {
        const userId = req.user.id;
        const wallet = await getOrCreateWallet(userId);
        const now = new Date();
        const last = wallet.lastDailyRewardAt ? new Date(wallet.lastDailyRewardAt) : null;
        const sameDay = last && last.toDateString() === now.toDateString();
        if (sameDay) {
            return res.status(400).json({ success: false, message: "Daily reward already claimed today" });
        }
        const DAILY_POINTS = 10;
        wallet.balance = Number(wallet.balance) + DAILY_POINTS;
        wallet.totalEarned = Number(wallet.totalEarned) + DAILY_POINTS;
        wallet.lastDailyRewardAt = now;
        const consecutiveDay = last && (now.getTime() - last.getTime()) < 2 * 86400000;
        wallet.streakDays = consecutiveDay ? (wallet.streakDays || 0) + 1 : 1;
        await walletRepo().save(wallet);
        const tx = txRepo().create({
            amount: DAILY_POINTS,
            type: RewardWallet_1.RewardTransactionType.EARN_DAILY,
            description: `Daily check-in reward (day ${wallet.streakDays})`,
            balanceAfter: wallet.balance,
            wallet: { id: wallet.id },
        });
        await txRepo().save(tx);
        res.json({ success: true, data: { points: DAILY_POINTS, balance: wallet.balance, streak: wallet.streakDays } });
    }
    catch (err) {
        logger_1.logger.error("claimDaily:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.claimDaily = claimDaily;
// POST /rewards/redeem
const redeemPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const { points, description } = req.body;
        if (!points || points <= 0)
            return res.status(400).json({ success: false, message: "Invalid points" });
        const wallet = await getOrCreateWallet(userId);
        if (Number(wallet.balance) < points) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        wallet.balance = Number(wallet.balance) - points;
        wallet.totalSpent = Number(wallet.totalSpent) + points;
        await walletRepo().save(wallet);
        const tx = txRepo().create({
            amount: -points,
            type: RewardWallet_1.RewardTransactionType.SPEND_DISCOUNT,
            description: description || "Points redeemed",
            balanceAfter: wallet.balance,
            wallet: { id: wallet.id },
        });
        await txRepo().save(tx);
        res.json({ success: true, data: { balance: wallet.balance } });
    }
    catch (err) {
        logger_1.logger.error("redeemPoints:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.redeemPoints = redeemPoints;
//# sourceMappingURL=rewardController.js.map