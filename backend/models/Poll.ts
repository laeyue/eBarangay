import mongoose, { Schema, Model } from "mongoose";
import { IPoll } from "../types/index";

// Poll/Voting Model for online consultations with soft delete and undo support
const pollSchema = new Schema<any>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["poll", "survey", "consultation", "vote"],
    default: "poll",
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["single", "multiple", "text"],
        default: "single",
      },
      options: [
        {
          text: String,
          votes: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
  ],
  responses: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      answers: [
        {
          questionIndex: Number,
          selectedOptions: [Number],
          textAnswer: String,
        },
      ],
      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ["draft", "active", "closed", "archived"],
    default: "draft",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  // Soft delete support for UNDO functionality
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

pollSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Poll: Model<IPoll> = mongoose.model<IPoll>("Poll", pollSchema);

export default Poll;
