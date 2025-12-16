import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, sms, notifications } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  ArrowLeft,
  Calendar,
  Megaphone,
  User,
  CheckCircle2,
} from "lucide-react";
import { NotificationsSkeleton } from "@/components/ui/loading-skeleton";

type SmsAlert = {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  sentBy: any;
  createdAt: string;
};

const NotificationsEnhanced = () => {
  const navigate = useNavigate();
  const [smsAlerts, setSmsAlerts] = useState<SmsAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadSmsCount, setUnreadSmsCount] = useState(0);
  const [unreadSmsIds, setUnreadSmsIds] = useState<string[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const user = auth.getStoredUser();
    if (!user || !auth.isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchData();

    // Refetch SMS alerts when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate]);

  const fetchData = async () => {
    try {
      // Fetch SMS alerts and specifically unread SMS notifications
      const [smsData, unreadSmsData, unreadCount] = await Promise.all([
        sms.getAll(1, 50),
        notifications.getAll(1, 100, true, "sms"),
        notifications.getUnreadCount("sms"),
      ]);

      setSmsAlerts(smsData.alerts || []);

      // Process unread notifications to get IDs
      const unreadList = unreadSmsData?.notifications || [];
      console.log("🔔 Unread SMS notifications:", unreadList);

      const unreadIds = unreadList
        .filter((n: any) => n?.relatedEntityId)
        .map((n: any) => String(n.relatedEntityId));

      console.log("🔔 Extracted unread IDs:", unreadIds);

      setUnreadSmsIds(unreadIds);

      // Fetch unread SMS count
      console.log(
        "📱 SMS Notifications - Unread count API response:",
        unreadCount
      );
      setUnreadSmsCount(unreadCount?.count || 0);
    } catch (error: any) {
      toast.error(error.message || "Error fetching SMS alerts");
    } finally {
      setLoading(false);
    }
  };
  const isSmsUnread = (id: string) => {
    return unreadSmsIds.includes(String(id));
  };

  const handleMarkAllRead = async () => {
    try {
      console.log("🔔 Starting mark all SMS as read...");
      setMarkingAll(true);
      const response = await notifications.markSmsAsRead();
      console.log("📱 Mark SMS as read response:", response);

      // Update local state
      setUnreadSmsCount(0);
      setUnreadSmsIds([]);
      console.log("📱 SMS unread count set to 0");

      // Dispatch event to update dashboard badge
      console.log("🔔 Dispatching smsAlertsViewed event...");
      window.dispatchEvent(new Event("smsAlertsViewed"));

      toast.success("All SMS alerts marked as read");
      console.log("✅ All SMS notifications marked as read");
    } catch (error: any) {
      toast.error(error.message || "Error marking SMS alerts as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-blue-50/30">
      {/* Compact Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-300 rounded-full blur-3xl -ml-40 -mb-40" />
        </div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
                <Bell className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow leading-tight flex items-center gap-3">
                  SMS Alerts
                  {unreadSmsCount > 0 && (
                    <Badge className="bg-red-500 text-white border-none shadow-lg animate-pulse">
                      {unreadSmsCount} New
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  View important messages from barangay officials
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                disabled={markingAll}
                onClick={handleMarkAllRead}
                className="bg-white/15 text-white border border-white/40 hover:bg-white/25 font-semibold h-10 px-4 rounded-lg transition-all duration-300 hover:shadow-lg flex-shrink-0 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark all read {unreadSmsCount > 0 && `(${unreadSmsCount})`}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-white hover:bg-white/20 font-semibold h-10 px-4 rounded-lg transition-all duration-300 hover:shadow-lg flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl space-y-6 pb-10 mt-6">
        {/* SMS Alerts Section */}
        <div className="space-y-4">
          {smsAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No SMS Alerts</h3>
                <p className="text-muted-foreground">
                  No SMS alerts have been sent yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            smsAlerts.map((alert) => (
              <Card
                key={alert._id}
                className={`hover:shadow-md transition-shadow ${
                  isSmsUnread(alert._id)
                    ? "border-blue-500 shadow-blue-100"
                    : ""
                }`}
              >
                <CardContent className="p-5 relative">
                  {isSmsUnread(alert._id) && (
                    <div className="absolute top-5 right-5 z-10">
                      <Badge className="bg-blue-500 hover:bg-blue-600 shadow-sm text-white animate-pulse">
                        Unread
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-blue-100">
                      <Megaphone className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2 pr-20">
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(alert.priority)}
                        >
                          {alert.priority}
                        </Badge>
                      </div>

                      <p className="text-base mb-3">{alert.message}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(alert.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {alert.sentBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {alert.sentBy.firstName} {alert.sentBy.lastName}
                          </span>
                        )}
                        <Badge variant="secondary" className="capitalize">
                          {alert.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsEnhanced;
