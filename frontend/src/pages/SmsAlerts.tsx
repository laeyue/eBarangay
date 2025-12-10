import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, sms, notifications } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Megaphone,
  ArrowLeft,
  Calendar,
  User,
  Search,
  Bell,
  Trash2,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationsSkeleton } from "@/components/ui/loading-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SmsAlert = {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  sentBy: any;
  createdAt: string;
};

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: any;
  adminNotes?: string;
  createdAt: string;
};

/**
 * SMS Alerts Component
 * Shows all SMS alerts sent by admin with notification integration
 */
const SmsAlerts = () => {
  const navigate = useNavigate();
  const [smsAlerts, setSmsAlerts] = useState<SmsAlert[]>([]);
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("notifications");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchData();

    // Listen for notification updates (when new SMS alerts are created)
    const handleNotificationUpdate = () => {
      console.log("📡 Notification update event received, refetching data...");
      fetchData();
    };

    window.addEventListener("notificationUpdated", handleNotificationUpdate);

    // Also poll for new notifications every 3 seconds
    const pollInterval = setInterval(() => {
      console.log("🔄 Polling for new notifications...");
      fetchData();
    }, 3000);

    return () => {
      window.removeEventListener(
        "notificationUpdated",
        handleNotificationUpdate
      );
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    console.log("🔄 notificationsList updated:", notificationsList);
    console.log("📊 Total notifications in state:", notificationsList.length);
  }, [notificationsList]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch SMS alerts
      const smsData = await sms.getAll();
      setSmsAlerts(Array.isArray(smsData) ? smsData : []);

      // Fetch notifications
      const notifData = await notifications.getUnread();
      const allNotifs = notifData?.notifications || [];
      console.log("📢 Fetched unread notifications:", allNotifs);
      console.log("🔍 Total notifications:", allNotifs.length);
      allNotifs.forEach((n: any) => {
        console.log(`   - Type: ${n.type}, Title: ${n.title}, Read: ${n.read}`);
      });
      setNotificationsList(allNotifs);

      // Count ALL unread notifications (not just SMS type)
      const unreadNotifs = allNotifs.filter((n: any) => !n.read);
      setUnreadCount(unreadNotifs.length);
    } catch (error: any) {
      toast.error(error.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const markSmsNotificationsAsRead = async (smsNotifs: Notification[]) => {
    try {
      // Mark all SMS notifications as read
      for (const notif of smsNotifs) {
        await notifications.markAsRead(notif._id);
      }

      // Update local state
      setNotificationsList((prev) =>
        prev.map((n) =>
          n.type?.toLowerCase() === "sms"
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(0);

      // Dispatch event to update notification badge
      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error) {
      console.error("Error marking SMS notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notifications.delete(id);
      setNotificationsList((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);

      // Update unread count
      const smsNotifs = notificationsList.filter(
        (n: any) => n.type?.toLowerCase() === "sms" && !n.read && n._id !== id
      );
      setUnreadCount(smsNotifs.length);

      // Dispatch event to update global notification counter
      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error: any) {
      toast.error(error.message || "Error deleting notification");
    }
  };

  const toggleNotificationReadStatus = async (
    e: React.MouseEvent,
    notif: Notification
  ) => {
    e.stopPropagation();
    try {
      if (notif.read) {
        // Mark as unread
        await notifications.markAsUnread(notif._id);
        setNotificationsList((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: false } : n))
        );
      } else {
        // Mark as read
        await notifications.markAsRead(notif._id);
        setNotificationsList((prev) =>
          prev.map((n) =>
            n._id === notif._id
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
      }

      // Update unread count
      const smsNotifs = notificationsList.filter(
        (n: any) => n.type?.toLowerCase() === "sms" && !n.read
      );
      setUnreadCount(smsNotifs.length);

      // Dispatch event to update global notification counter
      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error) {
      console.error("Error toggling notification read status:", error);
      toast.error("Failed to update notification");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const readNotifications = notificationsList.filter(
        (n) => n.read && n.type?.toLowerCase() === "sms"
      );
      for (const notif of readNotifications) {
        await notifications.delete(notif._id);
      }
      setNotificationsList((prev) =>
        prev.filter((n) => !n.read || n.type?.toLowerCase() !== "sms")
      );
      toast.success("All read SMS notifications deleted");
      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error: any) {
      toast.error(error.message || "Error deleting notifications");
    }
  };

  const confirmDelete = (id: string) => {
    setNotificationToDelete(id);
    setShowDeleteConfirm(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "sms":
        return <Megaphone className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  // Filter SMS alerts based on search query
  const filteredSmsAlerts = smsAlerts.filter(
    (alert) =>
      alert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter SMS notifications
  const smsNotifications = notificationsList.filter(
    (notif) =>
      notif.type?.toLowerCase() === "sms" &&
      (notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
                <Megaphone className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow leading-tight">
                  SMS Alerts
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  View SMS notifications and alerts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

      <div className="container mx-auto px-6 max-w-6xl space-y-6 pb-10 -mt-4">
        {/* Search and Actions Bar */}
        <Card className="shadow-lg border-2 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search SMS alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-2 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-md">
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              SMS Alerts
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-6">
            {smsNotifications.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Notifications
                  </h3>
                  <p className="text-muted-foreground">
                    You're all caught up! Check back later for new
                    notifications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {smsNotifications.length} notification
                    {smsNotifications.length !== 1 ? "s" : ""}
                  </p>
                  {smsNotifications.some((n) => n.read) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteAllRead}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Read
                    </Button>
                  )}
                </div>

                {smsNotifications.map((notif) => (
                  <Card
                    key={notif._id}
                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                      !notif.read
                        ? "border-l-4 border-l-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-full ${
                            !notif.read ? "bg-primary/10" : "bg-muted"
                          }`}
                        >
                          {getTypeIcon(notif.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                                {notif.title}
                                {!notif.read && (
                                  <Badge
                                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                                    onClick={(e) =>
                                      toggleNotificationReadStatus(e, notif)
                                    }
                                  >
                                    Unread
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            <Badge
                              variant="outline"
                              className={getPriorityColor(notif.priority)}
                            >
                              {notif.priority}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(notif._id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* SMS Alerts Tab */}
          <TabsContent value="sms" className="space-y-4 mt-6">
            {filteredSmsAlerts.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchQuery ? "No SMS Alerts Found" : "No SMS Alerts"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search terms."
                      : "No SMS alerts have been sent yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {filteredSmsAlerts.length} SMS alert
                    {filteredSmsAlerts.length !== 1 ? "s" : ""}
                    {searchQuery && " found"}
                  </p>
                </div>

                {filteredSmsAlerts.map((alert) => {
                  // Find if there's an unread notification for this alert
                  const alertNotification = notificationsList.find(
                    (n) => !n.read && n.title === alert.title
                  );

                  return (
                    <Card
                      key={alert._id}
                      className={`hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm border-2 ${
                        alertNotification
                          ? "border-blue-400 bg-blue-50"
                          : "border-blue-200"
                      } hover:border-blue-400`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                            <Megaphone className="w-6 h-6 text-white" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-bold text-xl text-gray-900">
                                {alert.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                {alertNotification && (
                                  <Badge
                                    className="bg-blue-100 hover:bg-blue-200 text-blue-600 cursor-pointer font-semibold"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (alertNotification) {
                                        toggleNotificationReadStatus(
                                          e,
                                          alertNotification
                                        );
                                      }
                                    }}
                                  >
                                    Unread
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`${getPriorityColor(
                                    alert.priority
                                  )} font-semibold`}
                                >
                                  {alert.priority}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-base text-gray-700 mb-4 leading-relaxed">
                              {alert.message}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                              <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
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
                                <span className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  {alert.sentBy.firstName}{" "}
                                  {alert.sentBy.lastName}
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
                  );
                })}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                notification.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  notificationToDelete &&
                  handleDeleteNotification(notificationToDelete)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SmsAlerts;
