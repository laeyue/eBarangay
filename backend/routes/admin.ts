import express from "express";
import Incident from "../models/Incident";
import DocumentRequest from "../models/DocumentRequest";
import User from "../models/User";
import SmsAlert from "../models/SmsAlert";
import Poll from "../models/Poll";
import Notification from "../models/Notification";
import { protect, admin } from "../middleware/auth";
import { validateObjectId } from "../middleware/validation";

const router = express.Router();

// All routes require admin access
router.use(protect, admin);

// Helper to safely parse query parameters
const parseQueryParam = (param: any): string => {
  return typeof param === "string" ? param : "";
};

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalIncidents = await Incident.countDocuments();
    const totalDocuments = await DocumentRequest.countDocuments();
    const totalPolls = await Poll.countDocuments({ isDeleted: false });
    const totalSmsAlerts = await SmsAlert.countDocuments({ status: "sent" });

    const pendingIncidents = await Incident.countDocuments({
      status: "pending",
    });
    const pendingDocuments = await DocumentRequest.countDocuments({
      status: "pending",
    });
    const activePolls = await Poll.countDocuments({
      status: "active",
      isDeleted: false,
      endDate: { $gt: new Date() },
    });
    const activeUsers = await User.countDocuments({
      isActive: true,
      role: "user",
    });
    const verifiedUsers = await User.countDocuments({
      isVerified: true,
      role: "user",
    });

    const recentIncidents = await Incident.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentDocuments = await DocumentRequest.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalIncidents,
      totalDocuments,
      totalPolls,
      totalSmsAlerts,
      pendingIncidents,
      pendingDocuments,
      activePolls,
      activeUsers,
      verifiedUsers,
      recentIncidents,
      recentDocuments,
      recentUsers,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all incidents with pagination
router.get("/incidents", async (req, res) => {
  try {
    const pageParam = parseQueryParam(req.query.page) || "1";
    const limitParam = parseQueryParam(req.query.limit) || "10";
    const statusParam = parseQueryParam(req.query.status);

    const page = parseInt(pageParam) || 1;
    const limit = parseInt(limitParam) || 10;

    const query: Record<string, any> = statusParam
      ? { status: statusParam }
      : {};
    const incidents = await Incident.find(query)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments(query);

    res.json({
      incidents,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update incident status and/or admin notes
router.patch("/incidents/:id", validateObjectId("id"), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const oldStatus = incident.status;
    if (status) incident.status = status;
    if (adminNotes !== undefined) incident.adminNotes = adminNotes;

    await incident.save();

    // Create notification for user if status changed
    if (status && status !== oldStatus) {
      const notificationData = {
        type: "incident_update",
        title: "Incident Status Updated",
        message: `Your incident report has been updated to ${status}`,
        priority: status === "resolved" ? "high" : "medium",
        relatedEntityType: "incident",
        relatedEntityId: incident._id,
        actionUrl: "/report-incident",
      };

      // Create notification directly without createForUser method
      await Notification.create({
        userId: incident.userId,
        ...notificationData,
      });
    }

    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all document requests with pagination
router.get("/documents", async (req, res) => {
  try {
    const pageParam = parseQueryParam(req.query.page) || "1";
    const limitParam = parseQueryParam(req.query.limit) || "10";
    const statusParam = parseQueryParam(req.query.status);

    const page = parseInt(pageParam) || 1;
    const limit = parseInt(limitParam) || 10;

    const query: Record<string, any> = statusParam
      ? { status: statusParam }
      : {};
    const documents = await DocumentRequest.find(query)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await DocumentRequest.countDocuments(query);

    res.json({
      documents,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update document request status and/or admin notes
router.patch("/documents/:id", validateObjectId("id"), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const document = await DocumentRequest.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document request not found" });
    }

    const oldStatus = document.status;

    if (status) document.status = status;
    if (adminNotes !== undefined) document.adminNotes = adminNotes;

    await document.save();

    // Create notification for user if status changed
    if (status && status !== oldStatus) {
      const statusMessages: Record<string, string> = {
        processing: "is now being processed",
        approved: "has been approved and is being prepared",
        ready: "is ready for pickup at the barangay office",
        claimed: "has been marked as claimed",
        rejected: "has been rejected",
      };

      const notificationData = {
        type: "document_update",
        title: "Document Request Update",
        message: `Your document request ${
          statusMessages[status] || "has been updated"
        }`,
        priority: ["ready", "rejected"].includes(status) ? "high" : "medium",
        relatedEntityType: "document",
        relatedEntityId: document._id,
        actionUrl: "/request-document",
      };

      // Create notification directly
      await Notification.create({
        userId: document.userId,
        ...notificationData,
      });
    }

    res.json(document);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete incident
router.delete("/incidents/:id", validateObjectId("id"), async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json({ message: "Incident deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete document request
router.delete("/documents/:id", validateObjectId("id"), async (req, res) => {
  try {
    const document = await DocumentRequest.findByIdAndDelete(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document request not found" });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get("/users", async (req, res) => {
  try {
    const pageParam = parseQueryParam(req.query.page) || "1";
    const limitParam = parseQueryParam(req.query.limit) || "10";
    const searchParam = parseQueryParam(req.query.search);
    const isActiveParam = parseQueryParam(req.query.isActive);

    const page = parseInt(pageParam) || 1;
    const limit = parseInt(limitParam) || 10;

    let query: Record<string, any> = { role: "user" };

    if (searchParam) {
      query.$or = [
        { firstName: { $regex: searchParam, $options: "i" } },
        { lastName: { $regex: searchParam, $options: "i" } },
        { email: { $regex: searchParam, $options: "i" } },
      ];
    }

    if (isActiveParam) {
      query.isActive = isActiveParam === "true";
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details with their activity
 * @access  Admin
 */
router.get("/users/:id", validateObjectId("id"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const incidents = await Incident.find({ userId: req.params.id }).sort({
      createdAt: -1,
    });
    const documents = await DocumentRequest.find({
      userId: req.params.id,
    }).sort({ createdAt: -1 });

    res.json({
      user,
      incidents,
      documents,
      stats: {
        totalIncidents: incidents.length,
        totalDocuments: documents.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH/PUT /api/admin/users/:id
 * @desc    Update user details (role, status, etc.)
 * @access  Admin
 */
const updateUserHandler = async (req: any, res: any) => {
  try {
    const {
      role,
      isActive,
      phoneNumber,
      address,
      isVerified,
      verificationStatus,
      verificationNotes,
      verificationDate,
    } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (verificationStatus !== undefined)
      user.verificationStatus = verificationStatus;
    if (verificationNotes !== undefined)
      user.verificationNotes = verificationNotes;
    if (verificationDate !== undefined)
      user.verificationDate = verificationDate;

    await user.save();

    // Create notification if verification status was updated
    if (verificationStatus !== undefined) {
      const statusMessages = {
        approved: "Your resident verification has been approved! 🎉",
        rejected:
          "Your resident verification was rejected. Please check the notes for details.",
        pending: "Your resident verification is pending review.",
      };

      try {
        await Notification.create({
          userId: user._id,
          type: "verification_status",
          title: "Verification Status Updated",
          message:
            statusMessages[verificationStatus as keyof typeof statusMessages] ||
            "Your verification status has been updated",
          priority: "high",
          read: false,
          relatedEntityType: "verification_status",
          relatedEntityId: user._id,
          actionUrl: "/profile",
        });
        console.log(
          `✅ Created verification notification for user ${user._id}`
        );
      } catch (notifError) {
        console.log(
          `⚠️ Could not create verification notification:`,
          notifError.message
        );
        // Don't block the user update if notification creation fails
      }
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Support both PATCH and PUT for updateUser
router.patch("/users/:id", validateObjectId("id"), updateUserHandler);
router.put("/users/:id", validateObjectId("id"), updateUserHandler);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deactivate user account
 * @access  Admin
 */
router.delete("/users/:id", validateObjectId("id"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: "User deactivated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
