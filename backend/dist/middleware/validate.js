"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInitPayment = exports.validateReview = exports.validateCreateOrder = exports.validateLogin = exports.validateRegister = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// ── Auth validators ────────────────────────────────────────────
exports.validateRegister = [
    (0, express_validator_1.body)("firstName").trim().notEmpty().withMessage("First name is required").isLength({ max: 100 }),
    (0, express_validator_1.body)("lastName").trim().notEmpty().withMessage("Last name is required").isLength({ max: 100 }),
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    (0, express_validator_1.body)("role").optional().isIn(["customer", "vendor"]).withMessage("Invalid role"),
    exports.handleValidationErrors,
];
exports.validateLogin = [
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    exports.handleValidationErrors,
];
// ── Order validators ───────────────────────────────────────────
exports.validateCreateOrder = [
    (0, express_validator_1.body)("vendorId").isUUID().withMessage("Valid vendor ID required"),
    (0, express_validator_1.body)("items").isArray({ min: 1 }).withMessage("At least one item required"),
    (0, express_validator_1.body)("items.*.productId").isUUID().withMessage("Valid product ID required"),
    (0, express_validator_1.body)("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    (0, express_validator_1.body)("deliveryAddress").trim().notEmpty().withMessage("Delivery address is required"),
    exports.handleValidationErrors,
];
// ── Review validators ──────────────────────────────────────────
exports.validateReview = [
    (0, express_validator_1.body)("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    (0, express_validator_1.body)("comment").optional().trim().isLength({ max: 1000 }).withMessage("Comment too long"),
    exports.handleValidationErrors,
];
// ── Payment validators ─────────────────────────────────────────
exports.validateInitPayment = [
    (0, express_validator_1.body)("orderId").isUUID().withMessage("Valid order ID required"),
    (0, express_validator_1.body)("method").isIn(["paystack", "cash_on_delivery", "bank_transfer"]).withMessage("Invalid payment method"),
    exports.handleValidationErrors,
];
//# sourceMappingURL=validate.js.map