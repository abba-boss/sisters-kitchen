"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rewardController_1 = require("../controllers/rewardController");
const router = (0, express_1.Router)();
router.get("/wallet", auth_1.authenticate, rewardController_1.getWallet);
router.get("/history", auth_1.authenticate, rewardController_1.getHistory);
router.post("/daily", auth_1.authenticate, rewardController_1.claimDaily);
router.post("/redeem", auth_1.authenticate, rewardController_1.redeemPoints);
exports.default = router;
//# sourceMappingURL=rewardRoutes.js.map