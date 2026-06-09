import { Router } from "express";
import {
  register, login, refreshToken, logout, getMe, updateProfile, changePassword,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validateRegister, validateLogin } from "../middleware/validate";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

export default router;
