"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/initialize", auth_1.authenticate, paymentController_1.initializePayment);
router.get("/verify/:reference", paymentController_1.verifyPayment); // public — Paystack callback
router.get("/my-payments", auth_1.authenticate, paymentController_1.getMyPayments);
router.get("/receipt/:id", auth_1.authenticate, paymentController_1.getPaymentReceipt);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map