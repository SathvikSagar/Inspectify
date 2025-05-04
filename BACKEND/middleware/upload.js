import multer from "multer";
import path from "path";

// Set up disk storage to save files with their original names
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Directory where you want to save the files
  },
  filename: function (req, file, cb) {
    // Retain the original file name
    cb(null, file.originalname);
  }
});

// Use memory storage for temp files if needed for other parts of your app, else switch to disk storage
const upload = multer({ storage });

export default upload;
