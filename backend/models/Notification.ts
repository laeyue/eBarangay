import mongoose, { Schema, Model } from "mongoose";
import { INotification } from "../types/index";

/**
 * Notification Model
 * Separate from SmsAlert - for in-app notifications specific to users
 * Tracks individual user notifications for incidents, documents, polls, etc.
 */
const notificationSchema = new Schema<any>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // Index for faster queries
  },
  type: {
    type: String,
    enum: [
      "incident_update", // When incident status changes
      "document_update", // When document request is processed
      "poll", // New poll available or poll update
      "poll_created", // New poll available
      "poll_closing", // Poll ending soon
      "announcement", // General announcement
      "sms", // SMS alert notification
      "system", // System notifications
      "reminder", // Reminders
    ],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  read: {
    type: Boolean,
    default: false,
    index: true, // Index for faster unread queries
  },
  readAt: {
    type: Date,
  },
  // Link to related entity
  relatedEntityType: {
    type: String,
    enum: [
      "incident",
      "document",
      "poll",
      "sms",
      "user",
      "announcement",
      "none",
    ],
    default: "none",
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Action URL (for navigation)
  actionUrl: {
    type: String,
  },
  // Admin notes for internal use
  adminNotes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting by date
  },
});

// Compound index for efficient user-specific queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

// Helper method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification for user
notificationSchema.statics.createForUser = async function (userId, data) {
  return this.create({
    userId,
    ...data,
  });
};

// Static method to create notification for multiple users
notificationSchema.statics.createForUsers = async function (userIds, data) {
  const notifications = userIds.map((userId) => ({
    userId,
    ...data,
  }));
  return this.insertMany(notifications);
};

// Static method to mark multiple as read
notificationSchema.statics.markMultipleAsRead = async function (
  notificationIds,
  userId
) {
  return this.updateMany(
    { _id: { $in: notificationIds }, userId },
    { read: true, readAt: new Date() }
  );
};

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
