import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationNotes?: string;
  verificationDate?: Date;
  profilePicture?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IIncident extends Document {
  userId: string;
  type: string;
  description: string;
  location: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "resolved";
  images?: string[];
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentRequest extends Document {
  userId: string;
  documentType: string;
  purpose: string;
  status: "pending" | "processing" | "ready" | "claimed" | "rejected";
  notes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  author: string;
  category: string;
  priority: "low" | "medium" | "high";
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPoll extends Document {
  question: string;
  options: Array<{
    text: string;
    votes: number;
  }>;
  createdBy: string;
  isActive: boolean;
  expiresAt?: Date;
  voters: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export interface ISmsAlert extends Document {
  phoneNumber: string;
  message: string;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  createdAt: Date;
}
