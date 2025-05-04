// const mongoose = require("mongoose");

// // Define User Schema
// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   otp: {
//     type: String, // Store OTP temporarily
//   },
//   otpExpiry: {
//     type: Date, // Expiry time for OTP
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// // Create User Model
// const User = mongoose.model("User", userSchema);

// module.exports = User;
// BACKEND/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

export default mongoose.model("User", userSchema, "login");
