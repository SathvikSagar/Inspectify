// BACKEND/models/RoadEntry.js
import mongoose from "mongoose";

const roadEntrySchema = new mongoose.Schema({
  imagePath: String,
  latitude: String,
  longitude: String,
  address: String,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("RoadEntry", roadEntrySchema, "roadloc");
