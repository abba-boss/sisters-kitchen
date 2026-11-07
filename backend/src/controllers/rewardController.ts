import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { RewardWallet, RewardTransaction, RewardTransactionType } from "../entities/RewardWallet";
import { logger } from "../utils/logger";

const walletRepo = () => AppDataSource.getRepository(RewardWallet);
const txRepo     = () => AppDataSource.getRepository(RewardTransaction);

// The rewards page fires wallet + history in parallel. TypeORM's SQLite driver
// shares one connection, so concurrent lazy wallet creation collides on the
// unique userId index. Serialise creation per user inside the process and keep
// a DB-level fallback for the multi-process case.
const walletCreates = new Map<string, Promise<RewardWallet>>();

async function getOrCreateWallet(userId: string): Promise<RewardWallet> {
  const existing = await walletRepo().findOne({ where: { user: { id: userId } } });
  if (existing) return existing;

  const inflight = walletCreates.get(userId);
  if (inflight) return inflight;

  const creating = (async () => {
    try {
      return await walletRepo().save(
        walletRepo().create({ user: { id: userId } as any, balance: 0, totalEarned: 0, totalSpent: 0 })
      );
    } catch (err: any) {
      // Another process won the insert — use the row it created.
      for (let attempt = 0; attempt < 5; attempt++) {
        const raced = await walletRepo().findOne({ where: { user: { id: userId } } });
        if (raced) return raced;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw err;
    }
  })().finally(() => walletCreates.delete(userId));

  walletCreates.set(userId, creating);
  return creating;
}

// Serialise balance-changing operations per user. Without this, N parallel
// "claim daily" clicks all read the same balance/date and each write a reward
// row, inflating the ledger and losing updates.
const userLocks = new Map<string, Promise<unknown>>();

async function withUserLock<T>(userId: string, task: () => Promise<T>): Promise<T> {
  const previous = userLocks.get(userId) ?? Promise.resolve();
  const current  = previous.then(task, task);
  const tracked  = current.catch(() => undefined);
  userLocks.set(userId, tracked);
  try {
    return await current;
  } finally {
    if (userLocks.get(userId) === tracked) userLocks.delete(userId);
  }
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
    await withUserLock(userId, () => claimDailyFor(userId, res));
  } catch (err) {
    logger.error("claimDaily:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

async function claimDailyFor(userId: string, res: Response) {
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
}

// POST /rewards/redeem
export const redeemPoints = async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user.id;
    const { points, description } = req.body;
    if (!points || points <= 0) return res.status(400).json({ success: false, message: "Invalid points" });

    const outcome = await withUserLock(userId, async () => {
      const wallet = await getOrCreateWallet(userId);
      if (Number(wallet.balance) < points) {
        return { error: "Insufficient balance" as const };
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

      return { balance: wallet.balance };
    });

    if ("error" in outcome) {
      return res.status(400).json({ success: false, message: outcome.error });
    }
    res.json({ success: true, data: { balance: outcome.balance } });
  } catch (err) {
    logger.error("redeemPoints:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};
