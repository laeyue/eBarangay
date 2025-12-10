import express from "express";
import Announcement from "../models/Announcement";
import Notification from "../models/Notification";
import User from "../models/User";
import { protect, admin } from "../middleware/auth";

const router = express.Router();

/**
 * @route   GET /api/announcements
 * @desc    Get all active announcements for users (public access for authenticated users)
 * @access  Protected
 * @query   page, limit, category, search
 */
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    let query = { isActive: true };

    // Filter by category if provided
    if (category && category !== "all") {
      query.category = category;
    }

    let announcements;
    let total;

    // Search functionality - case-insensitive
    if (search && search.trim()) {
      // Use regex for flexible case-insensitive search
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { content: searchRegex }];

      announcements = await Announcement.find(query)
        .populate("createdBy", "firstName lastName role")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      total = await Announcement.countDocuments(query);
    } else {
      // Regular query without search
      announcements = await Announcement.find(query)
        .populate("createdBy", "firstName lastName role")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      total = await Announcement.countDocuments(query);
    }

    res.json({
      announcements,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/announcements/:id
 * @desc    Get single announcement details (without incrementing view count)
 * @access  Protected
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName email role"
    );

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Do NOT increment view count here - use separate /increment-view endpoint
    res.json(announcement);
  } catch (error) {
    console.error("Get announcement error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/announcements
 * @desc    Create new announcement (Admin only)
 * @access  Admin
 */
router.post("/", protect, admin, async (req, res) => {
  try {
    const { title, content, category, isPinned, priority, expiryDate } =
      req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const announcement = await Announcement.create({
      title,
      content,
      category: category || "general",
      isPinned: isPinned || false,
      priority: priority || "medium",
      isActive: true,
      expiryDate,
      createdBy: req.user._id,
    });

    const populatedAnnouncement = await Announcement.findById(
      announcement._id
    ).populate("createdBy", "firstName lastName role");

    // Create notifications for all users (not just active)
    try {
      const users = await User.find({}).select("_id");
      const userIds = users.map((u) => u._id);

      console.log(
        `Creating announcement notifications for ${userIds.length} users:`,
        {
          type: "announcement",
          title: "New Announcement",
          message: title,
          announcementId: announcement._id,
        }
      );

      if (userIds.length > 0) {
        // Ensure priority is a valid enum value
        const validPriorities = ["low", "medium", "high"];
        const finalPriority = validPriorities.includes(priority)
          ? priority
          : "medium";

        const result = await Notification.createForUsers(userIds, {
          type: "announcement",
          title: "New Announcement",
          message: title,
          priority: finalPriority,
          read: false, // Explicitly set as unread
          relatedEntityType: "announcement",
          relatedEntityId: announcement._id,
          actionUrl: "/announcements",
        });
        console.log(`✅ Created ${result.length} announcement notifications`);
      }
    } catch (notifError) {
      console.error("Create announcement notification error:", notifError);
      // Don't block creation if notifications fail
    }

    res.status(201).json(populatedAnnouncement);
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/announcements/:id
 * @desc    Update announcement (Admin only)
 * @access  Admin
 */
router.patch("/:id", protect, admin, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      isPinned,
      priority,
      isActive,
      expiryDate,
    } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Update fields
    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (category !== undefined) announcement.category = category;
    if (isPinned !== undefined) announcement.isPinned = isPinned;
    if (priority !== undefined) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate;

    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(
      announcement._id
    ).populate("createdBy", "firstName lastName role");

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete announcement (Admin only)
 * @access  Admin
 */
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await announcement.deleteOne();
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/announcements/admin/all
 * @desc    Get all announcements including inactive (Admin only)
 * @access  Admin
 */
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // 'active', 'inactive', or 'all'

    let query = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const announcements = await Announcement.find(query)
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Announcement.countDocuments(query);

    res.json({
      announcements,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get all announcements error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/announcements/:id/mark-read
 * @desc    Mark announcement as read for the current user (mark related notifications as read)
 * @access  Protected
 */
router.post("/:id/mark-read", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find and mark all unread notifications related to this announcement for this user
    const result = await Notification.updateMany(
      {
        userId: userId,
        relatedEntityType: "announcement",
        relatedEntityId: id,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    // Return the number of notifications marked as read
    res.json({
      success: true,
      notificationsMarkedAsRead: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark announcement as read error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
