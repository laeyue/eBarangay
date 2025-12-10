import express, { Request } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import User from "../models/User";
import { protect } from "../middleware/auth";
import { AuthRequest } from "../types/express";

const router = express.Router();

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

export default router;
