import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/lib/api";
import {
  Bell,
  Megaphone,
  Vote,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

interface NotificationCount {
  poll: number;
  announcement: number;
  sms: number;
  incident_update: number;
  document_update: number;
  total: number;
}

/**
 * Notification Count UI Component
 * Displays a breakdown of unread notifications by type
 * Used for dashboard and notification overview
 */
export const NotificationCountUI = () => {
  const [counts, setCounts] = useState<NotificationCount>({
    poll: 0,
    announcement: 0,
    sms: 0,
    incident_update: 0,
    document_update: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const response = await notifications.getUnread();
      const notifList = response?.notifications || [];

      const newCounts: NotificationCount = {
        poll: 0,
        announcement: 0,
        sms: 0,
        incident_update: 0,
        document_update: 0,
        total: Array.isArray(notifList) ? notifList.length : 0,
      };

      // Count by type
      if (Array.isArray(notifList)) {
        notifList.forEach((notif: any) => {
          const type = notif?.type?.toLowerCase?.();
          if (type === "poll") newCounts.poll++;
          else if (type === "announcement") newCounts.announcement++;
          else if (type === "sms") newCounts.sms++;
          else if (type === "incident_update") newCounts.incident_update++;
          else if (type === "document_update") newCounts.document_update++;
        });
      }

      setCounts(newCounts);
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Poll every 1 second for real-time updates
    const pollInterval = setInterval(() => {
      fetchCounts();
    }, 1000);

    // Listen for events
    const handleUpdate = () => fetchCounts();
    const handleSmsCreated = () => fetchCounts();
    const handlePollCreated = () => fetchCounts();
    const handleAnnouncementCreated = () => fetchCounts();

    window.addEventListener("notificationUpdated", handleUpdate);
    window.addEventListener("announcementsViewed", handleUpdate);
    window.addEventListener("pollsViewed", handleUpdate);
    window.addEventListener("smsAlertCreated", handleSmsCreated);
    window.addEventListener("pollCreated", handlePollCreated);
    window.addEventListener("announcementCreated", handleAnnouncementCreated);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("notificationUpdated", handleUpdate);
      window.removeEventListener("announcementsViewed", handleUpdate);
      window.removeEventListener("pollsViewed", handleUpdate);
      window.removeEventListener("smsAlertCreated", handleSmsCreated);
      window.removeEventListener("pollCreated", handlePollCreated);
      window.removeEventListener(
        "announcementCreated",
        handleAnnouncementCreated
      );
    };
  }, []);

  return (
    <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-blue-600" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Count */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <span className="font-semibold text-blue-900">Total Unread</span>
            <Badge
              variant="destructive"
              className={`text-lg px-3 py-1 ${
                counts.total > 0 ? "animate-pulse" : ""
              }`}
            >
              {counts.total}
            </Badge>
          </div>

          {/* Notification Type Breakdown */}
          <div className="space-y-2">
            {/* Polls */}
            {counts.poll > 0 && (
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-900 font-medium">
                    Community Polls
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-purple-200 text-purple-900"
                >
                  {counts.poll}
                </Badge>
              </div>
            )}

            {/* Announcements */}
            {counts.announcement > 0 && (
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-900 font-medium">
                    Announcements
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-200 text-green-900"
                >
                  {counts.announcement}
                </Badge>
              </div>
            )}

            {/* SMS Alerts */}
            {counts.sms > 0 && (
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-900 font-medium">
                    SMS Alerts
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-orange-200 text-orange-900"
                >
                  {counts.sms}
                </Badge>
              </div>
            )}

            {/* Incident Updates */}
            {counts.incident_update > 0 && (
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-900 font-medium">
                    Incident Updates
                  </span>
                </div>
                <Badge variant="secondary" className="bg-red-200 text-red-900">
                  {counts.incident_update}
                </Badge>
              </div>
            )}

            {/* Document Updates */}
            {counts.document_update > 0 && (
              <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm text-indigo-900 font-medium">
                    Document Updates
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-indigo-200 text-indigo-900"
                >
                  {counts.document_update}
                </Badge>
              </div>
            )}

            {/* No Notifications */}
            {counts.total === 0 && (
              <div className="flex items-center justify-center p-4 text-gray-400 text-sm">
                <span>No unread notifications</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
