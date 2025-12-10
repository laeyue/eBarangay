import mongoose, { Schema, Model } from "mongoose";
import { IDocumentRequest } from "../types/index";

const documentRequestSchema = new Schema<any>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documentType: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "approved", "rejected", "ready", "claimed"],
    default: "pending",
  },
  adminNotes: {
    type: String,
    default: "",
  },
  estimatedCompletion: {
    type: Date,
  },
  statusHistory: [
    {
      status: String,
      note: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

documentRequestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const DocumentRequest: Model<IDocumentRequest> =
  mongoose.model<IDocumentRequest>("DocumentRequest", documentRequestSchema);

export default DocumentRequest;
