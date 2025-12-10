import express from "express";
import DocumentRequest from "../models/DocumentRequest";
import { protect } from "../middleware/auth";
import { validateObjectId } from "../middleware/validation";

const router = express.Router();

// Create document request
router.post("/", protect, async (req, res) => {
  try {
    const { documentType, purpose, notes } = req.body;

    const documentRequest = await DocumentRequest.create({
      userId: req.user._id,
      documentType,
      purpose,
      notes,
    });

    res.status(201).json(documentRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's document requests - MUST come before /:id route
router.get("/my", protect, async (req, res) => {
  try {
    const requests = await DocumentRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get document request by ID - MUST come after specific routes
router.get("/:id", protect, validateObjectId("id"), async (req, res) => {
  try {
    const request = await DocumentRequest.findById(req.params.id).populate(
      "userId",
      "firstName lastName email"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if user owns the request or is admin
    if (
      request.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
