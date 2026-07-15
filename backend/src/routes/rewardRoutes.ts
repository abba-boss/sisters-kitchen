import { Router } from "express";
import { getMyWallet, getTransactionHistory, claimDailyReward, redeemCoins } from "../controllers/rewardController";
import { authenticate } from "../middleware/auth";
const router = Router();
router.get("/wallet",   authenticate, getMyWallet);
router.get("/history",  authenticate, getTransactionHistory);
router.post("/daily",   authenticate, claimDailyReward);
router.post("/redeem",  authenticate, redeemCoins);
export default router;
