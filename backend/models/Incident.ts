import mongoose, { Schema, Model } from "mongoose";
import { IIncident } from "../types/index";

const incidentSchema = new Schema<any>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "crime",
      "public-safety",
      "infrastructure",
      "health",
      "environment",
      "noise",
      "other",
    ],
    default: "other",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  photoUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "in-progress", "resolved"],
    default: "pending",
  },
  adminNotes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

incidentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Incident: Model<IIncident> = mongoose.model<IIncident>(
  "Incident",
  incidentSchema
);

export default Incident;
