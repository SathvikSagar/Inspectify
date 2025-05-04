// // BACKEND/controllers/feedbackController.js
// import Feedback from "../models/Feedback.js";

// export const submitFeedback = async (req, res) => {
//   try {
//     const { name, email, subject, message } = req.body;
//     const feedback = new Feedback({ name, email, subject, message });
//     await feedback.save();
//     res.status(200).json({ message: "Feedback submitted successfully!" });
//   } catch (error) {
//     console.error("Feedback error:", error);
//     res.status(500).json({ message: "Error saving feedback!" });
//   }
// };
