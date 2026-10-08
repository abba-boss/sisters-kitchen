import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getWallet, getHistory, claimDaily, redeemPoints } from "../controllers/rewardController";

const router = Router();

router.get("/wallet",   authenticate, getWallet);
router.get("/history",  authenticate, getHistory);
router.post("/daily",   authenticate, claimDaily);
router.post("/redeem",  authenticate, redeemPoints);

export default router;
