import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  announcements as announcementsAPI,
  notifications,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Megaphone,
  Calendar,
  Pin,
  ArrowLeft,
  Newspaper,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AnnouncementsSkeleton } from "@/components/ui/loading-skeleton";

type Announcement = {
  _id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  priority: string;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
};

const Announcements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [unreadAnnouncementIds, setUnreadAnnouncementIds] = useState<string[]>(
    []
  );
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const user = auth.getStoredUser();
    if (!user || !auth.isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchAnnouncements();

    // Dispatch event when user returns to announcements (for notification count sync)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to this page - emit event for Dashboard to update notification count
        window.dispatchEvent(new Event("announcementsViewed"));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate, categoryFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const category = categoryFilter === "all" ? undefined : categoryFilter;
      const [data, unreadData, unreadCountRes] = await Promise.all([
        announcementsAPI.getAll(1, 50, category, searchQuery),
        notifications.getUnread(),
        notifications.getUnreadCount("announcement"),
      ]);

      setAnnouncements(data.announcements || []);

      const unreadList = unreadData?.notifications || unreadData || [];
      const announcementNotifs = Array.isArray(unreadList)
        ? unreadList.filter(
            (n: any) =>
              n?.type?.toLowerCase?.() === "announcement" ||
              n?.relatedEntityType === "announcement"
          )
        : [];

      const unreadIds = announcementNotifs
        .filter((n: any) => n?.relatedEntityId)
        .map((n: any) => n.relatedEntityId.toString());

      // Prefer API count, fallback to filtered count
      const countFromApi =
        typeof unreadCountRes?.count === "number" ? unreadCountRes.count : 0;
      const finalCount = Math.max(countFromApi, announcementNotifs.length);

      console.log("📢 Announcements page - unread notifications:", {
        countFromApi,
        filteredCount: announcementNotifs.length,
        finalCount,
        withIds: unreadIds.length,
        notifications: announcementNotifs,
      });

      setUnreadAnnouncementIds(unreadIds);
      setUnreadAnnouncementCount(finalCount);

      // REMOVED: Auto-marking as read on page load
      // Now users need to explicitly view announcements to mark as read
      // This allows the dashboard badge to show before they're marked as read

      // Dispatch event to update notification counter globally
      window.dispatchEvent(new Event("announcementsViewed"));
    } catch (error: any) {
      toast.error(error.message || "Error fetching announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAnnouncements();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleMarkAllAnnouncementsRead = async () => {
    try {
      setMarkingAll(true);
      const result = await notifications.markAnnouncementsAsRead();
      console.log("✅ Mark all read result:", result);
      // Update local state without refreshing announcements list
      setUnreadAnnouncementIds([]);
      setUnreadAnnouncementCount(0);
      // Dispatch event to update dashboard badge immediately
      console.log(
        "📢 Dispatching announcementsViewed event to update badge..."
      );
      window.dispatchEvent(new Event("announcementsViewed"));
      toast.success("All announcement notifications marked as read.");
    } catch (error: any) {
      console.error("❌ Mark all read error:", error);
      toast.error(error.message || "Failed to mark announcements as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const viewDetails = async (announcement: Announcement) => {
    try {
      // Set the selected announcement for display
      setSelectedAnnouncement(announcement);
      setShowDetailsDialog(true);
    } catch (error: any) {
      toast.error(error.message || "Error loading announcement details");
    }
    // Mark announcement as read (this will mark related notifications as read)
    try {
      await announcementsAPI.markAsRead(announcement._id);
      setUnreadAnnouncementIds((prev) =>
        prev.filter((id) => id !== announcement._id)
      );
      window.dispatchEvent(new Event("announcementsViewed"));
    } catch (error: any) {
      console.error("Error marking announcement as read:", error);
      // Don't show error toast as this is non-critical
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      event: "bg-purple-100 text-purple-800 border-purple-300",
      announcement: "bg-blue-100 text-blue-800 border-blue-300",
      general: "bg-gray-100 text-gray-800 border-gray-300",
      alert: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <Badge variant="outline" className={colors[category] || ""}>
        {category}
      </Badge>
    );
  };

  const isAnnouncementUnread = (id: string) =>
    unreadAnnouncementIds.includes(id);

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);
  const regularAnnouncements = announcements.filter((a) => !a.isPinned);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Community Announcements</h1>
            <p className="text-muted-foreground">
              Stay informed with the latest news and updates from your barangay
            </p>
          </div>
          <AnnouncementsSkeleton />
        </div>
      </div>
    );
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
                  Announcements
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Check latest barangay updates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                disabled={markingAll}
                onClick={handleMarkAllAnnouncementsRead}
                className="bg-white/15 text-white border border-white/40 hover:bg-white/25 font-semibold h-10 px-4 rounded-lg transition-all duration-300 hover:shadow-lg flex-shrink-0 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark all read{" "}
                {unreadAnnouncementCount > 0 && `(${unreadAnnouncementCount})`}
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

      <div className="container mx-auto px-6 max-w-6xl space-y-6 pb-10">
        {/* Search and Filter Bar */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <Input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-11 border-blue-300 focus:border-blue-400 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-full md:w-[200px] border-blue-300 focus:border-blue-400 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {announcements.length === 0 ? (
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardContent className="py-20 text-center">
              <div className="mx-auto h-20 w-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-6">
                <Megaphone className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-2">
                No Announcements Found
              </h3>
              <p className="text-blue-700 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms or filters."
                  : "Check back later for community updates and announcements."}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    fetchAnnouncements();
                  }}
                  className="mt-6 border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-900 hover:border-blue-500 font-medium"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Pin className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900">
                    Pinned Announcements
                  </h2>
                  <Badge className="bg-blue-500 text-white shadow-md">
                    {pinnedAnnouncements.length}
                  </Badge>
                </div>
                {pinnedAnnouncements.map((announcement) => (
                  <Card
                    key={announcement._id}
                    className={`relative border-2 border-blue-300 bg-gradient-to-br from-blue-50/80 to-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                      isAnnouncementUnread(announcement._id)
                        ? "border-blue-500 shadow-blue-200"
                        : ""
                    }`}
                  >
                    {isAnnouncementUnread(announcement._id) && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        Unread
                      </div>
                    )}
                    <CardHeader className="bg-gradient-to-br from-blue-50/50 to-white">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg border border-blue-200">
                              <Pin className="w-4 h-4 text-blue-700" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-blue-900">
                              {announcement.title}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {getCategoryBadge(announcement.category)}
                            {announcement.priority === "high" && (
                              <Badge className="bg-red-500 text-white shadow-sm">
                                High Priority
                              </Badge>
                            )}
                            <span className="text-sm text-blue-700 flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(
                                announcement.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <Megaphone className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-base leading-relaxed whitespace-pre-wrap text-blue-800">
                        {announcement.content.length > 300
                          ? announcement.content.substring(0, 300) + "..."
                          : announcement.content}
                      </p>
                      {announcement.content.length > 300 && (
                        <Button
                          variant="link"
                          className="px-0 text-blue-600 hover:text-blue-700 font-semibold"
                          onClick={() => viewDetails(announcement)}
                        >
                          Read Full Announcement →
                        </Button>
                      )}
                      {announcement.createdBy && (
                        <>
                          <Separator className="my-4 bg-blue-200" />
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-600">Posted by:</span>
                            <span className="font-semibold text-blue-900">
                              {announcement.createdBy.firstName}{" "}
                              {announcement.createdBy.lastName}
                            </span>
                            <Badge className="ml-1 bg-blue-100 text-blue-700 border-blue-200">
                              {announcement.createdBy.role}
                            </Badge>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Regular Announcements */}
            {regularAnnouncements.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Newspaper className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900">
                    Recent Announcements
                  </h2>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {regularAnnouncements.length}
                  </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {regularAnnouncements.map((announcement, idx) => (
                    <Card
                      key={announcement._id}
                      className={`card-interactive hover-lift cursor-pointer border-2 border-blue-200 hover:border-blue-500 hover:shadow-2xl group animate-fade-in transition-all overflow-hidden relative bg-white/80 backdrop-blur-sm ${
                        isAnnouncementUnread(announcement._id)
                          ? "border-blue-500 shadow-blue-200"
                          : ""
                      }`}
                      onClick={() => viewDetails(announcement)}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {isAnnouncementUnread(announcement._id) && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                          Unread
                        </div>
                      )}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-300/5 to-blue-300/5 rounded-full blur-3xl" />
                      <CardHeader className="relative pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                            <Newspaper className="w-7 h-7 text-white" />
                          </div>
                          {announcement.priority === "high" && (
                            <Badge className="bg-red-500/90 hover:bg-red-600 shadow-sm text-white">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-blue-900 group-hover:text-blue-700 transition-colors font-bold leading-tight">
                          {announcement.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          {getCategoryBadge(announcement.category)}
                          <span className="text-xs text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded-md">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        <p className="text-sm leading-relaxed text-blue-800 line-clamp-3">
                          {announcement.content}
                        </p>
                        <div className="flex items-center justify-end pt-3 border-t border-blue-100">
                          <span className="text-xs text-blue-600 font-medium">
                            Read More →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            {selectedAnnouncement && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    {selectedAnnouncement.isPinned && (
                      <Pin className="w-5 h-5 text-primary" />
                    )}
                    {selectedAnnouncement.title}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-3 flex-wrap mt-3">
                    {getCategoryBadge(selectedAnnouncement.category)}
                    <span className="text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(
                        selectedAnnouncement.createdAt
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {selectedAnnouncement.content}
                  </p>
                  {selectedAnnouncement.createdBy && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Posted by:</span>
                        <span className="font-medium">
                          {selectedAnnouncement.createdBy.firstName}{" "}
                          {selectedAnnouncement.createdBy.lastName}
                        </span>
                        <Badge variant="secondary">
                          {selectedAnnouncement.createdBy.role}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Announcements;
