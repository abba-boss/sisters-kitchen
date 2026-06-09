import { Request, Response, NextFunction } from "express";
import { validationResult, body, param, query } from "express-validator";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: (e as any).path, message: e.msg })),
    });
    return;
  }
  next();
};

// ── Auth validators ────────────────────────────────────────────
export const validateRegister = [
  body("firstName").trim().notEmpty().withMessage("First name is required").isLength({ max: 100 }),
  body("lastName").trim().notEmpty().withMessage("Last name is required").isLength({ max: 100 }),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["customer", "vendor"]).withMessage("Invalid role"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// ── Order validators ───────────────────────────────────────────
export const validateCreateOrder = [
  body("vendorId").isUUID().withMessage("Valid vendor ID required"),
  body("items").isArray({ min: 1 }).withMessage("At least one item required"),
  body("items.*.productId").isUUID().withMessage("Valid product ID required"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("deliveryAddress").trim().notEmpty().withMessage("Delivery address is required"),
  handleValidationErrors,
];

// ── Review validators ──────────────────────────────────────────
export const validateReview = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }).withMessage("Comment too long"),
  handleValidationErrors,
];

// ── Payment validators ─────────────────────────────────────────
export const validateInitPayment = [
  body("orderId").isUUID().withMessage("Valid order ID required"),
  body("method").isIn(["paystack", "cash_on_delivery", "bank_transfer"]).withMessage("Invalid payment method"),
  handleValidationErrors,
];
