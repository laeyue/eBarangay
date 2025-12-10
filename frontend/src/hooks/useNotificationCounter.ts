import { useEffect, useState, useCallback, useRef } from "react";
import { notifications } from "@/lib/api";

/**
 * Custom hook to manage real-time notification counter
 * Fetches unread notification count and updates it automatically
 * Listens for custom events from other components
 */
export const useNotificationCounter = (pollInterval: number = 3000) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notifications.getUnread();
      const notifList = response?.notifications || [];
      const count = Array.isArray(notifList) ? notifList.length : 0;
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return unreadCount;
    } finally {
      setLoading(false);
    }
  }, [unreadCount]);

  // Start polling for updates
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    // Fetch immediately
    fetchUnreadCount();

    // Then poll at intervals
    pollTimerRef.current = setInterval(() => {
      fetchUnreadCount();
    }, pollInterval);
  }, [fetchUnreadCount, pollInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Manually refresh count (useful when action completes)
  const refresh = useCallback(async () => {
    return await fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Initialize polling on mount
  useEffect(() => {
    startPolling();

    // Listen for manual refresh events from other components
    const handleNotificationUpdate = () => {
      refresh();
    };

    window.addEventListener("notificationUpdated", handleNotificationUpdate);
    window.addEventListener("announcementsViewed", handleNotificationUpdate);
    window.addEventListener("pollsViewed", handleNotificationUpdate);

    return () => {
      stopPolling();
      window.removeEventListener(
        "notificationUpdated",
        handleNotificationUpdate
      );
      window.removeEventListener(
        "announcementsViewed",
        handleNotificationUpdate
      );
      window.removeEventListener("pollsViewed", handleNotificationUpdate);
    };
  }, [startPolling, stopPolling, refresh]);

  return { unreadCount, loading, refresh, setUnreadCount };
};
