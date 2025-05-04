// BACKEND/routes/predictionRoutes.js
import express from "express";
import upload from "../middleware/upload.js";
import { predict, analyzeDamage } from "../controllers/predictionController.js";

const router = express.Router();

router.post("/predict", upload.single("image"), predict);
router.post("/analyze-damage", upload.single("image"), analyzeDamage);

export default router;
