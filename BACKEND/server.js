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
import nodemailer from "nodemailer";

dotenv.config();

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Safestreet";
const __dirname = path.resolve();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
// Increase JSON payload limit to handle large base64 images
app.use(express.json({ limit: '50mb' }));
// Increase URL-encoded payload limit as well
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/final", express.static(path.join(__dirname, "final")));

["uploads", "final"].forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath);
});

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB connected");
    
    // Create geospatial index on FinalImage collection after connection
    mongoose.connection.useDb("Safestreet").collection("final_img").createIndex(
      { "location": "2dsphere" },
      { background: true }
    ).then(() => {
      console.log("✅ Geospatial index created on final_img collection");
    }).catch(err => {
      console.error("❌ Error creating geospatial index:", err);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const db = mongoose.connection.useDb("Safestreet");
const loginCollection = db.collection("login");

const feedbackSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  completed: { type: Boolean, default: false },
  dateSubmitted: { type: Date, default: Date.now },
  userId: { type: String }, // Add userId to track which user submitted the feedback
  replied: { type: Boolean, default: false }, // Track if a reply has been sent
  replyText: String, // Store the reply text
  replyDate: Date, // Store when the reply was sent
});
const Feedback = db.model("Feedback", feedbackSchema);

// Create the schema first
const roadEntrySchema = new mongoose.Schema({
  imagePath: String,
  latitude: String,
  longitude: String,
  address: String,
  timestamp: { type: Date, default: Date.now },
  reviewed: { type: Boolean, default: false },
  reviewStatus: { type: String, enum: ['approved', 'rejected', 'pending', 'in-progress'], default: 'pending' },
  reviewNotes: { type: String, default: '' },
  severity: { type: String, enum: ['low', 'moderate', 'high', 'severe', 'unknown'], default: 'unknown' },
  damageType: { 
    type: mongoose.Schema.Types.Mixed, // Use Mixed type to accept both string and array
    default: ['pothole']
  },
  recommendedAction: { type: String, default: '' },
  reviewDate: { type: Date },
  userId: { type: String, required: true },  // To identify which user uploaded the image
  reviewerId: { type: String },  // To identify which admin/user reviewed the image
});

// Add a pre-save hook to ensure damageType is always an array
roadEntrySchema.pre('save', function(next) {
  // Convert string to array if needed
  if (typeof this.damageType === 'string') {
    this.damageType = [this.damageType];
  }
  
  // Ensure it's an array
  if (!Array.isArray(this.damageType)) {
    this.damageType = ['pothole'];
  }
  
  next();
});

// Create the model
const RoadEntry = db.model("RoadEntry", roadEntrySchema, "roadloc");

const FinalImage = db.model(
  "FinalImage",
  new mongoose.Schema({
    imagePath: String,  // Original image path
    boundingBoxImagePath: String,  // Path to the image with bounding boxes
    latitude: Number,  // Changed from String to Number for better geospatial queries
    longitude: Number,  // Changed from String to Number for better geospatial queries
    address: String,
    analysisResult: Object,  // Full analysis result from the AI model
    status: { type: String, enum: ['Pending', 'Critical', 'Processed', 'Resolved'], default: 'Pending' },
    severity: { type: Number, default: 50 },  // Numeric severity value (0-100)
    severityLevel: { type: String, enum: ['low', 'moderate', 'high', 'severe', 'unknown'], default: 'unknown' },
    userId: { type: String, required: true },  // User who uploaded the image
    processingTime: Number,  // Time taken to process the image in seconds
    timestamp: { type: Date, default: Date.now },
    damageType: { type: String, default: 'unknown' },  // Type of damage detected
    detectionCount: { type: Number, default: 0 },  // Number of detections in the image
    reviewed: { type: Boolean, default: false },  // Whether the image has been reviewed
    reviewerId: { type: String },  // ID of the reviewer
    reviewDate: { type: Date },  // Date of review
    reviewNotes: { type: String },  // Notes from the reviewer
    recommendedAction: { type: String },  // Recommended action from the reviewer
    // Add geospatial index for location-based queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }  // [longitude, latitude]
    }
  }, {
    timestamps: true  // Adds createdAt and updatedAt fields
  }),
  "final_img"
);

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for uploaded files
  }
});

// Track user connections with their userId
const userSockets = new Map(); // Map userId -> socket.id

io.on("connection", (socket) => {
  console.log("🟢 WebSocket client connected:", socket.id);
  
  // Handle user authentication
  socket.on("authenticate", (userId) => {
    if (userId) {
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
      userSockets.set(userId, socket.id);
      socket.userId = userId; // Store userId in socket object for reference
      
      // Log all connected users after new connection
      console.log("Currently connected users:");
      for (const [uid, sid] of userSockets.entries()) {
        console.log(`- User ${uid} -> Socket ${sid}`);
      }
    } else {
      console.log("Authentication received but no userId provided");
    }
  });
  
  // Handle reconnection
  socket.on("reconnect", (attemptNumber) => {
    console.log(`Socket ${socket.id} reconnected after ${attemptNumber} attempts`);
  });
  
  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`🔴 Client disconnected: ${socket.id}, Reason: ${reason}`);
    // Remove user from tracking when they disconnect
    if (socket.userId) {
      console.log(`Removing user ${socket.userId} from connected users`);
      userSockets.delete(socket.userId);
      
      // Log remaining connected users
      console.log("Remaining connected users:");
      for (const [uid, sid] of userSockets.entries()) {
        console.log(`- User ${uid} -> Socket ${sid}`);
      }
    }
  });
});

const getFormattedTimestamp = () => {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[-T:\.Z]/g, "")
    .slice(0, 15);
};

// --- /predict ---
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const { latitude, longitude, address, userId } = req.body;
    if (!req.file) return res.status(400).json({ error: "No image file received!" });

    const timestamp = getFormattedTimestamp();
    const tempImagePath = `temp_${timestamp}.jpg`;
    fs.writeFileSync(tempImagePath, req.file.buffer);

    const pythonProcess = spawn("python", ["models/predict.py", tempImagePath]);

    let predictionResult = "";

    pythonProcess.stdout.on("data", async (data) => {
      predictionResult += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    pythonProcess.on("close", async (code) => {
      fs.unlinkSync(tempImagePath);

      // Extract just the prediction (Road or Not a Road) from the output
      // The output now includes confidence information
      const outputLines = predictionResult.trim().split('\n');
      const lastLine = outputLines[outputLines.length - 1];
      const result = lastLine.split(' ')[0]; // Get just "Road" or "Not a Road"
      
      console.log("Python prediction output:", predictionResult.trim());
      console.log("Extracted result:", result);
      
      if (code !== 0) {
        return res.status(500).json({ error: "Prediction process failed" });
      }

      let savedImagePath = null;
      
      if (result.toLowerCase() === "road") {
        const originalName = req.file.originalname.replace(/\s+/g, "_");
        const filename = `${originalName.split(".")[0]}_${timestamp}.jpg`;
        savedImagePath = path.join("uploads", filename);
        fs.writeFileSync(path.join(__dirname, savedImagePath), req.file.buffer);

        // Save with userId (required)
        if (!userId) {
          return res.status(400).json({ error: "User ID is required for image uploads" });
        }
        
        const entry = new RoadEntry({ 
          imagePath: savedImagePath, 
          latitude, 
          longitude, 
          address,
          userId: userId // Store the user ID
        });
        await entry.save();

        // Send notification to admins only
        // Find all admin sockets (we'll identify admins by userId starting with "admin_")
        for (const [connectedUserId, socketId] of userSockets.entries()) {
          if (connectedUserId.startsWith('admin_')) {
            io.to(socketId).emit("new-road-entry", {
              imagePath: savedImagePath,
              latitude,
              longitude,
              address,
              timestamp: entry.timestamp,
              userId: userId
            });
            
            io.to(socketId).emit("admin-notification", {
              message: "New image uploaded. Please review.",
              imagePath: savedImagePath,
              timestamp: entry.timestamp,
              userId: userId
            });
          }
        }
      }

      // Send prediction result only to the user who uploaded the image
      const userSocketId = userSockets.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("prediction-complete", {
          message: `Prediction completed: ${result}`,
          imagePath: savedImagePath || "N/A",
          timestamp: new Date(),
          userId: userId
        });
      }

      res.status(200).json({ 
        prediction: result,
        saved: savedImagePath !== null
      });
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// --- /analyze-damage ---
app.post("/analyze-damage", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file uploaded!" });

    console.time("analyze-damage");
    
    // Flag to track if response has been sent
    let responseSent = false;
    
    // Process image with maximum efficiency
    const timestamp = getFormattedTimestamp();
    const originalName = req.file.originalname.replace(/\s+/g, "_").split(".")[0];
    const finalFilename = `analyze_${originalName}_${timestamp}.jpg`;
    const finalImagePath = path.join("uploads", finalFilename);

    // Optimize image before saving to reduce processing time
    try {
      const sharp = require('sharp');
      // Process image with sharp for faster I/O and optimized size
      await sharp(req.file.buffer)
        .resize(800, 800, { fit: 'inside' }) // Resize large images for faster processing
        .jpeg({ quality: 80, progressive: true })  // Reduced quality for faster processing
        .toFile(path.join(__dirname, finalImagePath));
    } catch (e) {
      // Fall back to standard file writing if sharp is not available
      await fs.promises.writeFile(path.join(__dirname, finalImagePath), req.file.buffer);
    }
    
    // Use the original detection script with optimizations
    const pythonProcess = spawn("python", [
      "models/detect.py", 
      finalImagePath,
      req.body.latitude || "",
      req.body.longitude || ""
    ], {
      // Set higher process priority
      windowsHide: true,
      // Optimize environment variables
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1", // Disable buffering for faster output
        OMP_NUM_THREADS: "4",  // Optimize OpenMP threads
        MKL_NUM_THREADS: "4"   // Optimize MKL threads
      }
    });

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!responseSent) {
        try {
          pythonProcess.kill();
          console.error("Python process timed out after 60 seconds");
          res.status(500).json({ error: "Analysis timed out. Please try again with a smaller image." });
          responseSent = true;
        } catch (e) {
          console.error("Error killing Python process:", e);
        }
      }
    }, 60000); // 60 second timeout

    // Use more efficient data collection
    const chunks = [];
    const errorChunks = [];
    
    pythonProcess.stdout.on("data", (data) => {
      chunks.push(data);
    });
    
    pythonProcess.stderr.on("data", (data) => {
      errorChunks.push(data);
      console.error("Python error:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);
      console.timeEnd("analyze-damage");
      
      // Don't send response if already sent
      if (responseSent) return;
      
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        res.status(500).json({ 
          error: "Analysis process failed", 
          details: Buffer.concat(errorChunks).toString() || "Unknown error"
        });
        responseSent = true;
        return;
      }
      
      try {
        // Combine chunks more efficiently
        const resultData = Buffer.concat(chunks).toString();
        
        // Find the JSON part of the output (in case there's debug info)
        const jsonMatch = resultData.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : resultData;
        const parsed = JSON.parse(jsonStr);
        
        // Add server processing time
        parsed.server_processing_time = new Date().toISOString();
        
        // Send response with compression if supported
        res.status(200).json(parsed);
        responseSent = true;
        
        // Emit socket event for real-time updates to admins only (in background)
        setImmediate(() => {
          // Send to admins only
          for (const [connectedUserId, socketId] of userSockets.entries()) {
            if (connectedUserId.startsWith('admin_')) {
              io.to(socketId).emit("analysis-complete", {
                message: "Image analysis completed",
                severity: parsed.severity?.level || "Unknown",
                timestamp: new Date()
              });
            }
          }
        });
      } catch (err) {
        console.error("JSON parse error:", err);
        if (!responseSent) {
          res.status(500).json({ error: "Error parsing detection result" });
          responseSent = true;
        }
      }
    });
    
    // Handle unexpected errors
    pythonProcess.on("error", (err) => {
      console.error("Python process error:", err);
      if (!responseSent) {
        res.status(500).json({ error: "Python process error" });
        responseSent = true;
      }
    });
    
  } catch (error) {
    console.error("Analyze Damage Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// --- /save-canvas ---
app.post("/save-canvas", async (req, res) => {
  console.log("Received /save-canvas request");
  // Wrap the entire handler in a try-catch to ensure we always return a response
  try {
    const { 
      imagePath, 
      latitude, 
      longitude, 
      analysisResult, 
      address, 
      status, 
      severity, 
      severityLevel, 
      userId, 
      timestamp,
      boundingBoxImage  // Base64 encoded image with bounding boxes
    } = req.body;
    
    if (!imagePath || !analysisResult) {
      return res.status(400).json({ message: "Missing imagePath or analysis result." });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Convert latitude and longitude to numbers if they're strings
    const parsedLatitude = latitude ? parseFloat(latitude) : null;
    const parsedLongitude = longitude ? parseFloat(longitude) : null;

    // Save the bounding box image if provided
    let boundingBoxImagePath = null;
    if (boundingBoxImage) {
      try {
        // Extract the base64 data
        const base64Data = boundingBoxImage.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create a unique filename with userId for better tracking
        const timestamp = getFormattedTimestamp();
        const filename = `bbox_${userId}_${timestamp}.jpg`;
        boundingBoxImagePath = path.join("final", filename);
        
        // Ensure the directory exists
        const dirPath = path.join(__dirname, "final");
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Try to optimize the image with sharp if available
        try {
          const sharp = require('sharp');
          await sharp(buffer)
            .jpeg({ quality: 80, progressive: true })
            .toFile(path.join(__dirname, boundingBoxImagePath));
          console.log(`Optimized bounding box image saved to ${boundingBoxImagePath}`);
        } catch (sharpError) {
          // If sharp fails or is not available, fall back to direct file writing
          console.warn("Sharp optimization failed, using direct file write:", sharpError.message);
          fs.writeFileSync(path.join(__dirname, boundingBoxImagePath), buffer);
          console.log(`Bounding box image saved to ${boundingBoxImagePath} (unoptimized)`);
        }
      } catch (error) {
        console.error("Error saving bounding box image:", error);
        // Continue even if saving the image fails
      }
    } else {
      console.log("No bounding box image provided in request");
    }

    // Extract damage type from analysis result if available
    let damageType = 'unknown';
    if (analysisResult.vit_predictions && analysisResult.vit_predictions.length > 0) {
      damageType = analysisResult.vit_predictions[0]; // Use the first prediction as the primary damage type
    }

    // Calculate processing time
    const processingTime = analysisResult.clientProcessingTime || analysisResult.processing_time || null;

    // Calculate the number of detections
    const detectionCount = analysisResult?.detections?.length || 0;
    
    // Ensure severityLevel is a valid enum value
    let validSeverityLevel = severityLevel || 'unknown';
    // Map any non-standard severity levels to valid ones
    if (validSeverityLevel === 'medium') {
      validSeverityLevel = 'moderate';
    }
    
    // Make sure it's one of the allowed enum values
    if (!['low', 'moderate', 'high', 'severe', 'unknown'].includes(validSeverityLevel)) {
      validSeverityLevel = 'unknown';
    }
    
    // Create a new document with all the values
    const newResult = new FinalImage({ 
      imagePath, 
      boundingBoxImagePath,
      latitude: parsedLatitude, 
      longitude: parsedLongitude, 
      // Set up geospatial location field if coordinates are available
      location: parsedLatitude && parsedLongitude ? {
        type: 'Point',
        coordinates: [parsedLongitude, parsedLatitude]  // GeoJSON format is [longitude, latitude]
      } : undefined,
      analysisResult, 
      address,
      status: status || 'Pending',
      severity: severity || 50,
      severityLevel: validSeverityLevel,
      userId,
      processingTime,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      damageType,
      detectionCount
    });
    
    await newResult.save();

    // Send to admins only
    for (const [connectedUserId, socketId] of userSockets.entries()) {
      if (connectedUserId.startsWith('admin_')) {
        io.to(socketId).emit("prediction-complete", {
          message: "Image analysis completed and saved",
          imagePath,
          boundingBoxImagePath,
          severity: validSeverityLevel,
          timestamp: newResult.timestamp,
          id: newResult._id
        });
      }
    };

    res.status(200).json({ 
      message: "Analysis saved successfully.", 
      id: newResult._id,
      boundingBoxImagePath,
      detectionCount,
      severity: validSeverityLevel,
      status,
      timestamp: newResult.timestamp
    });
  } catch (err) {
    console.error("Error in /save-canvas:", err);
    // Send a more detailed error response
    res.status(500).json({ 
      message: "Failed to save to database.", 
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  }
});

// --- /api/feedback ---
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const feedback = new Feedback({ name, email, subject, message });
    await feedback.save();
    res.status(200).json({ message: "Feedback submitted!" });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Error saving feedback!" });
  }
});

// --- /api/feedbacks ---
app.get("/api/feedbacks", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ dateSubmitted: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Error fetching feedbacks" });
  }
});

// --- /api/feedbacks/:id ---
app.patch("/api/feedbacks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      { completed },
      { new: true }
    );
    
    if (!updatedFeedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    
    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ error: "Error updating feedback" });
  }
});

// --- /api/feedbacks/:id/reply ---
// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'venkatmadhu232@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password-here' // Use app password for Gmail
  }
});

app.post("/api/feedbacks/:id/reply", async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, recipientEmail, recipientName, senderEmail } = req.body;
    
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    
    // Prepare email options
    const mailOptions = {
      from: senderEmail || 'venkatmadhu232@gmail.com',
      to: recipientEmail,
      subject: `Re: ${feedback.subject || 'Your Feedback'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Hello ${recipientName},</h2>
          <p style="color: #555; line-height: 1.6;">Thank you for your feedback. Here's our response:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4a90e2; margin: 20px 0;">
            ${replyText.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #555;">Original message: <em>${feedback.message}</em></p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #777; font-size: 14px;">This is an automated response. Please do not reply to this email.</p>
        </div>
      `
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    
    // Update feedback to include the reply
    feedback.replied = true;
    feedback.replyText = replyText;
    feedback.replyDate = new Date();
    await feedback.save();
    
    console.log(`Reply sent to ${recipientName} (${recipientEmail}) from ${senderEmail || 'venkatmadhu232@gmail.com'}`);
    
    res.status(200).json({ message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: `Error sending reply: ${error.message}` });
  }
});

// --- /api/signup ---
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });

    const existingUser = await loginCollection.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await loginCollection.insertOne({ name, email, password: hashedPassword });

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during signup" });
  }
});

// --- /api/login ---
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginCollection.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Return user ID and name for client-side storage
    res.json({ 
      message: "Login successful!", 
      userId: user._id.toString(),
      name: user.name
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// --- /api/road-entries ---
app.get("/api/road-entries", async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, filter by user
    const query = userId ? { userId } : {};
    
    const entries = await RoadEntry.find(query).sort({ timestamp: -1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching road entries:", error);
    res.status(500).json({ error: "Error fetching saved entries" });
  }
});

// --- /api/user/:id ---
app.get("/api/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if it's a MongoDB ObjectId
    if (userId.match(/^[0-9a-f]{24}$/i)) {
      // Try to find user in login collection
      const user = await loginCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
      if (user) {
        return res.status(200).json({ 
          name: user.name || 'User',
          email: user.email
        });
      }
    }
    
    // If userId starts with 'admin_', it's an admin
    if (userId.startsWith('admin_')) {
      return res.status(200).json({ name: 'Administrator' });
    }
    
    // For regular users with user_name format
    const parts = userId.split('_');
    if (parts.length > 1) {
      const name = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return res.status(200).json({ name });
    }
    
    // Default response if no user found
    res.status(200).json({ name: 'Unknown User' });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error. Could not fetch user data." });
  }
});

// --- /api/road-data ---
app.get("/api/road-data", async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, filter by user (for regular users)
    // For admin users, we typically want to see all data
    const query = userId ? { userId } : {};
    
    const roadData = await RoadEntry.find(query).sort({ timestamp: -1 });
    
    // Enhance data with user information
    const enhancedData = await Promise.all(roadData.map(async (item) => {
      // If userId is a MongoDB ObjectId, try to get user info
      if (item.userId && item.userId.match(/^[0-9a-f]{24}$/i)) {
        try {
          const user = await loginCollection.findOne({ _id: new mongoose.Types.ObjectId(item.userId) });
          if (user) {
            return {
              ...item.toObject(),
              userName: user.name || 'User'
            };
          }
        } catch (err) {
          console.error("Error fetching user for road data:", err);
        }
      }
      
      return item.toObject();
    }));
    
    res.status(200).json(enhancedData);
  } catch (error) {
    console.error("Error fetching road data:", error);
    res.status(500).json({ error: "Server error. Could not fetch data." });
  }
});

// --- /api/dashboard-stats ---
app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId && !userId.startsWith('admin_') ? { userId } : {};
    
    // Get current date and calculate dates for time-based queries
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get all data needed for stats
    const finalImgData = await FinalImage.find(query);
    const roadEntryData = await RoadEntry.find(query);
    
    // Combine data for comprehensive stats
    const allData = [...finalImgData, ...roadEntryData];
    
    // Calculate stats
    const totalCount = allData.length;
    const newThisWeek = allData.filter(item => new Date(item.timestamp) >= oneWeekAgo).length;
    
    // Calculate high severity issues (from FinalImage collection which has severity field)
    const highSeverityCount = finalImgData.filter(item => item.severity > 70).length;
    const highSeverityPercentage = finalImgData.length > 0 ? Math.round((highSeverityCount / finalImgData.length) * 100) : 0;
    
    // Calculate average processing time
    const totalProcessingTime = finalImgData.reduce((acc, item) => acc + (item.processingTime || 0), 0);
    const avgProcessingTime = finalImgData.length > 0 ? Math.round(totalProcessingTime / finalImgData.length) : 0;
    
    // Calculate resolution stats
    const resolvedCount = finalImgData.filter(item => item.status === "Resolved").length;
    const resolutionRate = finalImgData.length > 0 ? Math.round((resolvedCount / finalImgData.length) * 100) : 0;
    const resolvedLastMonth = finalImgData.filter(item => 
      item.status === "Resolved" && new Date(item.timestamp) >= oneMonthAgo
    ).length;
    
    // Calculate damage type distribution
    const damageTypes = {};
    finalImgData.forEach(item => {
      const type = item.damageType || 'unknown';
      damageTypes[type] = (damageTypes[type] || 0) + 1;
    });
    
    // Calculate severity distribution
    const severityDistribution = {
      low: finalImgData.filter(item => item.severity <= 30).length,
      moderate: finalImgData.filter(item => item.severity > 30 && item.severity <= 60).length,
      high: finalImgData.filter(item => item.severity > 60 && item.severity <= 80).length,
      severe: finalImgData.filter(item => item.severity > 80).length
    };
    
    // Return comprehensive stats
    res.status(200).json({
      totalInspections: {
        count: totalCount,
        newThisWeek
      },
      highSeverityIssues: {
        count: highSeverityCount,
        percentage: highSeverityPercentage
      },
      processingTime: {
        average: avgProcessingTime
      },
      resolutionRate: {
        percentage: resolutionRate,
        resolvedLastMonth
      },
      damageTypes,
      severityDistribution,
      statusCounts: {
        pending: finalImgData.filter(item => item.status === "Pending").length,
        processed: finalImgData.filter(item => item.status === "Processed").length,
        critical: finalImgData.filter(item => item.status === "Critical").length,
        resolved: resolvedCount
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Error fetching dashboard statistics" });
  }
});

// --- /api/report-stats ---
app.get("/api/report-stats", async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, filter by user (for regular users)
    // For admin users, we typically want to see all data
    const query = userId ? { userId } : {};
    
    // Get all entries matching the query
    const allEntries = await RoadEntry.find(query);
    
    // Calculate statistics
    const total = allEntries.length;
    const pending = allEntries.filter(entry => 
      !entry.reviewed || entry.reviewStatus === 'pending'
    ).length;
    const reviewed = allEntries.filter(entry => 
      entry.reviewed && entry.reviewStatus !== 'pending'
    ).length;
    
    res.status(200).json({
      total,
      pending,
      reviewed
    });
  } catch (error) {
    console.error("Error fetching report stats:", error);
    res.status(500).json({ error: "Server error. Could not fetch stats." });
  }
});

// --- /api/weekly-reports ---
app.get("/api/weekly-reports", async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, filter by user (for regular users)
    const query = userId && !userId.startsWith('admin_') ? { userId } : {};
    
    // Get current date and date 7 days ago
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Add timestamp filter to query
    const timeQuery = {
      ...query,
      timestamp: { $gte: sevenDaysAgo }
    };
    
    // Get all entries from the last 7 days
    const recentEntries = await RoadEntry.find(timeQuery);
    
    // Group by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = dayNames.map(day => ({ name: day, reports: 0 }));
    
    recentEntries.forEach(entry => {
      const dayOfWeek = new Date(entry.timestamp).getDay(); // 0 = Sunday, 6 = Saturday
      weeklyData[dayOfWeek].reports += 1;
    });
    
    res.status(200).json(weeklyData);
  } catch (error) {
    console.error("Error fetching weekly reports:", error);
    res.status(500).json({ error: "Server error. Could not fetch weekly data." });
  }
});

// --- /api/damage-distribution ---
app.get("/api/damage-distribution", async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, filter by user (for regular users)
    const query = userId && !userId.startsWith('admin_') ? { userId } : {};
    
    // Get all entries matching the query
    const allEntries = await RoadEntry.find(query);
    
    // Count damage types based on the damageType field
    const damageTypes = {
      'Potholes': 0,
      'Alligator Cracks': 0,
      'Lateral Cracks': 0,
      'Longitudinal Cracks': 0,
      'Edge Cracks': 0,
      'Rutting': 0,
      'Raveling': 0,
      'Other': 0
    };
    
    allEntries.forEach(entry => {
      if (!entry.damageType || (Array.isArray(entry.damageType) && entry.damageType.length === 0)) {
        damageTypes['Other']++;
        return;
      }
      
      // Handle array of damage types
      if (Array.isArray(entry.damageType)) {
        // Count each damage type in the array
        entry.damageType.forEach(type => {
          switch(type) {
            case 'pothole':
              damageTypes['Potholes']++;
              break;
            case 'alligator_crack':
              damageTypes['Alligator Cracks']++;
              break;
            case 'lateral_crack':
              damageTypes['Lateral Cracks']++;
              break;
            case 'longitudinal_crack':
              damageTypes['Longitudinal Cracks']++;
              break;
            case 'edge_crack':
              damageTypes['Edge Cracks']++;
              break;
            case 'rutting':
              damageTypes['Rutting']++;
              break;
            case 'raveling':
              damageTypes['Raveling']++;
              break;
            default:
              damageTypes['Other']++;
          }
        });
        return;
      }
      
      // Handle single damage type (string)
      switch(entry.damageType) {
        case 'pothole':
          damageTypes['Potholes']++;
          break;
        case 'alligator_crack':
          damageTypes['Alligator Cracks']++;
          break;
        case 'lateral_crack':
          damageTypes['Lateral Cracks']++;
          break;
        case 'longitudinal_crack':
          damageTypes['Longitudinal Cracks']++;
          break;
        case 'edge_crack':
          damageTypes['Edge Cracks']++;
          break;
        case 'rutting':
          damageTypes['Rutting']++;
          break;
        case 'raveling':
          damageTypes['Raveling']++;
          break;
        default:
          damageTypes['Other']++;
      }
    });
    
    // Convert to array format for charts
    const result = Object.entries(damageTypes)
      .filter(([_, value]) => value > 0) // Only include damage types with values > 0
      .map(([name, value]) => ({ name, value }));
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching damage distribution:", error);
    res.status(500).json({ error: "Server error. Could not fetch damage distribution." });
  }
});

// --- /api/severity-breakdown ---
app.get("/api/severity-breakdown", async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, filter by user (for regular users)
    const query = userId && !userId.startsWith('admin_') ? { userId } : {};
    
    // Get all entries matching the query
    const allEntries = await RoadEntry.find(query);
    
    // Count by severity
    const severityCounts = {
      'high': 0,
      'moderate': 0,
      'low': 0,
      'severe': 0,
      'unknown': 0
    };
    
    allEntries.forEach(entry => {
      const severity = entry.severity || 'unknown';
      if (severityCounts.hasOwnProperty(severity)) {
        severityCounts[severity]++;
      } else {
        severityCounts['unknown']++;
      }
    });
    
    // Map to the format needed by the frontend
    const result = [
      { name: 'High', value: severityCounts['high'] + severityCounts['severe'], color: '#ef4444' },
      { name: 'Moderate', value: severityCounts['moderate'], color: '#f59e0b' },
      { name: 'Low', value: severityCounts['low'], color: '#10b981' }
    ];
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching severity breakdown:", error);
    res.status(500).json({ error: "Server error. Could not fetch severity data." });
  }
});

// --- /api/recent-reports ---
app.get("/api/recent-reports", async (req, res) => {
  try {
    const { userId, limit = 5 } = req.query;
    
    // If userId is provided, filter by user (for regular users)
    const query = userId && !userId.startsWith('admin_') ? { userId } : {};
    
    // Get recent entries, sorted by timestamp
    const recentEntries = await RoadEntry.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    // Format the data for the frontend
    const result = recentEntries.map(entry => ({
      id: entry._id,
      location: entry.address || 'Unknown location',
      type: getReportType(entry.reviewNotes || '', entry.damageType),
      severity: entry.severity || 'unknown',
      date: entry.timestamp ? new Date(entry.timestamp).toISOString().split('T')[0] : 'Unknown date',
      status: entry.reviewStatus || 'pending'
    }));
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    res.status(500).json({ error: "Server error. Could not fetch recent reports." });
  }
});

// Helper function to determine report type from damage type
function getReportType(notes, damageType) {
  if (damageType) {
    // Handle array of damage types
    if (Array.isArray(damageType)) {
      if (damageType.length === 0) return 'Other';
      if (damageType.length === 1) {
        // If only one type, use the switch case below with the single value
        return getReportType(notes, damageType[0]);
      }
      // If multiple types, return a combined label
      return 'Multiple Issues';
    }
    
    // Handle single damage type
    switch(damageType) {
      case 'pothole':
        return 'Pothole';
      case 'alligator_crack':
        return 'Alligator Crack';
      case 'lateral_crack':
        return 'Lateral Crack';
      case 'longitudinal_crack':
        return 'Longitudinal Crack';
      case 'edge_crack':
        return 'Edge Crack';
      case 'rutting':
        return 'Rutting';
      case 'raveling':
        return 'Raveling';
      default:
        return 'Other';
    }
  }
  
  // Fallback to notes-based detection if no damage type is available
  notes = (notes || '').toLowerCase();
  if (notes.includes('pothole')) return 'Pothole';
  if (notes.includes('crack')) return 'Crack';
  if (notes.includes('erosion')) return 'Erosion';
  if (notes.includes('debris')) return 'Debris';
  return 'Other';
}

// --- /api/review-image-v2 (New endpoint for multiple damage types) ---
app.post("/api/review-image-v2", async (req, res) => {
  try {
    const { imageId, reviewStatus, reviewNotes, severity, damageType, recommendedAction, reviewerId } = req.body;
    
    // Debug logging
    console.log("Review request received:");
    console.log("- imageId:", imageId);
    console.log("- damageType:", damageType);
    console.log("- damageType type:", typeof damageType);
    if (Array.isArray(damageType)) {
      console.log("- damageType is an array with length:", damageType.length);
    }
    
    if (!imageId || !reviewStatus) {
      return res.status(400).json({ error: "Image ID and review status are required" });
    }
    
    if (!reviewerId) {
      return res.status(400).json({ error: "Reviewer ID is required" });
    }
    
    // Find the image entry
    const imageEntry = await RoadEntry.findById(imageId);
    
    if (!imageEntry) {
      return res.status(404).json({ error: "Image entry not found" });
    }
    
    // We'll use updateOne instead of directly modifying the object
    
    // Use updateOne instead of save to bypass validation issues
    try {
      // Prepare update object
      const updateData = {
        reviewed: true,
        reviewStatus: reviewStatus,
        reviewNotes: reviewNotes || "",
        severity: severity || "unknown",
        damageType: Array.isArray(damageType) ? damageType : [damageType || "pothole"],
        recommendedAction: recommendedAction || "",
        reviewDate: new Date(),
        reviewerId: reviewerId
      };
      
      console.log("Update data:", updateData);
      
      // Use updateOne to bypass validation
      const result = await RoadEntry.updateOne(
        { _id: imageId },
        { $set: updateData }
      );
      
      console.log("Update result:", result);
      
      if (result.modifiedCount === 0) {
        return res.status(500).json({ error: "Failed to update the entry" });
      }
    } catch (saveError) {
      console.error("Error updating image entry:", saveError);
      return res.status(500).json({ error: "Error saving review: " + saveError.message });
    }
    
    // Get the updated entry to ensure we have the latest data
    const updatedEntry = await RoadEntry.findById(imageId);
    if (!updatedEntry) {
      return res.status(404).json({ error: "Updated image entry not found" });
    }
    
    // Send notification specifically to the user who uploaded the image
    const targetUserId = updatedEntry.userId;
    
    console.log("All connected users:", Array.from(userSockets.entries()));
    console.log("Target user ID:", targetUserId);
    
    // Debug: Print all connected users
    console.log("Connected users:");
    for (const [uid, sid] of userSockets.entries()) {
      console.log(`User ${uid} -> Socket ${sid}`);
    }
    
    const targetSocketId = userSockets.get(targetUserId);
    console.log("Target socket ID:", targetSocketId);
    
    // Ensure all data is properly formatted and available
    const notificationData = {
      imageId: updatedEntry._id.toString(),
      imagePath: updatedEntry.imagePath || "",
      address: updatedEntry.address || "Unknown location",
      reviewStatus: updatedEntry.reviewStatus,
      severity: updatedEntry.severity,
      reviewNotes: updatedEntry.reviewNotes,
      recommendedAction: updatedEntry.recommendedAction,
      reviewDate: updatedEntry.reviewDate,
      userId: targetUserId, // Target user ID (who uploaded the image)
      reviewerId: reviewerId, // Who reviewed the image
      message: `Your road image has been reviewed. Status: ${updatedEntry.reviewStatus}`
    };
    
    console.log("Notification data:", notificationData);
    
    // Only send to the specific user who uploaded the image and to admins
    console.log("Sending notification only to the specific user and admins");
    
    // Send to the specific user if they're connected
    if (targetSocketId) {
      console.log(`Sending notification to user ${targetUserId} via socket ${targetSocketId}`);
      // When sending to the user, make it clear this is for them specifically
      const userNotificationData = {
        ...notificationData,
        forUser: true,
        forAdmin: false
      };
      
      console.log("User notification data:", JSON.stringify(userNotificationData, null, 2));
      
      // Use a callback to confirm delivery
      io.to(targetSocketId).emit("image-reviewed", userNotificationData, (error) => {
        if (error) {
          console.error(`Error sending notification to user ${targetUserId}:`, error);
        } else {
          console.log(`✅ Notification successfully sent to user ${targetUserId}`);
        }
      });
      
      // Also broadcast to all sockets to ensure delivery
      console.log("Broadcasting notification to all sockets as a backup");
      io.emit("image-reviewed-broadcast", {
        ...userNotificationData,
        targetUserId: targetUserId
      });
    } else {
      console.log(`User ${targetUserId} not connected. Notification will not be delivered.`);
      // In a production app, you might want to store this notification in a database
      // for delivery when the user connects next time
    }
    
    // Also send to all admin users, but with a flag indicating it's for admin
    for (const [connectedUserId, socketId] of userSockets.entries()) {
      if (connectedUserId.startsWith('admin_')) {
        console.log(`Sending notification to admin ${connectedUserId} via socket ${socketId}`);
        // When sending to admins, make it clear this is for admin purposes
        const adminNotificationData = {
          ...notificationData,
          forUser: false,
          forAdmin: true,
          adminId: connectedUserId // Include the admin ID who's receiving this
        };
        
        console.log("Admin notification data:", JSON.stringify(adminNotificationData, null, 2));
        
        // Use a callback to confirm delivery
        io.to(socketId).emit("image-reviewed", adminNotificationData, (error) => {
          if (error) {
            console.error(`Error sending notification to admin ${connectedUserId}:`, error);
          } else {
            console.log(`✅ Notification successfully sent to admin ${connectedUserId}`);
          }
        });
        
        // Also broadcast to all sockets to ensure delivery
        console.log("Broadcasting admin notification to all sockets as a backup");
        io.emit("admin-notification-broadcast", {
          ...adminNotificationData,
          targetAdminId: connectedUserId
        });
      }
    }
    
    res.status(200).json({ 
      message: "Image review saved and notification sent",
      updatedEntry: imageEntry
    });
  } catch (error) {
    console.error("Error reviewing image:", error);
    res.status(500).json({ error: "Server error during image review" });
  }
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
