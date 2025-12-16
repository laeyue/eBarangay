import express from "express";
import Notification from "../models/Notification";
import Poll from "../models/Poll";
import { protect, admin } from "../middleware/auth";

const router = express.Router();

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for user
 * @access  Protected
 */
router.patch("/mark-all-read", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/notifications/mark-announcements-read
 * @desc    Mark all announcement notifications as read for user
 * @access  Protected
 */
router.patch("/mark-announcements-read", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId: req.user._id,
        read: false,
        $or: [{ type: "announcement" }, { relatedEntityType: "announcement" }],
      },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: "Announcement notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/notifications/mark-sms-read
 * @desc    Mark all SMS notifications as read for user
 * @access  Protected
 */
router.patch("/mark-sms-read", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId: req.user._id,
        read: false,
        $or: [{ type: "sms" }, { relatedEntityType: "sms" }],
      },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: "SMS notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/notifications/mark-polls-read
 * @desc    Mark all poll notifications as read for user
 * @access  Protected
 */
router.patch("/mark-polls-read", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId: req.user._id,
        read: false,
        $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
      },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: "Poll notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/notifications/mark-verification-read
 * @desc    Mark all verification status notifications as read for user
 * @access  Protected
 */
router.patch("/mark-verification-read", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId: req.user._id,
        read: false,
        $or: [
          { type: "verification_status" },
          { relatedEntityType: "verification_status" },
        ],
      },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: "Verification notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/notifications/delete-all-read
 * @desc    Delete all read notifications for user
 * @access  Protected
 * @note    This specific route MUST come before DELETE /:id to avoid route matching issues
 */
router.delete("/delete-all-read", protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      read: true,
    });
    res.json({ message: `${result.deletedCount} notifications deleted` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/notifications/unread
 * @desc    Get all unread notifications
 * @access  Protected
 */
router.get("/unread", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      read: false,
    }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Protected
 */
router.get("/unread-count", protect, async (req, res) => {
  try {
    const type = req.query.type?.toString().toLowerCase();

    // For polls, aggressively clean up unread notifications for non-active polls
    if (type === "poll") {
      // Get all unread poll notifications for this user
      const allPollNotifications = await Notification.find({
        userId: req.user._id,
        read: false,
        $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
      });

      // Check each notification and mark as read if poll is not active
      let toMarkAsRead = [];
      for (const notification of allPollNotifications) {
        if (notification.relatedEntityId) {
          const poll = await Poll.findById(notification.relatedEntityId);
          if (!poll || poll.status !== "active") {
            toMarkAsRead.push(notification._id);
          }
        } else {
          // No related entity ID, mark as read
          toMarkAsRead.push(notification._id);
        }
      }

      // Mark all non-active poll notifications as read in one operation
      if (toMarkAsRead.length > 0) {
        await Notification.updateMany(
          { _id: { $in: toMarkAsRead } },
          { read: true, readAt: new Date() }
        );
      }

      // Now count only active polls
      const activePolls = await Poll.find({
        status: "active",
        isDeleted: false,
      }).select("_id");

      const activePollIds = activePolls.map((p) => p._id);

      // Get unread notifications only for active polls
      // If no active polls exist, count should be 0
      let count = 0;
      if (activePollIds.length > 0) {
        const activePollNotifications = await Notification.find({
          userId: req.user._id,
          read: false,
          relatedEntityId: { $in: activePollIds },
          $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
        });
        count = activePollNotifications.length;
      }

      return res.json({ count });
    }

    const baseQuery: any = {
      userId: req.user._id,
      read: false,
    };

    if (type) {
      baseQuery.$or = [{ type }, { relatedEntityType: type }];
    }

    const count = await Notification.countDocuments(baseQuery);
    res.json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.json({ count: 0 });
  }
});

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications with pagination and filtering
 * @access  Protected
 */
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === "true";
    const type = req.query.type;

    // Build query
    const query = { userId: req.user._id };
    if (unreadOnly) {
      query.read = false;
    }
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/notifications/:id/admin-notes
 * @desc    Update admin notes on a notification (admin only)
 * @access  Admin
 */
router.patch("/:id/admin-notes", protect, admin, async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.adminNotes = adminNotes || "";
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Protected
 */
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.markAsRead();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/notifications/:id/unread
 * @desc    Mark notification as unread
 * @access  Protected
 */
router.patch("/:id/unread", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Mark as unread
    notification.read = false;
    notification.readAt = undefined;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Protected
 * @note    This parameterized route must come after specific DELETE routes
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.deleteOne();
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
