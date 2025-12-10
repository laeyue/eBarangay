import mongoose, { Schema, Model } from "mongoose";
import { ISmsAlert } from "../types/index";

// SMS Alert Model for emergency notifications and updates
const smsAlertSchema = new Schema<any>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["emergency", "announcement", "reminder", "update"],
    default: "announcement",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  recipients: {
    type: String,
    enum: ["all", "active", "specific"],
    default: "all",
  },
  specificRecipients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sentCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["draft", "sent", "failed"],
    default: "draft",
  },
  scheduledFor: {
    type: Date,
  },
  sentAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SmsAlert: Model<ISmsAlert> = mongoose.model<ISmsAlert>(
  "SmsAlert",
  smsAlertSchema
);

export default SmsAlert;
