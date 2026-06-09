import { Router } from "express";
import { toggleFavorite, getMyFavorites } from "../controllers/favoriteController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/toggle", authenticate, toggleFavorite);
router.get("/", authenticate, getMyFavorites);

export default router;
