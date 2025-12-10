import mongoose from "mongoose";
import Notification from "./models/Notification.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/barangay";

async function forceCleanup() {
  try {
    await mongoose.connect(mongoUri);
    console.log("📊 Connected to MongoDB");

    // Force mark ALL unread poll notifications as read regardless of poll status
    const result = await Notification.updateMany(
      {
        $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
      },
      { read: true, readAt: new Date() }
    );

    console.log(
      `\n✅ Force marked ${result.modifiedCount} poll notifications as read`
    );

    // Verify all poll notifications are now read
    const remaining = await Notification.countDocuments({
      $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
      read: false,
    });

    console.log(`✅ Remaining unread poll notifications: ${remaining}`);

    // Show all poll notifications (read and unread)
    const allPolls = await Notification.countDocuments({
      $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
    });

    console.log(`📊 Total poll notifications (read + unread): ${allPolls}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

forceCleanup();
