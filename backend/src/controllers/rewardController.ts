import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { RewardWallet, RewardTransaction, RewardTransactionType } from "../entities/RewardWallet";
import { logger } from "../utils/logger";

const walletRepo = () => AppDataSource.getRepository(RewardWallet);
const txRepo     = () => AppDataSource.getRepository(RewardTransaction);

async function getOrCreateWallet(userId: string): Promise<RewardWallet> {
  let wallet = await walletRepo().findOne({ where: { user: { id: userId } } });
  if (!wallet) {
    wallet = walletRepo().create({ user: { id: userId } as any, balance: 0, totalEarned: 0, totalSpent: 0 });
    wallet = await walletRepo().save(wallet);
  }
  return wallet;
}

// GET /rewards/wallet
export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const wallet = await getOrCreateWallet(userId);
    res.json({ success: true, data: wallet });
  } catch (err) {
    logger.error("getWallet:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /rewards/history
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page   = parseInt(req.query.page as string) || 1;
    const limit  = Math.min(parseInt(req.query.limit as string) || 20, 50);

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
  } catch (err) {
    logger.error("getHistory:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /rewards/daily  — claim daily check-in
export const claimDaily = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const wallet = await getOrCreateWallet(userId);

    const now   = new Date();
    const last  = wallet.lastDailyRewardAt ? new Date(wallet.lastDailyRewardAt) : null;
    const sameDay = last && last.toDateString() === now.toDateString();

    if (sameDay) {
      return res.status(400).json({ success: false, message: "Daily reward already claimed today" });
    }

    const DAILY_POINTS = 10;
    wallet.balance         = Number(wallet.balance) + DAILY_POINTS;
    wallet.totalEarned     = Number(wallet.totalEarned) + DAILY_POINTS;
    wallet.lastDailyRewardAt = now;

    const consecutiveDay   = last && (now.getTime() - last.getTime()) < 2 * 86400_000;
    wallet.streakDays      = consecutiveDay ? (wallet.streakDays || 0) + 1 : 1;

    await walletRepo().save(wallet);

    const tx = txRepo().create({
      amount:      DAILY_POINTS,
      type:        RewardTransactionType.EARN_DAILY,
      description: `Daily check-in reward (day ${wallet.streakDays})`,
      balanceAfter: wallet.balance,
      wallet:      { id: wallet.id } as any,
    });
    await txRepo().save(tx);

    res.json({ success: true, data: { points: DAILY_POINTS, balance: wallet.balance, streak: wallet.streakDays } });
  } catch (err) {
    logger.error("claimDaily:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /rewards/redeem
export const redeemPoints = async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user.id;
    const { points, description } = req.body;
    if (!points || points <= 0) return res.status(400).json({ success: false, message: "Invalid points" });

    const wallet = await getOrCreateWallet(userId);
    if (Number(wallet.balance) < points) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    wallet.balance    = Number(wallet.balance) - points;
    wallet.totalSpent = Number(wallet.totalSpent) + points;
    await walletRepo().save(wallet);

    const tx = txRepo().create({
      amount:      -points,
      type:        RewardTransactionType.SPEND_DISCOUNT,
      description: description || "Points redeemed",
      balanceAfter: wallet.balance,
      wallet:      { id: wallet.id } as any,
    });
    await txRepo().save(tx);

    res.json({ success: true, data: { balance: wallet.balance } });
  } catch (err) {
    logger.error("redeemPoints:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};
