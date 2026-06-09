import { Router } from "express";
import { initializePayment, verifyPayment, getMyPayments, getPaymentReceipt } from "../controllers/paymentController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/initialize", authenticate, initializePayment);
router.get("/verify/:reference", verifyPayment); // public — Paystack callback
router.get("/my-payments", authenticate, getMyPayments);
router.get("/receipt/:id", authenticate, getPaymentReceipt);

export default router;
