import mongoose from "mongoose";
import Notification from "./models/Notification.js";
import Poll from "./models/Poll.js";
import dotenv from "dotenv";

dotenv.config();

const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/barangay";

async function cleanup() {
  try {
    await mongoose.connect(mongoUri);
    console.log("📊 Connected to MongoDB");

    // Find all unread poll notifications
    const unreadPolls = await Notification.find({
      read: false,
      $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
    });

    console.log(`\n📊 Found ${unreadPolls.length} unread poll notifications`);

    for (const notif of unreadPolls) {
      const entityId = (notif as any).relatedEntityId;
      const poll = await Poll.findById(entityId);
      console.log(
        `  - NotifID: ${notif._id}, PollID: ${entityId}, Status: ${
          poll ? (poll as any).status : "DELETED"
        }`
      );
    }

    // Mark all unread poll notifications as read
    const result = await Notification.updateMany(
      {
        read: false,
        $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
      },
      { read: true, readAt: new Date() }
    );

    console.log(
      `\n✅ Marked ${result.modifiedCount} unread poll notifications as read`
    );

    // Verify cleanup
    const remaining = await Notification.countDocuments({
      read: false,
      $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
    });

    console.log(`✅ Remaining unread poll notifications: ${remaining}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

cleanup();
