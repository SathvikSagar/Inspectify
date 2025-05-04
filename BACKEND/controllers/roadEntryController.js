// BACKEND/controllers/roadEntryController.js
import RoadEntry from "../models/RoadEntry.js";

export const getAllRoadEntries = async (req, res) => {
  try {
    const entries = await RoadEntry.find().sort({ timestamp: -1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching road entries:", error);
    res.status(500).json({ error: "Error fetching saved entries" });
  }
};
