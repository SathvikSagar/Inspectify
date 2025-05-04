import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import multer from "multer";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { Server } from "socket.io";
import http from "http";

// Load environment variables
dotenv.config();

// Initialize Express and HTTP Server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Change to your frontend URL in production
    methods: ["GET", "POST"]
  }
});
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// ✅ MongoDB Connection (Safestreet DB)
const MONGO_URI = "mongodb://localhost:27017/Safestreet";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected to Safestreet"))
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

// ✅ RoadEntry Schema
const RoadEntry = db.model("RoadEntry", new mongoose.Schema({
  imagePath: String,
  latitude: String,
  longitude: String,
  address: String,
  timestamp: { type: Date, default: Date.now },
}), "roadloc");

// ✅ Multer Setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ WebSocket - on client connection
io.on("connection", (socket) => {
  console.log("🟢 Client connected via WebSocket");

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected");
  });
});

// ✅ Prediction Route
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

      fs.unlinkSync(tempImagePath);

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
    
        // ✅ Emit WebSocket event to all clients
        io.emit("new-road-entry", {
            imagePath: savedImagePath,
            latitude,
            longitude,
            address,
            timestamp: entry.timestamp,
        });
    
        // ✅ Emit a notification to the admin (send a specific event to admin clients)
        io.emit("admin-notification", {
            message: "New image uploaded by a user. Please review.",
            imagePath: savedImagePath,
            timestamp: entry.timestamp,
        });
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

// ✅ Get All Road Entries
app.get("/api/road-entries", async (req, res) => {
  try {
    const entries = await RoadEntry.find().sort({ timestamp: -1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching road entries:", error);
    res.status(500).json({ error: "Error fetching saved entries" });
  }
});

// ✅ Damage Detection
app.post("/analyze-damage", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file uploaded!" });

    const originalName = req.file.originalname.replace(/\s+/g, '_');
    const finalImagePath = `uploads/${originalName}`;
    fs.writeFileSync(finalImagePath, req.file.buffer);

    const pythonProcess = spawn("python", ["models/detect.py", finalImagePath]);

    let resultData = "";
    pythonProcess.stdout.on("data", (data) => resultData += data.toString());
    pythonProcess.stderr.on("data", (data) => console.error("Python error:", data.toString()));

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(resultData);
          res.status(200).json(parsed);
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

// ✅ Road Data Route
app.get('/api/road-data', async (req, res) => {
  try {
    const roadData = await RoadEntry.find();
    res.status(200).json(roadData);
  } catch (error) {
    console.error('Error fetching road data:', error);
    res.status(500).json({ error: 'Server error. Could not fetch data.' });
  }
});

// ✅ Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required!" });

    const existingUser = await loginCollection.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await loginCollection.insertOne({ name, email, password: hashedPassword });

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginCollection.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json({ message: "Login successful!" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Save Canvas Image with Metadata
app.post("/save-canvas", async (req, res) => {
  try {
    const { imageBase64, latitude, longitude, address } = req.body;
    if (!imageBase64 || !latitude || !longitude || !address) {
      return res.status(400).json({ error: "Missing data!" });
    }

    const base64Prefix = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (!base64Prefix) {
      return res.status(400).json({ error: "Invalid base64 image format." });
    }

    const extension = base64Prefix[1].split("/")[1];
    const filename = `final/${Date.now()}_canvas.${extension}`;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filename, Buffer.from(base64Data, "base64"));

    const entry = new RoadEntry({ imagePath: filename, latitude, longitude, address });
    await entry.save();

    // ✅ Emit to WebSocket clients
    io.emit("new-road-entry", {
      imagePath: filename,
      latitude,
      longitude,
      address,
      timestamp: entry.timestamp
    });

    res.status(200).json({ message: "Canvas image saved successfully!" });
  } catch (error) {
    console.error("Error saving canvas image:", error);
    res.status(500).json({ error: "Server error saving canvas image." });
  }
});

// ✅ Start Server with WebSocket
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
