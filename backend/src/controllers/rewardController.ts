import { Response } from "express";
import { AppDataSource } from "../config/database";
import { RewardWallet } from "../entities/RewardWallet";
import { RewardTransaction, RewardTxType } from "../entities/RewardTransaction";
import { AuthRequest } from "../middleware/auth";

// ── Reward rates (Kitchen Coins per action) ───────────────────────
export const REWARD_RATES = {
  ORDER_PER_100_NAIRA : 1,   // 1 coin per ₦100 spent
  REVIEW              : 10,
  FOLLOW_VENDOR       : 5,
  DAILY_LOGIN         : 3,
  REFERRAL            : 50,
  POST_LIKE           : 1,
};

// ── Internal: ensure wallet exists, credit / debit ────────────────
export async function ensureWallet(userId: string): Promise<RewardWallet> {
  const { User } = await import("../entities/User");
  const walletRepo = AppDataSource.getRepository(RewardWallet);
  const userRepo   = AppDataSource.getRepository(User);

  let wallet = await walletRepo.findOne({ where: { user: { id: userId } } });
  if (!wallet) {
    const user   = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    wallet = walletRepo.create({ user, balance: 0, totalEarned: 0, totalSpent: 0 });
    await walletRepo.save(wallet);
  }
  return wallet;
}

export async function creditCoins(
  userId: string,
  amount: number,
  type: RewardTxType,
  description: string,
  referenceId?: string
): Promise<RewardTransaction> {
  const walletRepo = AppDataSource.getRepository(RewardWallet);
  const txRepo     = AppDataSource.getRepository(RewardTransaction);

  const wallet = await ensureWallet(userId);
  wallet.balance      = Number(wallet.balance)      + amount;
  wallet.totalEarned  = Number(wallet.totalEarned)  + amount;
  wallet.lastActivityAt = new Date();
  await walletRepo.save(wallet);

  const tx = txRepo.create({
    amount, type, description,
    referenceId,
    balanceAfter: wallet.balance,
    wallet,
  });
  await txRepo.save(tx);
  return tx;
}

export async function debitCoins(
  userId: string,
  amount: number,
  type: RewardTxType,
  description: string,
  referenceId?: string
): Promise<RewardTransaction> {
  const walletRepo = AppDataSource.getRepository(RewardWallet);
  const txRepo     = AppDataSource.getRepository(RewardTransaction);

  const wallet = await ensureWallet(userId);
  if (Number(wallet.balance) < amount) throw new Error("Insufficient coins");

  wallet.balance      = Number(wallet.balance) - amount;
  wallet.totalSpent   = Number(wallet.totalSpent) + amount;
  await walletRepo.save(wallet);

  const tx = txRepo.create({
    amount: -amount, type, description,
    referenceId,
    balanceAfter: wallet.balance,
    wallet,
  });
  await txRepo.save(tx);
  return tx;
}

// ── API handlers ──────────────────────────────────────────────────

export const getMyWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallet = await ensureWallet(req.user!.id);
    const txRepo = AppDataSource.getRepository(RewardTransaction);
    const recentTx = await txRepo.find({
      where: { wallet: { id: wallet.id } },
      order: { createdAt: "DESC" },
      take: 20,
    });
    res.json({ success: true, data: { ...wallet, recentTransactions: recentTx } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const wallet = await ensureWallet(req.user!.id);
    const txRepo = AppDataSource.getRepository(RewardTransaction);
    const [txs, total] = await txRepo.findAndCount({
      where: { wallet: { id: wallet.id } },
      order: { createdAt: "DESC" },
      skip,
      take: Number(limit),
    });
    res.json({
      success: true,
      data: txs,
      meta: { total, page: Number(page), limit: Number(limit), balance: wallet.balance },
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const claimDailyReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallet = await ensureWallet(req.user!.id);
    const now    = new Date();

    // Check if already claimed today
    if (wallet.lastDailyRewardAt) {
      const lastClaim  = new Date(wallet.lastDailyRewardAt);
      const sameDay    = lastClaim.toDateString() === now.toDateString();
      if (sameDay) {
        res.status(400).json({
          success: false,
          message: "Daily reward already claimed today!",
          nextClaimAt: new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000),
        });
        return;
      }
    }

    // Update streak
    const yesterday  = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = wallet.lastDailyRewardAt &&
      new Date(wallet.lastDailyRewardAt).toDateString() === yesterday.toDateString();

    const newStreak = wasYesterday ? (wallet.streakDays || 0) + 1 : 1;
    const bonus     = Math.min(Math.floor(newStreak / 7), 5); // extra coin every 7 days streak, max 5
    const coins     = REWARD_RATES.DAILY_LOGIN + bonus;

    const walletRepo = AppDataSource.getRepository(RewardWallet);
    wallet.lastDailyRewardAt = now;
    wallet.streakDays = newStreak;
    await walletRepo.save(wallet);

    const tx = await creditCoins(
      req.user!.id, coins, RewardTxType.EARN_DAILY,
      `Daily login reward${newStreak > 1 ? ` · ${newStreak}-day streak!` : ""}`,
    );

    res.json({
      success: true,
      message: `You earned ${coins} Kitchen Coins! 🎉`,
      data: { coins, streak: newStreak, balanceAfter: tx.balanceAfter },
    });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

/** 10 Kitchen Coins = ₦100 off. */
export const COINS_PER_NAIRA = 10;

export const redeemCoins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, orderId } = req.body;
    let coins = Number(amount);

    if (!orderId) {
      res.status(400).json({ success: false, message: "Apply coins to a specific order" });
      return;
    }
    if (!Number.isInteger(coins) || coins < COINS_PER_NAIRA) {
      res.status(400).json({
        success: false,
        message: `Redeem at least ${COINS_PER_NAIRA} coins`,
      });
      return;
    }
    coins -= coins % COINS_PER_NAIRA; // only whole ₦100 blocks are redeemable

    const { Order, OrderStatus } = await import("../entities/Order");
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: orderId } });

    if (!order || order.user.id !== req.user!.id) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({
        success: false,
        message: "Coins can only be applied before the kitchen accepts your order",
      });
      return;
    }

    const wallet = await ensureWallet(req.user!.id);
    if (Number(wallet.balance) < coins) {
      res.status(400).json({
        success: false,
        message: `You only have ${Math.floor(Number(wallet.balance))} coins`,
      });
      return;
    }

    const maxDiscount = Number(order.subtotal);
    const discountNaira = Math.min(Math.floor(coins / COINS_PER_NAIRA) * 100, maxDiscount);
    if (discountNaira <= 0) {
      res.status(400).json({ success: false, message: "This order cannot take a discount" });
      return;
    }
    const coinsSpent = Math.ceil(discountNaira / 100) * COINS_PER_NAIRA;

    const tx = await debitCoins(
      req.user!.id,
      coinsSpent,
      RewardTxType.SPEND_DISCOUNT,
      `Redeemed ${coinsSpent} coins for ₦${discountNaira} off order #${order.orderNumber}`,
      order.id
    );

    order.discount = Number(order.discount || 0) + discountNaira;
    order.total = Math.max(Number(order.subtotal) + Number(order.deliveryFee) - Number(order.discount), 0);
    await orderRepo.save(order);

    res.json({
      success: true,
      message: `Applied ₦${discountNaira.toLocaleString()} off your order`,
      data: {
        coinsSpent,
        discountNaira,
        balanceAfter: tx.balanceAfter,
        orderTotal: Number(order.total),
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
