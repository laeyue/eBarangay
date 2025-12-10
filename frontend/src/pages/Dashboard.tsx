import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  incidents,
  documents,
  sms,
  polls,
  announcements,
  notifications,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FileText,
  AlertCircle,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Vote,
  Megaphone,
  Search,
  ArrowRight,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";

type User = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type Incident = {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  status: string;
  createdAt: string;
};

type DocumentRequest = {
  _id: string;
  documentType: string;
  status: string;
  purpose?: string;
  createdAt: string;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge className="shadow-sm bg-blue-500 text-white hover:bg-blue-600">
          Pending
        </Badge>
      );
    case "in_progress":
    case "processing":
      return (
        <Badge className="shadow-sm bg-blue-600 text-white hover:bg-blue-700">
          In Progress
        </Badge>
      );
    case "resolved":
    case "ready":
      return (
        <Badge className="shadow-sm bg-green-500 text-white hover:bg-green-600">
          Ready
        </Badge>
      );
    case "claimed":
      return (
        <Badge className="shadow-sm bg-green-600 text-white hover:bg-green-700">
          Claimed
        </Badge>
      );
    case "approved":
      return (
        <Badge className="shadow-sm bg-green-500 text-white hover:bg-green-600">
          Approved
        </Badge>
      );
    default:
      return (
        <Badge className="shadow-sm bg-gray-500 text-white">{status}</Badge>
      );
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [incidentsList, setIncidentsList] = useState<Incident[]>([]);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(
    []
  );
  const [smsAlerts, setSmsAlerts] = useState<any[]>([]);
  const [pollsData, setPollsData] = useState<any[]>([]);
  const [announcementsData, setAnnouncementsData] = useState<any[]>([]);
  const [newPollsCount, setNewPollsCount] = useState(0);
  const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);
  const [newSmsCount, setNewSmsCount] = useState(0);
  const [newVerificationCount, setNewVerificationCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedUser = auth.getStoredUser();
    if (!storedUser || !auth.isAuthenticated()) {
      navigate("/login");
      return;
    }

    setUser(storedUser);
    fetchUserActivity();

    // Poll for updates every 2 seconds to show notification count changes in real-time
    const pollInterval = setInterval(() => {
      fetchUserActivity();
    }, 2000);

    // Also refetch when page becomes visible (user returns from another tab/page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh user data in case profile picture was updated
        const updatedUser = auth.getStoredUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
        fetchUserActivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for announcementsViewed event to refresh notification count
    const handleAnnouncementsViewed = () => {
      console.log(
        "🔔 Announcements viewed event received - refreshing badge..."
      );
      fetchUserActivity();
    };

    // Listen for when polls are created
    const handlePollCreated = () => {
      console.log("🔔 Poll created event received - refreshing...");
      setTimeout(() => {
        fetchUserActivity();
      }, 500);
    };

    // Listen for when announcements are created
    const handleAnnouncementCreated = () => {
      console.log("🔔 Announcement created event received - refreshing...");
      // Add a small delay to ensure backend has time to create notifications
      setTimeout(() => {
        fetchUserActivity();
      }, 500);
    };

    // Listen for when SMS alerts are created
    const handleSmsCreated = () => {
      console.log("🔔 SMS created event received - refreshing...");
      setTimeout(() => {
        fetchUserActivity();
      }, 500);
    };

    // Listen for when SMS alerts are marked as read
    const handleSmsAlertsViewed = () => {
      console.log("🔔 SMS alerts viewed event received - refreshing badge...");
      fetchUserActivity();
    };

    // Listen for when a user votes on a poll
    const handlePollVoted = () => {
      console.log("🗳️ Poll voted event received - decrementing badge...");
      setNewPollsCount((prev) => Math.max(0, prev - 1));
      // Also refresh data to ensure consistency
      setTimeout(() => {
        fetchUserActivity();
      }, 300);
    };

    // Listen for when verification status is updated
    const handleVerificationUpdated = () => {
      console.log("✅ Verification status updated - refreshing badge...");
      fetchUserActivity();
    };

    window.addEventListener("announcementsViewed", handleAnnouncementsViewed);
    window.addEventListener("pollCreated", handlePollCreated);
    window.addEventListener("announcementCreated", handleAnnouncementCreated);
    window.addEventListener("smsAlertCreated", handleSmsCreated);
    window.addEventListener("smsAlertsViewed", handleSmsAlertsViewed);
    window.addEventListener("verificationUpdated", handleVerificationUpdated);
    window.addEventListener("pollVoted", handlePollVoted);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        "announcementsViewed",
        handleAnnouncementsViewed
      );
      window.removeEventListener("pollCreated", handlePollCreated);
      window.removeEventListener(
        "announcementCreated",
        handleAnnouncementCreated
      );
      window.removeEventListener("smsAlertCreated", handleSmsCreated);
      window.removeEventListener("smsAlertsViewed", handleSmsAlertsViewed);
      window.removeEventListener("pollVoted", handlePollVoted);
      window.removeEventListener(
        "verificationUpdated",
        handleVerificationUpdated
      );
    };
  }, [navigate]);

  const fetchUserActivity = async () => {
    try {
      const [
        incidentsData,
        requestsData,
        smsData,
        pollsDataRes,
        announcementsDataRes,
        unreadData,
        announcementUnreadCountRes,
        smsUnreadCountRes,
        pollUnreadCountRes,
        verificationUnreadCountRes,
      ] = await Promise.all([
        incidents.getMyIncidents(),
        documents.getMyRequests(),
        sms.getAll(1, 10),
        polls.getAll(1, 100),
        announcements.getAll(1, 100),
        notifications.getUnread(),
        notifications.getUnreadCount("announcement"),
        notifications.getUnreadCount("sms"),
        notifications.getUnreadCount("poll"),
        notifications.getUnreadCount("verification_status"),
      ]);

      setIncidentsList(incidentsData);
      setDocumentRequests(requestsData);
      setSmsAlerts(smsData?.alerts || []);
      setPollsData(pollsDataRes?.polls || pollsDataRes || []);
      setAnnouncementsData(
        announcementsDataRes?.announcements || announcementsDataRes || []
      );
      const unreadList = unreadData?.notifications || unreadData || [];
      const unreadCount = Array.isArray(unreadList) ? unreadList.length : 0;

      console.log("=== ANNOUNCEMENT DEBUG ===");
      console.log("Raw unread data:", unreadData);
      console.log("Unread list:", unreadList);
      console.log("Unread list is array?:", Array.isArray(unreadList));
      console.log("Unread list length:", unreadList.length);

      // Count unread notifications by type
      const unreadPolls = Array.isArray(unreadList)
        ? unreadList.filter((n: any) => {
            const type = n?.type?.toLowerCase?.() || "";
            console.log(
              `Checking poll notification type: "${n?.type}" -> "${type}"`
            );
            return type === "poll" || type === "poll_created";
          }).length
        : 0;

      // Prefer server-side filtered unread announcements (type or relatedEntityType), fallback to filtering unread list
      const unreadAnnouncementsFromApi =
        typeof announcementUnreadCountRes?.count === "number"
          ? announcementUnreadCountRes.count
          : 0;

      const unreadAnnouncementsFallback = Array.isArray(unreadList)
        ? unreadList.filter((n: any) => {
            const type = n?.type?.toLowerCase?.() || "";
            const relatedType = n?.relatedEntityType?.toLowerCase?.() || "";
            const isAnnouncement =
              type === "announcement" || relatedType === "announcement";
            return isAnnouncement;
          }).length
        : 0;

      const unreadAnnouncements = Math.max(
        unreadAnnouncementsFromApi,
        unreadAnnouncementsFallback
      );

      // Prefer server-side filtered unread SMS (type or relatedEntityType), fallback to filtering unread list
      const unreadSmsFromApi =
        typeof smsUnreadCountRes?.count === "number"
          ? smsUnreadCountRes.count
          : 0;

      const unreadSmsFallback = Array.isArray(unreadList)
        ? unreadList.filter((n: any) => {
            const type = n?.type?.toLowerCase?.() || "";
            const relatedType = n?.relatedEntityType?.toLowerCase?.() || "";
            const isSms = type === "sms" || relatedType === "sms";
            return isSms;
          }).length
        : 0;

      const unreadSms = Math.max(unreadSmsFromApi, unreadSmsFallback);

      // Prefer server-side filtered unread polls (type or relatedEntityType), fallback to filtering unread list
      const unreadPollsFromApi =
        typeof pollUnreadCountRes?.count === "number"
          ? pollUnreadCountRes.count
          : 0;

      // For polls, ONLY use the API count since backend handles cleanup properly
      const unreadPollsCount = unreadPollsFromApi;

      console.log("📊 Dashboard Notification Counts:", {
        totalUnread: unreadCount,
        unreadPollsFromApi,
        unreadPollsCount,
        unreadAnnouncementsFromApi,
        unreadAnnouncementsFallback,
        unreadAnnouncements,
        unreadSmsFromApi,
        unreadSmsFallback,
        unreadSms,
        pollCountRes: pollUnreadCountRes,
        announcementCountRes: announcementUnreadCountRes,
        smsCountRes: smsUnreadCountRes,
        notificationTypes: unreadList.map((n: any) => n?.type),
      });

      const unreadVerificationFromApi =
        typeof verificationUnreadCountRes?.count === "number"
          ? verificationUnreadCountRes.count
          : 0;

      setUnreadNotificationsCount(unreadCount);
      setNewPollsCount(unreadPollsCount); // Use unread polls count
      setNewAnnouncementsCount(unreadAnnouncements);
      setNewSmsCount(unreadSms);
      setNewVerificationCount(unreadVerificationFromApi);
    } catch (error: any) {
      toast.error(error.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const quickActions = [
    {
      icon: AlertCircle,
      title: "Report Incident",
      description: "Submit a new incident report",
      action: () => navigate("/report-incident"),
    },
    {
      icon: FileText,
      title: "Request Document",
      description: "Request barangay certificates",
      action: () => navigate("/request-document"),
    },
    {
      icon: MessageSquare,
      title: "SMS Alerts",
      description: "View SMS notifications",
      action: () => navigate("/sms-alerts"),
    },
    {
      icon: Vote,
      title: "Community Polls",
      description: "Participate in voting & consultations",
      action: () => navigate("/polls"),
    },
    {
      icon: Megaphone,
      title: "Announcements",
      description: "Check latest barangay updates",
      action: () => navigate("/announcements"),
    },
    {
      icon: UserIcon,
      title: "My Profile",
      description: "Manage your account settings",
      action: () => navigate("/profile"),
    },
  ];

  // Filter incidents and documents based on search query
  const filteredIncidents = incidentsList.filter(
    (incident) =>
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocuments = documentRequests.filter(
    (doc) =>
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/ebarangay-logo.svg"
                  alt="BarangayConnect"
                  className="h-10 w-10 rounded-lg shadow-lg"
                />
                <span className="font-bold text-xl">BarangayConnect</span>
              </div>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-cyan-50/30">
      {/* Enhanced Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gradient-to-r from-blue-200 to-cyan-200 bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/ebarangay-logo.svg"
                alt="BarangayConnect"
                className="h-10 w-10 rounded-lg shadow-lg"
              />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                BarangayConnect
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-700">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-blue-500/70">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="btn-scale border-2 border-blue-300 text-blue-700 hover:bg-red-50 hover:text-red-700 hover:border-red-400 transition-all font-semibold h-9"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Hero Welcome Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white p-8 md:p-12 shadow-2xl animate-fade-in">
          {/* Animated Background Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/15 rounded-full blur-3xl -mr-48" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl -ml-48" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Badge
              variant="secondary"
              className="mb-4 shadow-lg bg-white/25 text-white border-white/40 backdrop-blur-sm font-semibold"
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Dashboard Overview
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-3 text-white drop-shadow-lg">
              Welcome, {user?.firstName}! 👋
            </h1>
            <p className="text-lg text-white/95 mb-8 max-w-2xl drop-shadow-md font-medium">
              Manage your community requests, track incident reports, and stay
              connected with barangay announcements and updates.
            </p>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer border border-white/50">
                <div className="text-4xl font-black text-blue-600 drop-shadow">
                  {incidentsList.length}
                </div>
                <div className="text-sm font-semibold text-blue-700 mt-1">
                  Incidents Reported
                </div>
                <div className="text-xs text-blue-500/70">
                  Total submissions
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer border border-white/50">
                <div className="text-4xl font-black text-cyan-600 drop-shadow">
                  {documentRequests.length}
                </div>
                <div className="text-sm font-semibold text-cyan-700 mt-1">
                  Document Requests
                </div>
                <div className="text-xs text-cyan-500/70">
                  Pending & completed
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 hidden md:block shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer border border-white/50">
                <div className="text-4xl font-black text-green-600 drop-shadow">
                  {incidentsList.filter((i) => i.status === "resolved").length +
                    documentRequests.filter(
                      (d) => d.status === "ready" || d.status === "claimed"
                    ).length}
                </div>
                <div className="text-sm font-semibold text-green-700 mt-1">
                  Completed
                </div>
                <div className="text-xs text-green-500/70">
                  All finished items
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Access */}
        {user?.role === "admin" && (
          <Card className="mb-8 border-2 border-purple-400 bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl hover:shadow-3xl transition-all hover-lift overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white drop-shadow-lg">
                      Admin Panel Access
                    </CardTitle>
                    <CardDescription className="text-white/90">
                      Manage community, announcements, and verify residents
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/admin")}
                  className="bg-white text-purple-700 hover:bg-purple-50 font-bold text-base px-6 h-11 shadow-lg hover:shadow-xl transition-all btn-scale group"
                >
                  Open Admin Panel
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Enhanced Search Bar */}
        <div
          className="mb-8 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
            <Input
              type="text"
              placeholder="🔍 Search your incidents and documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 shadow-md hover:shadow-lg transition-all rounded-xl"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-blue-600 font-medium">
              Showing results for "<strong>{searchQuery}</strong>"
            </p>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Incidents */}
          {filteredIncidents.length > 0 && (
            <Card
              className="border-2 border-blue-200 shadow-lg animate-fade-in hover:border-blue-400 hover:shadow-xl transition-all"
              style={{ animationDelay: "200ms" }}
            >
              <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-900 font-semibold">
                      Recent Incident Reports
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      {searchQuery
                        ? `${filteredIncidents.length} matching incident(s)`
                        : "Your recently submitted incidents"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {filteredIncidents.slice(0, 5).map((incident, idx) => (
                    <div
                      key={incident._id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-white hover:from-blue-100 hover:to-blue-50 transition-all border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg cursor-pointer group"
                      onClick={() =>
                        navigate(`/report-incident?id=${incident._id}`)
                      }
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-semibold text-blue-900 truncate group-hover:text-blue-700 transition-colors">
                          {incident.title}
                        </p>
                        <p className="text-xs text-blue-500 font-mono font-medium mb-1">
                          REF: {incident._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-blue-600/70 font-medium mb-2">
                          {new Date(incident.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                        {incident.adminNotes && (
                          <div className="mt-2 p-2 bg-amber-50 border-l-3 border-amber-400 rounded">
                            <p className="text-xs font-semibold text-amber-700 mb-1">
                              Admin Note:
                            </p>
                            <p className="text-xs text-amber-800 line-clamp-2">
                              {incident.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                      {getStatusBadge(incident.status)}
                    </div>
                  ))}
                </div>
                {filteredIncidents.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-primary hover:text-blue-700 hover:bg-blue-100 transition-all btn-scale font-medium"
                    onClick={() => navigate("/report-incident")}
                  >
                    View All {filteredIncidents.length} Incidents
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Document Requests */}
          {filteredDocuments.length > 0 && (
            <Card
              className="border-2 border-blue-200 shadow-lg animate-fade-in hover:border-blue-400 hover:shadow-xl transition-all"
              style={{ animationDelay: "250ms" }}
            >
              <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-900 font-semibold">
                      Recent Document Requests
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      {searchQuery
                        ? `${filteredDocuments.length} matching document(s)`
                        : "Your document requests and their status"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {filteredDocuments.slice(0, 5).map((doc, idx) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-white hover:from-blue-100 hover:to-blue-50 transition-all border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg cursor-pointer group"
                      onClick={() =>
                        navigate(`/request-document?id=${doc._id}`)
                      }
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-semibold text-blue-900 truncate group-hover:text-blue-700 transition-colors">
                          {doc.documentType}
                        </p>
                        <p className="text-xs text-blue-500 font-mono font-medium mb-1">
                          REF: {doc._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-blue-600/70 font-medium mb-2">
                          {new Date(doc.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        {doc.adminNotes && (
                          <div className="mt-2 p-2 bg-amber-50 border-l-3 border-amber-400 rounded">
                            <p className="text-xs font-semibold text-amber-700 mb-1">
                              Admin Note:
                            </p>
                            <p className="text-xs text-amber-800 line-clamp-2">
                              {doc.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  ))}
                </div>
                {filteredDocuments.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-primary hover:text-blue-700 hover:bg-blue-100 transition-all btn-scale font-medium"
                    onClick={() => navigate("/request-document")}
                  >
                    View All {filteredDocuments.length} Requests
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty State for Search Results */}
        {searchQuery &&
          filteredIncidents.length === 0 &&
          filteredDocuments.length === 0 && (
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-primary">
                    No results found
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    No incidents or documents match "
                    <span className="font-medium text-primary">
                      {searchQuery}
                    </span>
                    "
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="btn-scale border-blue-300 text-primary hover:bg-blue-100 hover:text-blue-700 hover:border-blue-500 transition-all font-medium"
                  >
                    Clear Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 via-cyan-500 to-blue-400 rounded-full shadow-lg" />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Quick Actions
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quickActions.map((action, index) => {
              let notificationCount = 0;
              if (action.title === "Community Polls") {
                notificationCount = newPollsCount;
              } else if (action.title === "Notifications") {
                notificationCount = unreadNotificationsCount;
              } else if (action.title === "Announcements") {
                notificationCount = newAnnouncementsCount;
              } else if (action.title === "SMS Alerts") {
                notificationCount = newSmsCount;
              } else if (action.title === "My Profile") {
                notificationCount = newVerificationCount;
              }

              console.log(`Badge for ${action.title}:`, notificationCount);
              return (
                <Card
                  key={index}
                  className="card-interactive hover-lift cursor-pointer border-2 border-blue-200 hover:border-blue-500 hover:shadow-2xl group animate-fade-in transition-all overflow-hidden relative bg-white/80 backdrop-blur-sm"
                  onClick={action.action}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-300/5 to-blue-300/5 rounded-full blur-3xl" />
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                          <action.icon className="h-8 w-8 text-white" />
                        </div>
                        {notificationCount > 0 && (
                          <div className="absolute -top-2 -right-2 z-20 bg-red-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all opacity-0 group-hover:opacity-100" />
                    </div>
                    <CardTitle className="text-xl text-blue-900 group-hover:text-blue-700 transition-colors font-bold">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-blue-600 font-medium mt-2">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
