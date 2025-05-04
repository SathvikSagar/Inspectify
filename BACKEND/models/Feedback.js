// BACKEND/models/Feedback.js
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  dateSubmitted: { type: Date, default: Date.now },
});

export default mongoose.model("Feedback", feedbackSchema);
