import express from "express";
import SmsAlert from "../models/SmsAlert";
import Notification from "../models/Notification";
import User from "../models/User";
import { protect, admin } from "../middleware/auth";

const router = express.Router();

/**
 * @route   GET /api/sms
 * @desc    Get all SMS alerts (users can view notifications sent to them)
 * @access  Protected
 */
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // If user is admin, show all alerts; otherwise show only alerts relevant to the user
    let query: any = {};

    if (req.user.role !== "admin") {
      // Non-admin users see SMS sent to "all" users, "active" users (if they're active), or specifically to them
      const conditions = [{ recipients: "all" }];

      // If user is active, include SMS sent to active users
      if (req.user.isActive) {
        conditions.push({ recipients: "active" });
      }

      // Always include SMS sent specifically to this user
      conditions.push({ specificRecipients: req.user._id });

      query.$or = conditions;
    }

    const alerts = await SmsAlert.find(query)
      .populate("sentBy", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SmsAlert.countDocuments(query);

    res.json({
      alerts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/sms/send
 * @desc    Send SMS alert to residents
 * @access  Admin
 */
router.post("/send", protect, admin, async (req, res) => {
  try {
    const { title, message, type, priority, recipients, specificRecipients } =
      req.body;

    // Create SMS alert record
    const smsAlert = await SmsAlert.create({
      title,
      message,
      type,
      priority,
      recipients,
      specificRecipients: recipients === "specific" ? specificRecipients : [],
      sentBy: req.user._id,
    });

    // Get recipients based on selection
    let recipientUsers = [];
    if (recipients === "all") {
      recipientUsers = await User.find({}).select(
        "phoneNumber firstName lastName"
      );
    } else if (recipients === "active") {
      recipientUsers = await User.find({ isActive: true }).select(
        "phoneNumber firstName lastName"
      );
    } else if (recipients === "specific") {
      recipientUsers = await User.find({
        _id: { $in: specificRecipients },
      }).select("phoneNumber firstName lastName");
    }

    // Filter users with phone numbers
    const recipientsWithPhone = recipientUsers.filter(
      (user) => user.phoneNumber
    );

    // TODO: Integrate with SMS gateway (Twilio, Semaphore, etc.)
    // For now, we'll mark as sent
    smsAlert.sentCount = recipientsWithPhone.length;
    smsAlert.status = "sent";
    smsAlert.sentAt = Date.now();
    await smsAlert.save();

    // Create notifications for all recipients
    try {
      const notificationData = {
        type: "sms",
        title: title,
        message: message,
        priority: priority || "medium",
        relatedEntityType: "sms",
        relatedEntityId: smsAlert._id,
        actionUrl: "/notifications",
      };

      // Get user IDs based on recipients filter
      let userIds = [];
      if (recipients === "all") {
        const allUsers = await User.find({}).select("_id");
        userIds = allUsers.map((u) => u._id);
      } else if (recipients === "active") {
        const activeUsers = await User.find({ isActive: true }).select("_id");
        userIds = activeUsers.map((u) => u._id);
      } else if (recipients === "specific") {
        userIds = specificRecipients;
      }

      // Always add the creator to the notification list
      const creatorId = req.user._id.toString();
      if (!userIds.some((id) => id.toString() === creatorId)) {
        userIds.push(req.user._id);
      }

      // Create notifications for all recipients + creator
      if (userIds.length > 0) {
        await Notification.createForUsers(userIds, notificationData);
      }
    } catch (notifError) {
      console.error("Error creating SMS notifications:", notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message: `SMS alert sent to ${recipientsWithPhone.length} recipients`,
      alert: smsAlert,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/sms/:id
 * @desc    Get SMS alert details with recipient information
 * @access  Admin
 */
router.get("/:id", protect, admin, async (req, res) => {
  try {
    const alert = await SmsAlert.findById(req.params.id)
      .populate("sentBy", "firstName lastName email")
      .populate(
        "specificRecipients",
        "firstName lastName phoneNumber profilePicture"
      );

    if (!alert) {
      return res.status(404).json({ message: "SMS alert not found" });
    }

    // Build recipients array with status information
    let recipients = [];

    if (alert.recipients === "specific" && alert.specificRecipients) {
      // For specific recipients, use the populated data
      recipients = alert.specificRecipients.map((user: any) => ({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        status: alert.status === "sent" ? "sent" : "pending",
      }));
    } else if (alert.recipients === "all" || alert.recipients === "active") {
      // For all/active recipients, fetch the users
      const query = alert.recipients === "all" ? {} : { isActive: true };
      const users = await User.find(query)
        .select("firstName lastName phoneNumber profilePicture")
        .limit(50); // Limit to 50 for performance

      recipients = users
        .filter((user) => user.phoneNumber)
        .map((user) => ({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          status: alert.status === "sent" ? "sent" : "pending",
        }));
    }

    // Return alert with recipients array
    const alertData = alert.toObject();
    alertData.recipients = recipients;

    res.json(alertData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/sms/:id
 * @desc    Update SMS alert
 * @access  Admin
 */
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { title, message, type, priority } = req.body;

    const alert = await SmsAlert.findByIdAndUpdate(
      req.params.id,
      {
        title,
        message,
        type,
        priority,
      },
      { new: true }
    )
      .populate("sentBy", "firstName lastName email")
      .populate(
        "specificRecipients",
        "firstName lastName phoneNumber profilePicture"
      );

    if (!alert) {
      return res.status(404).json({ message: "SMS alert not found" });
    }

    res.json({
      success: true,
      message: "SMS alert updated successfully",
      alert,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/sms/:id
 * @desc    Delete SMS alert
 * @access  Admin
 */
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const alert = await SmsAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "SMS alert not found" });
    }

    await alert.deleteOne();
    res.json({ message: "SMS alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
