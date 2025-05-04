import fs from "fs";
import { spawn } from "child_process";
import RoadEntry from "../models/RoadEntry.js";

// Predict function
export const predict = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    if (!req.file) return res.status(400).json({ error: "No image file received!" });

    // Debug: Check the original file name
    console.log("Received file original name:", req.file.originalname);

    // Get the original file name
    const originalName = req.file.originalname;

    // Save the image with the original name
    const tempImagePath = `temp/${originalName}`;
    fs.writeFileSync(tempImagePath, req.file.buffer);

    const pythonProcess = spawn("python", ["models/predict.py", tempImagePath]);

    pythonProcess.stdout.on("data", async (data) => {
      const result = data.toString().trim();
      console.log("Prediction:", result);
      fs.unlinkSync(tempImagePath);

      if (result.toLowerCase() === "road") {
        const savedImagePath = `uploads/${originalName}`;
        fs.writeFileSync(savedImagePath, req.file.buffer);

        const entry = new RoadEntry({ imagePath: savedImagePath, latitude, longitude, address });
        await entry.save();
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
};

// Analyze damage function
export const analyzeDamage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file uploaded!" });

    const { latitude, longitude } = req.body;

    // Debug: Check the original file name
    console.log("Received file original name:", req.file.originalname);

    // Clean the filename and save it with the original name
    const originalName = req.file.originalname.replace(/\s+/g, '_');
    const finalImagePath = `uploads/${originalName}`;
    fs.writeFileSync(finalImagePath, req.file.buffer);

    const args = ["models/detect.py", finalImagePath];
    if (latitude && longitude) {
      args.push(latitude.toString());
      args.push(longitude.toString());
    }

    const pythonProcess = spawn("python", args);

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
};
