import express, { Request } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";
import User from "../models/User";
import { protect } from "../middleware/auth";
import { AuthRequest } from "../types/express";
import sendEmail from "../utils/sendEmail";

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Auth Route hit: ${req.method} ${req.path}`);
  next();
});

// Configure multer for profile picture uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Configure multer for verification documents (images and PDFs)
const verificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDF files
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and PDF files are allowed"));
    }
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "30d",
  });
};

// Auth endpoints documentation
router.get("/", (req, res) => {
  res.json({
    message: "BarangayConnect Hub - Authentication API",
    endpoints: {
      register: "POST /api/auth/register - Create new account",
      login: "POST /api/auth/login - Login with email and password",
      logout: "POST /api/auth/logout - Logout user",
      profile:
        "GET /api/auth/profile - Get current user profile (requires token)",
      updateProfile:
        "PUT /api/auth/profile - Update user profile (requires token)",
      forgotPassword: "POST /api/auth/forgot-password - Request password reset",
      resetPassword:
        "POST /api/auth/reset-password - Reset password with token",
      verifyToken: "POST /api/auth/verify-token - Verify JWT token",
    },
  });
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
    });

    // Convert to plain object and remove password
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      ...userObj,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      // Convert to plain object to include all fields
      const userObj = user.toObject();
      delete userObj.password; // Remove password from response

      res.json({
        ...userObj,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get("/me", protect, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile
router.patch("/update-profile", protect, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password
router.post("/change-password", protect, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  console.log("Forgot password request received for:", req.body.email);
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.log("User not found for email:", req.body.email);
      return res.status(404).json({ message: "User not found" });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save({ validateBeforeSave: false });
    console.log("Reset token saved for user:", user.email);

    // Create reset url
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
    console.log("Reset link generated:", resetLink);

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password: \n\n ${resetLink}`;

    try {
      console.log("Attempting to send email to:", user.email);
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
      });
      console.log("Email sent successfully");

      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      console.error("Error sending email:", err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Reset Password
router.put("/reset-password/:resetToken", async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, data: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload profile picture
router.post(
  "/upload-profile-picture",
  protect,
  upload.single("profilePicture"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Convert file to base64 or save file path
      const fileBuffer = req.file.buffer;
      const base64String = fileBuffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64String}`;

      // Update user profile picture
      (user as any).profilePicture = dataUrl;
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Submit verification documents
router.post(
  "/submit-verification",
  protect,
  verificationUpload.array("verificationDocuments", 10),
  async (req: AuthRequest, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Convert files to base64 and save
      const documents = (req.files as Express.Multer.File[]).map(
        (file, index) => {
          console.log(`Processing file ${index + 1}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            bufferLength: file.buffer.length,
          });

          const fileBuffer = file.buffer;
          const base64String = fileBuffer.toString("base64");
          const dataUrl = `data:${file.mimetype};base64,${base64String}`;

          console.log(
            `File ${index + 1} encoded. DataURL length:`,
            dataUrl.length
          );
          console.log(`DataURL preview:`, dataUrl.substring(0, 100) + "...");

          return {
            url: dataUrl,
            documentType: file.originalname,
            uploadedAt: new Date(),
          };
        }
      );

      // Update user verification documents and status
      (user as any).verificationDocuments = documents;
      (user as any).verificationStatus = "pending";

      console.log(
        `Saving ${documents.length} documents for user ${user.email}`
      );
      await user.save();

      console.log("Documents saved successfully");

      const userResponse = user.toObject();
      delete userResponse.password;

      console.log(
        "Verification documents in response:",
        userResponse.verificationDocuments?.length
      );

      res.json(userResponse);
    } catch (error) {
      console.error("Verification upload error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
