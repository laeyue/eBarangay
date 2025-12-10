import mongoose, { Schema, Model } from "mongoose";
import { IAnnouncement } from "../types/index";

/**
 * Announcement Model
 * Separate from Notifications - for barangay-wide announcements
 * Created by admin, visible to all users in a dedicated section
 */
const announcementSchema = new Schema<any>({
  title: {
    type: String,
    required: true,
    trim: true,
    index: "text", // Text index for search functionality
  },
  content: {
    type: String,
    required: true,
    index: "text", // Text index for search functionality
  },
  category: {
    type: String,
    enum: ["general", "event", "announcement", "alert", "update"],
    default: "general",
    index: true, // Index for filtering by category
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true, // Index for quickly fetching pinned announcements
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high"],
    default: "normal",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attachments: [
    {
      filename: String,
      url: String,
      fileType: String,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
    index: true, // Index for filtering active announcements
  },
  publishDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting by date
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for efficient queries
announcementSchema.index({ isActive: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ category: 1, createdAt: -1 });

// Text index for full-text search
announcementSchema.index({ title: "text", content: "text" });

// Update timestamp on save
announcementSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get active announcements
announcementSchema.statics.getActive = function (limit = 20, skip = 0) {
  return this.find({ isActive: true })
    .populate("createdBy", "firstName lastName role")
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to search announcements
announcementSchema.statics.searchAnnouncements = function (query, limit = 20) {
  return this.find({
    $text: { $search: query },
    isActive: true,
  })
    .populate("createdBy", "firstName lastName role")
    .sort({ score: { $meta: "textScore" }, isPinned: -1 })
    .limit(limit);
};

const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>(
  "Announcement",
  announcementSchema
);

export default Announcement;
