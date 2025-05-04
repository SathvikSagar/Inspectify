// BACKEND/routes/roadRoutes.js
import express from "express";
import { getAllRoadEntries } from "../controllers/roadEntryController.js";

const router = express.Router();

router.get("/road-data", getAllRoadEntries);
router.get("/road-entries", getAllRoadEntries);

export default router;
