// OTP utilities for local OTP generation and verification
// This is a temporary solution until the server-side OTP functionality is fixed

// Store for OTPs
const otpStore = new Map();

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store an OTP with expiration
export const storeOTP = (email, name, password) => {
  const otp = generateOTP();
  
  // Store OTP with 10-minute expiration
  otpStore.set(email, {
    otp,
    name,
    password,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  
  console.log(`Generated OTP for ${email}: ${otp}`);
  return otp;
};

// Verify an OTP
export const verifyOTP = (email, otp) => {
  const otpData = otpStore.get(email);
  
  if (!otpData) {
    console.log(`No OTP found for email: ${email}`);
    return { valid: false, message: "No OTP found for this email. Please request a new one." };
  }
  
  if (Date.now() > otpData.expires) {
    // Remove expired OTP
    console.log(`OTP for ${email} has expired`);
    otpStore.delete(email);
    return { valid: false, message: "OTP has expired. Please request a new one." };
  }
  
  if (otpData.otp !== otp) {
    console.log(`Invalid OTP for ${email}. Expected: ${otpData.otp}, Received: ${otp}`);
    return { valid: false, message: "Invalid OTP. Please try again." };
  }
  
  console.log(`OTP verified successfully for ${email}`);
  return { 
    valid: true, 
    message: "OTP verified successfully",
    userData: {
      name: otpData.name,
      email,
      password: otpData.password
    }
  };
};

// Remove an OTP
export const removeOTP = (email) => {
  otpStore.delete(email);
  console.log(`OTP for ${email} removed`);
};