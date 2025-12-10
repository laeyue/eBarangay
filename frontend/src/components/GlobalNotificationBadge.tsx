import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { notifications } from "@/lib/api";
import { useNavigate } from "react-router-dom";

/**
 * Global Notification Badge Component
 * Shows unread notification count and appears in header across all pages
 * Updates in real-time when notifications change
 */
export const GlobalNotificationBadge = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const response = await notifications.getUnread();
      const notifList = response?.notifications || [];
      const count = Array.isArray(notifList) ? notifList.length : 0;
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchUnreadCount();

    // Poll every 1 second for real-time updates
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 1000);

    // Listen for notification events from other components
    const handleNotificationUpdate = () => {
      // Immediate refresh on events
      fetchUnreadCount();
    };

    const handleSmsAlertCreated = () => {
      fetchUnreadCount();
    };

    const handlePollCreated = () => {
      fetchUnreadCount();
    };

    const handleAnnouncementCreated = () => {
      fetchUnreadCount();
    };

    window.addEventListener("notificationUpdated", handleNotificationUpdate);
    window.addEventListener("announcementsViewed", handleNotificationUpdate);
    window.addEventListener("pollsViewed", handleNotificationUpdate);
    window.addEventListener("smsAlertCreated", handleSmsAlertCreated);
    window.addEventListener("pollCreated", handlePollCreated);
    window.addEventListener("announcementCreated", handleAnnouncementCreated);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener(
        "notificationUpdated",
        handleNotificationUpdate
      );
      window.removeEventListener(
        "announcementsViewed",
        handleNotificationUpdate
      );
      window.removeEventListener("pollsViewed", handleNotificationUpdate);
      window.removeEventListener("smsAlertCreated", handleSmsAlertCreated);
      window.removeEventListener("pollCreated", handlePollCreated);
      window.removeEventListener(
        "announcementCreated",
        handleAnnouncementCreated
      );
    };
  }, []);

  return (
    <button
      onClick={() => navigate("/notifications")}
      className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
      title="View notifications"
      aria-label="Notifications"
    >
      <Bell className="h-6 w-6" />

      {/* Red Badge with Count */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </button>
  );
};
