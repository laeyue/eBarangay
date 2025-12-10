import express from "express";
import Incident from "../models/Incident";
import { protect, optionalAuth } from "../middleware/auth";
import { validateObjectId } from "../middleware/validation";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/incidents/");
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// Get all incidents (paginated) - Public with optional auth
router.get("/", optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role and auth status
    let query = {};

    // If authenticated and not admin, show user's own incidents
    // If admin, show all incidents
    // If not authenticated, show resolved/public incidents only
    if (req.user) {
      if (req.user.role !== "admin") {
        query.userId = req.user._id;
      }
      // Admin sees all
    } else {
      // Public view - only show resolved incidents
      query.status = "resolved";
    }

    // Apply filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      incidents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create incident
router.post("/", protect, upload.single("photo"), async (req, res) => {
  try {
    const { title, description, location, type, priority } = req.body;

    const incident = await Incident.create({
      userId: req.user._id,
      title,
      description,
      location,
      type: type || "other",
      priority: priority || "medium",
      photoUrl: req.file ? `/uploads/incidents/${req.file.filename}` : null,
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's incidents - MUST come before /:id route
router.get("/my", protect, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get incident by ID - MUST come after specific routes
router.get("/:id", protect, validateObjectId("id"), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate(
      "userId",
      "firstName lastName email"
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Check if user owns the incident or is admin
    if (
      incident.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
