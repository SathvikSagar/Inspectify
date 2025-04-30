import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import multer from "multer";
import { spawn } from "child_process";
import fs from "fs";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection (Safestreet DB)
const MONGO_URI = "mongodb://localhost:27017/Safestreet";
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(" MongoDB connected to Safestreet"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const db = mongoose.connection.useDb("Safestreet");
const loginCollection = db.collection("login");

// ✅ Feedback Schema
const feedbackSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  dateSubmitted: { type: Date, default: Date.now },
});
const Feedback = db.model("Feedback", feedbackSchema);

// ✅ RoadEntry Schema — uses roadloc collection now
const RoadEntry = db.model(
  "RoadEntry",
  new mongoose.Schema({
    imagePath: String,
    latitude: String,
    longitude: String,
    address: String,
    timestamp: { type: Date, default: Date.now },
  }),
  "roadloc" // 👈 Force to use 'roadloc' collection
);

// ✅ Multer Setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Prediction Route (with Auto Save if Road)
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image file received!" });
    }

    const tempImagePath = `temp_${Date.now()}.jpg`;
    fs.writeFileSync(tempImagePath, req.file.buffer);

    const pythonProcess = spawn("python", ["models/predict.py", tempImagePath]);

    pythonProcess.stdout.on("data", async (data) => {
      const result = data.toString().trim();
      console.log("Prediction:", result);

      fs.unlinkSync(tempImagePath); // Clean up temp file

      // Auto-save if result is "road"
      if (result.toLowerCase() === "road") {
        const savedImagePath = `uploads/${Date.now()}_road.jpg`;
        fs.writeFileSync(savedImagePath, req.file.buffer);

        const entry = new RoadEntry({
          imagePath: savedImagePath,
          latitude,
          longitude,
          address,
        });

        await entry.save();
        console.log("✅ Road entry auto-saved.");
      }

      res.json({ prediction: result });
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
      res.status(500).json({ error: "Prediction failed" });
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Route to Get All Saved Road Entries (for History/Saved tab)
app.get("/api/road-entries", async (req, res) => {
  try {
    const entries = await RoadEntry.find().sort({ timestamp: -1 }); // Latest first
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching road entries:", error);
    res.status(500).json({ error: "Error fetching saved entries" });
  }
});
// ✅ Damage Analysis Route (runs detect.py)
app.post("/analyze-damage", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded!" });
    }

    const tempImagePath = `temp_${Date.now()}.jpg`;
    fs.writeFileSync(tempImagePath, req.file.buffer);  // Save the image temporarily

    const pythonProcess = spawn("python", ["models/detect.py", tempImagePath]);

    let resultData = "";

    pythonProcess.stdout.on("data", (data) => {
      resultData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      fs.unlinkSync(tempImagePath); // Cleanup temp file after analysis
      if (code === 0) {
        try {
          const parsed = JSON.parse(resultData);  // Parse the output from Python
          res.status(200).json(parsed);  // Return the analysis result
        } catch (err) {
          console.error("JSON parsing error:", err);
          res.status(500).json({ error: "Error parsing detection result" });
        }
      } else {
        res.status(500).json({ error: "Detection process failed" });
      }
    });
  } catch (error) {
    console.error("Analyze Damage Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Feedback Route
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const feedback = new Feedback({ name, email, subject, message });
    await feedback.save();
    res.status(200).json({ message: "Feedback submitted successfully!" });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Error saving feedback!" });
  }
});



// ✅ Signup Route
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const existingUser = await loginCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword };
    await loginCollection.insertOne(newUser);

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await loginCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ message: "Login successful!" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
