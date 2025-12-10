import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { admin, sms, polls, auth, announcements } from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useToast } from "../hooks/use-toast";
import {
  Users,
  FileText,
  AlertTriangle,
  MessageSquare,
  Vote,
  Activity,
  Plus,
  Send,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  LogOut,
  Home,
  Megaphone,
  Pin,
  Shield,
  Clock,
  CheckCheck,
} from "lucide-react";
import { Switch } from "../components/ui/switch";
import { AdminAnalytics } from "../components/AdminAnalytics";

export default function AdminEnhanced() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  // Incidents state
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentsPage, setIncidentsPage] = useState(1);
  const [incidentSearch, setIncidentSearch] = useState("");
  const [incidentFilter, setIncidentFilter] = useState<string>("all");
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [incidentNotes, setIncidentNotes] = useState("");
  const [editingIncidentNotes, setEditingIncidentNotes] = useState(false);
  const [savingIncidentNotes, setSavingIncidentNotes] = useState(false);

  // Documents state
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentSearch, setDocumentSearch] = useState("");
  const [documentFilter, setDocumentFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documentNotes, setDocumentNotes] = useState("");
  const [editingDocumentNotes, setEditingDocumentNotes] = useState(false);
  const [savingDocumentNotes, setSavingDocumentNotes] = useState(false);

  // SMS state
  const [smsAlerts, setSmsAlerts] = useState<any[]>([]);
  const [smsPage, setSmsPage] = useState(1);
  const [smsSearch, setSmsSearch] = useState("");
  const [smsFilter, setSmsFilter] = useState<string>("all");
  const [smsRecipientSearch, setSmsRecipientSearch] = useState("");
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [showSmsEditDialog, setShowSmsEditDialog] = useState(false);
  const [selectedSmsAlert, setSelectedSmsAlert] = useState<any>(null);
  const [smsForm, setSmsForm] = useState({
    title: "",
    message: "",
    type: "announcement",
    priority: "medium",
    recipients: "all",
    specificRecipients: [] as string[],
  });

  // Polls state
  const [pollsData, setPollsData] = useState<any[]>([]);
  const [pollsPage, setPollsPage] = useState(1);
  const [pollSearch, setPollSearch] = useState("");
  const [pollFilter, setPollFilter] = useState<string>("all");
  const [showPollDialog, setShowPollDialog] = useState(false);
  const getDefaultPollEndDate = () =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [pollForm, setPollForm] = useState({
    title: "",
    description: "",
    isAnonymous: false,
    endDate: getDefaultPollEndDate(),
    questions: [{ question: "", type: "single", options: ["", ""] }],
  });
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [editingPollEndDate, setEditingPollEndDate] = useState(false);
  const [pollEndDateText, setPollEndDateText] = useState("");
  const [savingPollEndDate, setSavingPollEndDate] = useState(false);
  const [showPollEndDateDialog, setShowPollEndDateDialog] = useState(false);

  // Announcements state
  const [announcementsData, setAnnouncementsData] = useState<any[]>([]);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementPriorityFilter, setAnnouncementPriorityFilter] =
    useState<string>("all");
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    category: "general",
    isPinned: false,
    priority: "medium",
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

  // Verification state
  const [verificationData, setVerificationData] = useState<any[]>([]);
  const [verificationPage, setVerificationPage] = useState(1);
  const [verificationFilter, setVerificationFilter] =
    useState<string>("pending");
  const [verificationSearch, setVerificationSearch] = useState<string>("");
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    verificationStatus: "pending",
    verificationNotes: "",
  });

  useEffect(() => {
    fetchStats();
    // Load data for analytics tab immediately
    fetchIncidents();
    fetchDocuments();
    fetchPolls();
  }, []);

  // Refetch verification data when filter or search changes
  useEffect(() => {
    fetchVerificationData();
  }, [verificationFilter, verificationSearch]);

  // Refetch incidents when search changes
  useEffect(() => {
    fetchIncidents();
  }, [incidentSearch]);

  // Refetch documents when search changes
  useEffect(() => {
    fetchDocuments();
  }, [documentSearch]);

  // Refetch SMS alerts when search changes
  useEffect(() => {
    fetchSmsAlerts();
  }, [smsSearch]);

  // Refetch polls when search changes
  useEffect(() => {
    fetchPolls();
  }, [pollSearch]);

  // Refetch announcements when search changes
  useEffect(() => {
    fetchAnnouncements();
  }, [announcementSearch]);

  // Refetch users when search changes
  useEffect(() => {
    fetchUsers();
  }, [userSearch]);

  const fetchStats = async () => {
    try {
      const data = await admin.getStats();
      setStats(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await admin.getUsers(usersPage, 10, userSearch);
      setUsers(data.users);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchIncidents = async () => {
    try {
      const data = await admin.getIncidents(incidentsPage, 10);
      let filtered = data.incidents;

      if (incidentSearch.trim()) {
        const searchTerm = incidentSearch.toLowerCase();
        filtered = filtered.filter(
          (incident: any) =>
            incident.title?.toLowerCase().includes(searchTerm) ||
            incident.type?.toLowerCase().includes(searchTerm) ||
            incident.userId?.firstName?.toLowerCase().includes(searchTerm) ||
            incident.userId?.lastName?.toLowerCase().includes(searchTerm)
        );
      }

      setIncidents(filtered);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await admin.getDocuments(documentsPage, 10);
      let filtered = data.documents;

      if (documentSearch.trim()) {
        const searchTerm = documentSearch.toLowerCase();
        filtered = filtered.filter(
          (doc: any) =>
            doc.documentType?.toLowerCase().includes(searchTerm) ||
            doc.purpose?.toLowerCase().includes(searchTerm) ||
            doc.userId?.firstName?.toLowerCase().includes(searchTerm) ||
            doc.userId?.lastName?.toLowerCase().includes(searchTerm)
        );
      }

      setDocumentsData(filtered);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchSmsAlerts = async () => {
    try {
      const data = await sms.getAll(smsPage, 10);
      let filtered = data.alerts;

      if (smsSearch.trim()) {
        const searchTerm = smsSearch.toLowerCase();
        filtered = filtered.filter(
          (alert: any) =>
            alert.title?.toLowerCase().includes(searchTerm) ||
            alert.type?.toLowerCase().includes(searchTerm) ||
            alert.message?.toLowerCase().includes(searchTerm)
        );
      }

      setSmsAlerts(filtered);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPolls = async () => {
    try {
      // Admin should see all polls (active, closed, etc.) but not deleted by default
      const data = await polls.getAll(pollsPage, 50, undefined, false);
      let filtered = data.polls;

      if (pollSearch.trim()) {
        const searchTerm = pollSearch.toLowerCase();
        filtered = filtered.filter(
          (poll: any) =>
            poll.title?.toLowerCase().includes(searchTerm) ||
            poll.description?.toLowerCase().includes(searchTerm)
        );
      }

      setPollsData(filtered);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await announcements.getAllAdmin(announcementsPage, 50);
      let filtered = data.announcements;

      if (announcementSearch.trim()) {
        const searchTerm = announcementSearch.toLowerCase();
        filtered = filtered.filter(
          (announcement: any) =>
            announcement.title?.toLowerCase().includes(searchTerm) ||
            announcement.category?.toLowerCase().includes(searchTerm) ||
            announcement.content?.toLowerCase().includes(searchTerm)
        );
      }

      setAnnouncementsData(filtered);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchVerificationData = async () => {
    try {
      const data = await admin.getUsers(verificationPage, 100);
      // Filter users by verification status and search term
      let filteredUsers = data.users;

      // Apply status filter
      if (verificationFilter === "pending") {
        filteredUsers = filteredUsers.filter(
          (user: any) => user.verificationStatus === "pending"
        );
      } else if (verificationFilter === "rejected") {
        filteredUsers = filteredUsers.filter(
          (user: any) => user.verificationStatus === "rejected"
        );
      } else if (verificationFilter === "verified") {
        filteredUsers = filteredUsers.filter((user: any) => user.isVerified);
      }

      // Apply search filter
      if (verificationSearch.trim()) {
        const searchTerm = verificationSearch.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user: any) =>
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.phone?.toLowerCase().includes(searchTerm)
        );
      }

      setVerificationData(filteredUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateUserVerification = async (
    userId: string,
    isVerified: boolean
  ) => {
    try {
      await admin.updateUser(userId, { isVerified });
      toast({
        title: "Success",
        description: isVerified
          ? "User verified successfully"
          : "Verification removed successfully",
      });
      fetchVerificationData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openVerificationEditor = (user: any) => {
    setSelectedVerification(user);
    setVerificationForm({
      verificationStatus:
        user.verificationStatus || (user.isVerified ? "approved" : "pending"),
      verificationNotes: user.verificationNotes || "",
    });
    setShowVerificationDialog(true);
  };

  const submitVerificationUpdate = async () => {
    if (!selectedVerification) return;

    try {
      const isVerified = verificationForm.verificationStatus === "approved";
      const updateData: any = {
        isVerified,
        verificationStatus: verificationForm.verificationStatus,
        verificationNotes: verificationForm.verificationNotes,
      };

      // Set verification date when status is approved or rejected (only if not pending)
      if (verificationForm.verificationStatus !== "pending") {
        updateData.verificationDate = new Date().toISOString();
      }

      const response = await admin.updateUser(
        selectedVerification._id,
        updateData
      );

      const statusMessages: { [key: string]: string } = {
        approved: "User verification approved successfully",
        rejected: "User verification rejected successfully",
        pending: "User verification marked as pending",
      };

      toast({
        title: "Success",
        description:
          statusMessages[verificationForm.verificationStatus] ||
          "Verification updated successfully",
      });

      // Update the local state immediately with the server response
      setVerificationData((prevData) =>
        prevData.map((user) =>
          user._id === selectedVerification._id ? response : user
        )
      );

      setShowVerificationDialog(false);
      // Refresh stats to reflect the verification count change
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendSmsAlert = async () => {
    if (!smsForm.title || !smsForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await sms.send(smsForm);
      toast({
        title: "Success",
        description: "SMS alert sent successfully",
      });
      // Dispatch event to trigger notification badge update
      window.dispatchEvent(new Event("smsAlertCreated"));
      setShowSmsDialog(false);
      setSmsForm({
        title: "",
        message: "",
        type: "announcement",
        priority: "medium",
        recipients: "all",
        specificRecipients: [],
      });
      fetchSmsAlerts();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createPoll = async () => {
    const validQuestions = pollForm.questions.filter(
      (q) => q.question.trim() && q.options.filter((o) => o.trim()).length >= 2
    );

    if (!pollForm.title || validQuestions.length === 0) {
      toast({
        title: "Error",
        description:
          "Please provide a title and at least one question with two options",
        variant: "destructive",
      });
      return;
    }

    // Validate poll end date
    if (!pollForm.endDate || isNaN(Date.parse(pollForm.endDate))) {
      toast({
        title: "Error",
        description: "Please select a valid poll end date",
        variant: "destructive",
      });
      return;
    }

    const endDateValue = new Date(pollForm.endDate);
    if (endDateValue <= new Date()) {
      toast({
        title: "Error",
        description: "End date must be in the future",
        variant: "destructive",
      });
      return;
    }

    // Prevent double submission
    if (loading) return;
    setLoading(true);

    try {
      await polls.create({
        ...pollForm,
        questions: validQuestions.map((q) => ({
          ...q,
          options: q.options.filter((o) => o.trim()),
        })),
        endDate: endDateValue.toISOString(),
      });
      toast({
        title: "Success",
        description: "Poll created successfully",
      });
      // Dispatch event to trigger notification badge update
      window.dispatchEvent(new Event("pollCreated"));
      setShowPollDialog(false);
      setPollForm({
        title: "",
        description: "",
        isAnonymous: false,
        endDate: getDefaultPollEndDate(),
        questions: [{ question: "", type: "single", options: ["", ""] }],
      });
      fetchPolls();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewPollResults = async (poll: any) => {
    try {
      const results = await polls.getResults(poll._id);
      setSelectedPoll(results.poll || results); // Handle both response formats
      setShowResultsDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Announcement CRUD functions
  const createAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await announcements.create(announcementForm);
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      // Dispatch event to trigger notification badge update
      window.dispatchEvent(new Event("announcementCreated"));
      setShowAnnouncementDialog(false);
      setAnnouncementForm({
        title: "",
        content: "",
        category: "general",
        isPinned: false,
        priority: "medium",
      });
      fetchAnnouncements();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAnnouncement = async () => {
    if (
      !editingAnnouncement ||
      !announcementForm.title ||
      !announcementForm.content
    ) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await announcements.update(editingAnnouncement._id, announcementForm);
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
      setShowAnnouncementDialog(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: "",
        content: "",
        category: "general",
        isPinned: false,
        priority: "normal",
      });
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAnnouncementStatus = async (id: string, isActive: boolean) => {
    try {
      await announcements.update(id, { isActive: !isActive });
      toast({
        title: "Success",
        description: `Announcement ${
          !isActive ? "activated" : "deactivated"
        } successfully`,
      });
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await announcements.delete(id);
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
      fetchAnnouncements();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const editAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      isPinned: announcement.isPinned,
      priority: announcement.priority,
    });
    setShowAnnouncementDialog(true);
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    try {
      await admin.updateIncident(id, { status });
      toast({
        title: "Success",
        description: "Incident status updated",
      });
      fetchIncidents();
      fetchStats();
      setShowIncidentDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveIncidentNotes = async () => {
    if (!selectedIncident) return;
    setSavingIncidentNotes(true);
    try {
      console.log("Saving incident notes:", {
        id: selectedIncident._id,
        adminNotes: incidentNotes,
      });
      const updated = await admin.updateIncident(selectedIncident._id, {
        adminNotes: incidentNotes,
      });
      console.log("Updated incident:", updated);
      setSelectedIncident(updated);
      setIncidents((prev) =>
        prev.map((i) => (i._id === selectedIncident._id ? updated : i))
      );
      setEditingIncidentNotes(false);
      // Refetch to ensure the latest data is in state
      await fetchIncidents();
      console.log("Refetched incidents");
      toast({
        title: "Success",
        description: "Incident notes saved",
      });
    } catch (error: any) {
      console.error("Error saving incident notes:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingIncidentNotes(false);
    }
  };

  const updateDocumentStatus = async (id: string, status: string) => {
    try {
      const updated = await admin.updateDocument(id, { status });
      setSelectedDocument(updated);
      setDocumentsData((prev) => prev.map((d) => (d._id === id ? updated : d)));
      toast({
        title: "Success",
        description: "Document status updated",
      });
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveDocumentNotes = async () => {
    if (!selectedDocument) return;
    setSavingDocumentNotes(true);
    try {
      console.log("Saving document notes:", {
        id: selectedDocument._id,
        adminNotes: documentNotes,
      });
      const updated = await admin.updateDocument(selectedDocument._id, {
        adminNotes: documentNotes,
      });
      console.log("Updated document:", updated);
      setSelectedDocument(updated);
      setDocumentsData((prev) =>
        prev.map((d) => (d._id === selectedDocument._id ? updated : d))
      );
      setEditingDocumentNotes(false);
      // Refetch to ensure the latest data is in state
      await fetchDocuments();
      console.log("Refetched documents");
      toast({
        title: "Success",
        description: "Document notes saved",
      });
    } catch (error: any) {
      console.error("Error saving document notes:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingDocumentNotes(false);
    }
  };

  const updateUserStatus = async (id: string, isActive: boolean) => {
    try {
      await admin.updateUser(id, { isActive });
      toast({
        title: "Success",
        description: `User ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteIncident = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this incident?")) {
      return;
    }
    try {
      await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/admin/incidents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast({
        title: "Success",
        description: "Incident deleted successfully",
      });
      fetchIncidents();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this document request?")
    ) {
      return;
    }
    try {
      await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/admin/documents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      fetchDocuments();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePollStatus = async (id: string, status: string) => {
    try {
      await polls.updateStatus(id, status);
      toast({
        title: "Success",
        description: "Poll status updated",
      });
      fetchPolls();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSmsAlert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SMS alert?")) return;
    try {
      await sms.delete(id);
      toast({
        title: "Success",
        description: "SMS alert deleted",
      });
      fetchSmsAlerts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePoll = async (id: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    try {
      await polls.delete(id);
      toast({
        title: "Success",
        description: "Poll deleted",
      });
      fetchPolls();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const savePollEndDate = async () => {
    if (!selectedPoll) return;

    // Validate end date
    if (!pollEndDateText || isNaN(Date.parse(pollEndDateText))) {
      toast({
        title: "Error",
        description: "Please select a valid end date",
        variant: "destructive",
      });
      return;
    }

    const newEndDate = new Date(pollEndDateText);
    if (newEndDate <= new Date()) {
      toast({
        title: "Error",
        description: "End date must be in the future",
        variant: "destructive",
      });
      return;
    }

    setSavingPollEndDate(true);
    try {
      const updated = await polls.update(selectedPoll._id, {
        endDate: newEndDate.toISOString(),
      });
      setSelectedPoll(updated);
      setPollsData((prev) =>
        prev.map((p) => (p._id === selectedPoll._id ? updated : p))
      );
      setEditingPollEndDate(false);
      setShowPollEndDateDialog(false);
      toast({
        title: "Success",
        description: "Poll end date updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingPollEndDate(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-500 hover:bg-yellow-600",
      "in-progress": "bg-blue-500 hover:bg-blue-600",
      resolved: "bg-green-500 hover:bg-green-600",
      approved: "bg-green-500 hover:bg-green-600",
      rejected: "bg-red-500 hover:bg-red-600",
      active: "bg-green-500 hover:bg-green-600",
      closed: "bg-gray-500 hover:bg-gray-600",
      draft: "bg-gray-400 hover:bg-gray-500",
      archived: "bg-gray-600 hover:bg-gray-700",
      sent: "bg-blue-500 hover:bg-blue-600",
    };

    return (
      <Badge className={`${variants[status] || "bg-gray-500"} text-white`}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return (
      <Badge className={`${colors[priority] || "bg-gray-500"} text-white`}>
        {priority}
      </Badge>
    );
  };

  const addPollQuestion = () => {
    setPollForm({
      ...pollForm,
      questions: [
        ...pollForm.questions,
        { question: "", type: "single", options: ["", ""] },
      ],
    });
  };

  const updatePollQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...pollForm.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setPollForm({ ...pollForm, questions: newQuestions });
  };

  const addPollOption = (questionIndex: number) => {
    const newQuestions = [...pollForm.questions];
    newQuestions[questionIndex].options.push("");
    setPollForm({ ...pollForm, questions: newQuestions });
  };

  const updatePollOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newQuestions = [...pollForm.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setPollForm({ ...pollForm, questions: newQuestions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100/30 to-pink-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="relative overflow-hidden mb-6">
          {/* Enhanced gradient background with multiple layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent rounded-3xl"></div>
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 bottom-0 w-60 h-60 bg-pink-400/10 rounded-full blur-3xl"></div>

          <div className="relative flex items-center justify-between text-white p-10 rounded-3xl shadow-2xl border border-purple-400/30 backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur border border-white/30 shadow-lg">
                  <Megaphone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-black text-white drop-shadow-lg">
                    eBarangay Admin Panel
                  </h1>
                  <p className="text-white/75 drop-shadow text-base font-medium mt-1">
                    Comprehensive management system for barangay operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-white hover:bg-white/95 text-purple-700 font-bold px-7 py-3 rounded-2xl transition-all duration-300 hover:shadow-2xl border-0 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl"
              >
                <Home className="w-6 h-6" />
                <span>Dashboard</span>
              </Button>
              <Button
                onClick={() => {
                  auth.logout();
                  navigate("/login");
                  toast({
                    title: "Logged Out",
                    description: "You have been successfully logged out",
                  });
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-7 py-3 rounded-2xl transition-all duration-300 hover:shadow-2xl border-0 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl"
              >
                <LogOut className="w-6 h-6" />
                <span>Logout</span>
              </Button>
              <Badge className="text-base px-6 py-3.5 bg-white/20 border border-white/50 text-white backdrop-blur font-bold rounded-2xl hover:bg-white/30 transition-all duration-300 cursor-default shadow-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5" />
                  <div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300"></div>
                  <span>System Active</span>
                </div>
              </Badge>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {/* Total Users Card */}
          <Card className="hover:shadow-2xl transition-all border-0 bg-gradient-to-br from-purple-50 to-purple-100 hover:scale-105 duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-900">
                Total Users
              </CardTitle>
              <div className="bg-purple-200 p-2 rounded-lg">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700 mb-2">
                {stats?.totalUsers || 0}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-xs text-purple-600">
                  <span className="font-bold">{stats?.activeUsers || 0}</span>{" "}
                  active
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Verified Users Card */}
          <Card className="hover:shadow-2xl transition-all border-0 bg-gradient-to-br from-green-50 to-green-100 hover:scale-105 duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-900">
                Verified Users
              </CardTitle>
              <div className="bg-green-200 p-2 rounded-lg">
                <CheckCheck className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 mb-2">
                {stats?.verifiedUsers || 0}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <p className="text-xs text-green-600">
                  <span className="font-bold">
                    {stats?.totalUsers
                      ? Math.round(
                          ((stats?.verifiedUsers || 0) / stats?.totalUsers) *
                            100
                        )
                      : 0}
                    %
                  </span>{" "}
                  verification rate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Incidents Card */}
          <Card className="hover:shadow-2xl transition-all border-0 bg-gradient-to-br from-orange-50 to-orange-100 hover:scale-105 duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-orange-900">
                Incidents
              </CardTitle>
              <div className="bg-orange-200 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700 mb-2">
                {stats?.totalIncidents || 0}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <p className="text-xs text-orange-600">
                  <span className="font-bold">
                    {stats?.pendingIncidents || 0}
                  </span>{" "}
                  pending
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="hover:shadow-2xl transition-all border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:scale-105 duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-900">
                Documents
              </CardTitle>
              <div className="bg-blue-200 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {stats?.totalDocuments || 0}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <p className="text-xs text-blue-600">
                  <span className="font-bold">
                    {stats?.pendingDocuments || 0}
                  </span>{" "}
                  pending
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SMS Alerts Card */}
          <Card className="hover:shadow-2xl transition-all border-0 bg-gradient-to-br from-pink-50 to-pink-100 hover:scale-105 duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-pink-900">
                SMS Alerts
              </CardTitle>
              <div className="bg-pink-200 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-pink-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-700 mb-2">
                {stats?.totalSmsAlerts || 0}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <p className="text-xs text-pink-600">messages sent</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Polls Card */}
          <Card className="hover:shadow-2xl transition-all border-0 bg-gradient-to-br from-violet-50 to-violet-100 hover:scale-105 duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-violet-900">
                Active Polls
              </CardTitle>
              <div className="bg-violet-200 p-2 rounded-lg">
                <Vote className="h-5 w-5 text-violet-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-700 mb-2">
                {stats?.activePolls || 0}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                <p className="text-xs text-violet-600">
                  of <span className="font-bold">{stats?.totalPolls || 0}</span>{" "}
                  total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Interface */}
        <Tabs
          defaultValue="analytics"
          className="space-y-4"
          onValueChange={(value) => {
            if (value === "analytics") {
              fetchStats();
              fetchIncidents();
              fetchDocuments();
              fetchPolls();
            } else if (value === "users") fetchUsers();
            else if (value === "incidents") fetchIncidents();
            else if (value === "documents") fetchDocuments();
            else if (value === "sms") fetchSmsAlerts();
            else if (value === "polls") fetchPolls();
            else if (value === "announcements") fetchAnnouncements();
            else if (value === "verification") fetchVerificationData();
          }}
        >
          <TabsList className="grid w-full grid-cols-8 bg-purple-100 border-purple-200">
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="incidents"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Incidents
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="sms"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS Alerts
            </TabsTrigger>
            <TabsTrigger
              value="polls"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Vote className="w-4 h-4 mr-2" />
              Polls
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Verification
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AdminAnalytics
              incidents={incidents}
              documents={documentsData}
              polls={pollsData}
              stats={stats}
            />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage registered users and their accounts
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setUserStatusFilter("all")}
                      variant={
                        userStatusFilter === "all" ? "default" : "outline"
                      }
                      className={
                        userStatusFilter === "all"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setUserStatusFilter("active")}
                      variant={
                        userStatusFilter === "active" ? "default" : "outline"
                      }
                      className={
                        userStatusFilter === "active"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Active
                    </Button>
                    <Button
                      onClick={() => setUserStatusFilter("inactive")}
                      variant={
                        userStatusFilter === "inactive" ? "default" : "outline"
                      }
                      className={
                        userStatusFilter === "inactive"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Inactive
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="max-w-sm border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  />
                  <Button
                    onClick={fetchUsers}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <CardContent>
                <Table>
                  <TableHeader className="bg-purple-50">
                    <TableRow className="border-purple-100">
                      <TableHead className="text-purple-900 font-bold">
                        Name
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Email
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Phone
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Status
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Registered
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter((user) => {
                        if (userStatusFilter !== "all") {
                          const isActive = user.isActive;
                          if (userStatusFilter === "active" && !isActive) {
                            return false;
                          }
                          if (userStatusFilter === "inactive" && isActive) {
                            return false;
                          }
                        }
                        return true;
                      })
                      .map((user) => (
                        <TableRow
                          key={user._id}
                          className="border-purple-100 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium text-purple-900">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phoneNumber || "N/A"}</TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge className="bg-red-500">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                                user.isActive
                                  ? "bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700"
                                  : "bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700"
                              }`}
                              onClick={() =>
                                updateUserStatus(user._id, !user.isActive)
                              }
                              title={
                                user.isActive
                                  ? "Deactivate User"
                                  : "Activate User"
                              }
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Incident Reports</CardTitle>
                    <CardDescription>
                      Manage and respond to incident reports
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIncidentFilter("all")}
                      variant={incidentFilter === "all" ? "default" : "outline"}
                      className={
                        incidentFilter === "all"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setIncidentFilter("pending")}
                      variant={
                        incidentFilter === "pending" ? "default" : "outline"
                      }
                      className={
                        incidentFilter === "pending"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                    </Button>
                    <Button
                      onClick={() => setIncidentFilter("in-progress")}
                      variant={
                        incidentFilter === "in-progress" ? "default" : "outline"
                      }
                      className={
                        incidentFilter === "in-progress"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      In Progress
                    </Button>
                    <Button
                      onClick={() => setIncidentFilter("resolved")}
                      variant={
                        incidentFilter === "resolved" ? "default" : "outline"
                      }
                      className={
                        incidentFilter === "resolved"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Resolved
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search incidents by title, type, or reporter..."
                    value={incidentSearch}
                    onChange={(e) => setIncidentSearch(e.target.value)}
                    className="max-w-sm border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  />
                  <Button
                    onClick={fetchIncidents}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <CardContent>
                <Table>
                  <TableHeader className="bg-purple-50">
                    <TableRow className="border-purple-100">
                      <TableHead className="text-purple-900 font-bold">
                        Title
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Type
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Reporter
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Status
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Date
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents
                      .filter((incident) => {
                        if (
                          incidentFilter !== "all" &&
                          incident.status !== incidentFilter
                        ) {
                          return false;
                        }
                        if (
                          incidentSearch &&
                          !incident.title
                            .toLowerCase()
                            .includes(incidentSearch.toLowerCase()) &&
                          !incident.type
                            .toLowerCase()
                            .includes(incidentSearch.toLowerCase())
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((incident) => (
                        <TableRow
                          key={incident._id}
                          className="border-purple-100 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium text-purple-900">
                            {incident.title}
                          </TableCell>
                          <TableCell>{incident.type}</TableCell>
                          <TableCell>
                            {incident.userId?.firstName}{" "}
                            {incident.userId?.lastName}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(incident.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(incident.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 font-semibold rounded-lg p-2"
                                onClick={() => {
                                  setSelectedIncident(incident);
                                  setIncidentNotes(incident.adminNotes || "");
                                  setEditingIncidentNotes(false);
                                  setShowIncidentDialog(true);
                                }}
                                title="Manage Incident"
                              >
                                <Edit className="w-5 h-5" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 font-semibold rounded-lg p-2"
                                onClick={() => deleteIncident(incident._id)}
                                title="Delete Incident"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Requests</CardTitle>
                    <CardDescription>
                      Process document requests from residents
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setDocumentFilter("all")}
                      variant={documentFilter === "all" ? "default" : "outline"}
                      className={
                        documentFilter === "all"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setDocumentFilter("pending")}
                      variant={
                        documentFilter === "pending" ? "default" : "outline"
                      }
                      className={
                        documentFilter === "pending"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                    </Button>
                    <Button
                      onClick={() => setDocumentFilter("rejected")}
                      variant={
                        documentFilter === "rejected" ? "default" : "outline"
                      }
                      className={
                        documentFilter === "rejected"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Rejected
                    </Button>
                    <Button
                      onClick={() => setDocumentFilter("approved")}
                      variant={
                        documentFilter === "approved" ? "default" : "outline"
                      }
                      className={
                        documentFilter === "approved"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Approved
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search documents by type, requester, or purpose..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="max-w-sm border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  />
                  <Button
                    onClick={fetchDocuments}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <div className="w-full border-t border-purple-100">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-purple-50">
                      <TableRow className="border-purple-100">
                        <TableHead className="text-purple-900 font-bold whitespace-nowrap px-6 py-3 text-left">
                          Document Type
                        </TableHead>
                        <TableHead className="text-purple-900 font-bold whitespace-nowrap px-6 py-3 text-left">
                          Requester
                        </TableHead>
                        <TableHead className="text-purple-900 font-bold whitespace-nowrap px-6 py-3 text-left">
                          Purpose
                        </TableHead>
                        <TableHead className="text-purple-900 font-bold whitespace-nowrap px-6 py-3 text-left">
                          Status
                        </TableHead>
                        <TableHead className="text-purple-900 font-bold whitespace-nowrap px-6 py-3 text-left">
                          Date
                        </TableHead>
                        <TableHead className="text-purple-900 font-bold whitespace-nowrap px-6 py-3 text-left">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentsData
                        .filter((doc) => {
                          if (
                            documentFilter !== "all" &&
                            doc.status !== documentFilter
                          ) {
                            return false;
                          }
                          if (
                            documentSearch &&
                            !doc.documentType
                              .toLowerCase()
                              .includes(documentSearch.toLowerCase()) &&
                            !doc.purpose
                              .toLowerCase()
                              .includes(documentSearch.toLowerCase())
                          ) {
                            return false;
                          }
                          return true;
                        })
                        .map((doc) => (
                          <TableRow
                            key={doc._id}
                            className="border-purple-100 hover:bg-purple-50"
                          >
                            <TableCell className="font-medium text-purple-900 whitespace-nowrap px-6 py-4 text-left">
                              {doc.documentType}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-6 py-4 text-left">
                              {doc.userId?.firstName} {doc.userId?.lastName}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-left">
                              {doc.purpose}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-6 py-4 text-left">
                              {getStatusBadge(doc.status)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-6 py-4 text-left">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-6 py-4 text-left">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 font-semibold rounded-lg p-2"
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setDocumentNotes(doc.adminNotes || "");
                                    setEditingDocumentNotes(false);
                                    setShowDocumentDialog(true);
                                  }}
                                  title="Process Document"
                                >
                                  <Edit className="w-5 h-5" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 font-semibold rounded-lg p-2"
                                  onClick={() => deleteDocument(doc._id)}
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* SMS Alerts Tab */}
          <TabsContent value="sms" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SMS Alert Management</CardTitle>
                    <CardDescription>
                      Send emergency alerts and announcements to residents
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSmsFilter("all")}
                      variant={smsFilter === "all" ? "default" : "outline"}
                      className={
                        smsFilter === "all"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setSmsFilter("low")}
                      variant={smsFilter === "low" ? "default" : "outline"}
                      className={
                        smsFilter === "low"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Low
                    </Button>
                    <Button
                      onClick={() => setSmsFilter("medium")}
                      variant={smsFilter === "medium" ? "default" : "outline"}
                      className={
                        smsFilter === "medium"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Medium
                    </Button>
                    <Button
                      onClick={() => setSmsFilter("high")}
                      variant={smsFilter === "high" ? "default" : "outline"}
                      className={
                        smsFilter === "high"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      High
                    </Button>
                    <Button
                      onClick={() => setSmsFilter("urgent")}
                      variant={smsFilter === "urgent" ? "default" : "outline"}
                      className={
                        smsFilter === "urgent"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Urgent
                    </Button>
                    <Button
                      onClick={() => setShowSmsDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Send New Alert
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search alerts by title or type..."
                    value={smsSearch}
                    onChange={(e) => setSmsSearch(e.target.value)}
                    className="max-w-sm border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  />
                  <Button
                    onClick={fetchSmsAlerts}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <CardContent>
                <Table>
                  <TableHeader className="bg-purple-50">
                    <TableRow className="border-purple-100">
                      <TableHead className="text-purple-900 font-bold">
                        Title
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Type
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Priority
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Recipients
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Sent
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsAlerts
                      .filter((alert) => {
                        if (
                          smsFilter !== "all" &&
                          alert.priority !== smsFilter
                        ) {
                          return false;
                        }
                        if (
                          smsSearch &&
                          !alert.title
                            .toLowerCase()
                            .includes(smsSearch.toLowerCase())
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((alert: any) => (
                        <TableRow
                          key={alert._id}
                          className="border-purple-100 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium text-purple-900">
                            {alert.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{alert.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(alert.priority)}
                          </TableCell>
                          <TableCell>{alert.sentCount || 0} users</TableCell>
                          <TableCell>
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 font-semibold rounded-lg p-2"
                                onClick={async () => {
                                  try {
                                    const detailedAlert = await sms.getById(
                                      alert._id
                                    );
                                    setSelectedSmsAlert(detailedAlert);
                                    setShowSmsEditDialog(true);
                                  } catch (error) {
                                    console.error(
                                      "Error fetching SMS details:",
                                      error
                                    );
                                    toast({
                                      title: "Error",
                                      description: "Failed to load SMS details",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                title="View Recipients"
                              >
                                <Edit className="w-5 h-5" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 font-semibold rounded-lg p-2"
                                onClick={() => deleteSmsAlert(alert._id)}
                                title="Delete SMS Alert"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Polls Tab */}
          <TabsContent value="polls" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Polls & Consultations</CardTitle>
                    <CardDescription>
                      Create and manage community polls and voting
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPollFilter("all")}
                      variant={pollFilter === "all" ? "default" : "outline"}
                      className={
                        pollFilter === "all"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setPollFilter("active")}
                      variant={pollFilter === "active" ? "default" : "outline"}
                      className={
                        pollFilter === "active"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Active
                    </Button>
                    <Button
                      onClick={() => setPollFilter("closed")}
                      variant={pollFilter === "closed" ? "default" : "outline"}
                      className={
                        pollFilter === "closed"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Closed
                    </Button>
                    <Button
                      onClick={() => setShowPollDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Poll
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search polls by title..."
                    value={pollSearch}
                    onChange={(e) => setPollSearch(e.target.value)}
                    className="max-w-sm border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  />
                  <Button
                    onClick={fetchPolls}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <CardContent>
                <Table>
                  <TableHeader className="bg-purple-50">
                    <TableRow className="border-purple-100">
                      <TableHead className="text-purple-900 font-bold">
                        Title
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Status
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Responses
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Created
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pollsData
                      .filter((poll) => {
                        if (
                          pollFilter !== "all" &&
                          poll.status !== pollFilter
                        ) {
                          return false;
                        }
                        if (
                          pollSearch &&
                          !poll.title
                            .toLowerCase()
                            .includes(pollSearch.toLowerCase())
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((poll: any) => (
                        <TableRow
                          key={poll._id}
                          className="border-purple-100 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium text-purple-900">
                            {poll.title}
                            {poll.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {poll.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(poll.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-semibold">
                                {poll.totalResponses ||
                                  poll.responses?.length ||
                                  0}{" "}
                                responses
                              </div>
                              {poll.endDate && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Ends:{" "}
                                  {new Date(poll.endDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(poll.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              size="sm"
                              className="bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 font-semibold rounded-lg p-2"
                              onClick={() => {
                                setSelectedPoll(poll);
                                setPollEndDateText(
                                  new Date(poll.endDate)
                                    .toISOString()
                                    .slice(0, 16)
                                );
                                setShowPollEndDateDialog(true);
                              }}
                              title="Edit Poll End Date"
                            >
                              <Edit className="w-5 h-5" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 font-semibold rounded-lg p-2"
                              onClick={() => deletePoll(poll._id)}
                              title="Delete Poll"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Announcements Management</CardTitle>
                    <CardDescription>
                      Create and manage community announcements
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setAnnouncementPriorityFilter("all")}
                      variant={
                        announcementPriorityFilter === "all"
                          ? "default"
                          : "outline"
                      }
                      className={
                        announcementPriorityFilter === "all"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setAnnouncementPriorityFilter("low")}
                      variant={
                        announcementPriorityFilter === "low"
                          ? "default"
                          : "outline"
                      }
                      className={
                        announcementPriorityFilter === "low"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-blue-300 text-blue-700"
                      }
                    >
                      Low
                    </Button>
                    <Button
                      onClick={() => setAnnouncementPriorityFilter("normal")}
                      variant={
                        announcementPriorityFilter === "normal"
                          ? "default"
                          : "outline"
                      }
                      className={
                        announcementPriorityFilter === "normal"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Normal
                    </Button>
                    <Button
                      onClick={() => setAnnouncementPriorityFilter("high")}
                      variant={
                        announcementPriorityFilter === "high"
                          ? "default"
                          : "outline"
                      }
                      className={
                        announcementPriorityFilter === "high"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      High
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingAnnouncement(null);
                        setAnnouncementForm({
                          title: "",
                          content: "",
                          category: "general",
                          isPinned: false,
                          priority: "normal",
                        });
                        setShowAnnouncementDialog(true);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Announcement
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search announcements by title or category..."
                    value={announcementSearch}
                    onChange={(e) => setAnnouncementSearch(e.target.value)}
                    className="max-w-sm border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  />
                  <Button
                    onClick={fetchAnnouncements}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <CardContent>
                <Table>
                  <TableHeader className="bg-purple-50">
                    <TableRow className="border-purple-100">
                      <TableHead className="text-purple-900 font-bold">
                        Title
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Category
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Status
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Priority
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Created
                      </TableHead>
                      <TableHead className="text-right text-purple-900 font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcementsData
                      .filter((announcement) => {
                        if (
                          announcementPriorityFilter !== "all" &&
                          announcement.priority !== announcementPriorityFilter
                        ) {
                          return false;
                        }
                        if (
                          announcementSearch &&
                          !announcement.title
                            .toLowerCase()
                            .includes(announcementSearch.toLowerCase())
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((announcement: any) => (
                        <TableRow
                          key={announcement._id}
                          className="border-purple-100 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium text-purple-900">
                            {announcement.isPinned && (
                              <Pin className="w-3 h-3 inline mr-1 text-purple-600" />
                            )}
                            {announcement.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {announcement.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={announcement.isActive}
                              onCheckedChange={() =>
                                toggleAnnouncementStatus(
                                  announcement._id,
                                  announcement.isActive
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                announcement.priority === "high"
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : announcement.priority === "normal"
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : announcement.priority === "low"
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
                              }
                            >
                              {announcement.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              className="bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 font-semibold rounded-lg p-2"
                              onClick={() => editAnnouncement(announcement)}
                              title="Edit Announcement"
                            >
                              <Edit className="w-5 h-5" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 font-semibold rounded-lg p-2"
                              onClick={() =>
                                deleteAnnouncement(announcement._id)
                              }
                              title="Delete Announcement"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Verification Management</CardTitle>
                    <CardDescription>
                      Review and manage user verification status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setVerificationFilter("all")}
                      variant={
                        verificationFilter === "all" ? "default" : "outline"
                      }
                      className={
                        verificationFilter === "all"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setVerificationFilter("pending")}
                      variant={
                        verificationFilter === "pending" ? "default" : "outline"
                      }
                      className={
                        verificationFilter === "pending"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                    </Button>
                    <Button
                      onClick={() => setVerificationFilter("rejected")}
                      variant={
                        verificationFilter === "rejected"
                          ? "default"
                          : "outline"
                      }
                      className={
                        verificationFilter === "rejected"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      Rejected
                    </Button>
                    <Button
                      onClick={() => setVerificationFilter("verified")}
                      variant={
                        verificationFilter === "verified"
                          ? "default"
                          : "outline"
                      }
                      className={
                        verificationFilter === "verified"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "border-purple-300 text-purple-700"
                      }
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Verified
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={verificationSearch}
                    onChange={(e) => setVerificationSearch(e.target.value)}
                    className="max-w-sm border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  />
                  <Button
                    onClick={fetchVerificationData}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <CardContent>
                <Table>
                  <TableHeader className="bg-purple-50">
                    <TableRow className="border-purple-100">
                      <TableHead className="text-purple-900 font-bold">
                        Name
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Email
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Phone
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Verification Status
                      </TableHead>
                      <TableHead className="text-purple-900 font-bold">
                        Registered
                      </TableHead>
                      <TableHead className="text-right text-purple-900 font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verificationData.length > 0 ? (
                      verificationData.map((user) => (
                        <TableRow
                          key={user._id}
                          className="border-purple-100 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium text-purple-900">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phoneNumber || "N/A"}</TableCell>
                          <TableCell>
                            {(() => {
                              const status =
                                user.verificationStatus ||
                                (user.isVerified ? "approved" : "pending");

                              if (status === "approved") {
                                return (
                                  <Badge className="bg-green-500 text-white flex items-center gap-1 w-fit">
                                    <CheckCircle className="w-3 h-3" />
                                    Approved
                                  </Badge>
                                );
                              } else if (status === "rejected") {
                                return (
                                  <Badge className="bg-red-500 text-white flex items-center gap-1 w-fit">
                                    <XCircle className="w-3 h-3" />
                                    Rejected
                                  </Badge>
                                );
                              } else {
                                return (
                                  <Badge className="bg-yellow-500 text-white flex items-center gap-1 w-fit">
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </Badge>
                                );
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              className="bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 font-semibold rounded-lg p-2"
                              onClick={() => openVerificationEditor(user)}
                              title="Edit Verification"
                            >
                              <Edit className="w-5 h-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="border-purple-100">
                        <TableCell
                          colSpan={6}
                          className="text-center text-gray-500 py-8"
                        >
                          {verificationFilter === "pending"
                            ? "No pending verifications"
                            : verificationFilter === "verified"
                            ? "No verified users"
                            : "No users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SMS Edit Dialog - View Recipients */}
        <Dialog open={showSmsEditDialog} onOpenChange={setShowSmsEditDialog}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Edit SMS Alert
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                Update alert details and recipients
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <Label
                  htmlFor="edit-sms-title"
                  className="text-purple-900 text-xs font-semibold"
                >
                  Alert Title *
                </Label>
                <Input
                  id="edit-sms-title"
                  value={selectedSmsAlert?.title || ""}
                  onChange={(e) =>
                    setSelectedSmsAlert({
                      ...selectedSmsAlert,
                      title: e.target.value,
                    })
                  }
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>

              {/* Message */}
              <div>
                <Label
                  htmlFor="edit-sms-message"
                  className="text-purple-900 text-xs font-semibold"
                >
                  Message *
                </Label>
                <Textarea
                  id="edit-sms-message"
                  value={selectedSmsAlert?.message || ""}
                  onChange={(e) =>
                    setSelectedSmsAlert({
                      ...selectedSmsAlert,
                      message: e.target.value,
                    })
                  }
                  rows={3}
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label
                    htmlFor="edit-sms-type"
                    className="text-purple-900 text-xs font-semibold"
                  >
                    Type
                  </Label>
                  <Select
                    value={selectedSmsAlert?.type}
                    onValueChange={(value) =>
                      setSelectedSmsAlert({ ...selectedSmsAlert, type: value })
                    }
                  >
                    <SelectTrigger
                      id="edit-sms-type"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="edit-sms-priority"
                    className="text-purple-900 text-xs font-semibold"
                  >
                    Priority
                  </Label>
                  <Select
                    value={selectedSmsAlert?.priority}
                    onValueChange={(value) =>
                      setSelectedSmsAlert({
                        ...selectedSmsAlert,
                        priority: value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="edit-sms-priority"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <Label className="text-purple-900 text-xs font-semibold">
                  Recipients ({selectedSmsAlert?.recipients?.length || 0})
                </Label>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 max-h-40 overflow-y-auto">
                  {selectedSmsAlert?.recipients &&
                  selectedSmsAlert.recipients.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSmsAlert.recipients.map(
                        (recipient: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-2 border border-purple-100 flex items-center gap-2"
                          >
                            {recipient.profilePicture ? (
                              <img
                                src={recipient.profilePicture}
                                alt={recipient.firstName || "User"}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {recipient.firstName?.charAt(0) ||
                                  recipient.phoneNumber?.charAt(0) ||
                                  "?"}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900">
                                {recipient.firstName} {recipient.lastName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {recipient.phoneNumber}
                              </p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500 text-white">
                              {recipient.status || "sent"}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 text-center py-2">
                      No recipients
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSmsEditDialog(false);
                  setSelectedSmsAlert(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await sms.update(selectedSmsAlert._id, {
                      title: selectedSmsAlert.title,
                      message: selectedSmsAlert.message,
                      type: selectedSmsAlert.type,
                      priority: selectedSmsAlert.priority,
                    });
                    toast({
                      title: "Success",
                      description: "SMS alert updated successfully",
                    });
                    setShowSmsEditDialog(false);
                    setSelectedSmsAlert(null);
                    fetchSmsAlerts();
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to update SMS alert",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                Update Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SMS Alert Dialog */}
        <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Send SMS Alert
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                Broadcast an alert or announcement to residents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sms-title" className="text-purple-900">
                  Alert Title *
                </Label>
                <Input
                  id="sms-title"
                  value={smsForm.title}
                  onChange={(e) =>
                    setSmsForm({ ...smsForm, title: e.target.value })
                  }
                  placeholder="Enter alert title"
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="sms-message" className="text-purple-900">
                  Message *
                </Label>
                <Textarea
                  id="sms-message"
                  value={smsForm.message}
                  onChange={(e) =>
                    setSmsForm({ ...smsForm, message: e.target.value })
                  }
                  placeholder="Enter alert message"
                  rows={4}
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sms-type" className="text-purple-900">
                    Type
                  </Label>
                  <Select
                    value={smsForm.type}
                    onValueChange={(value) =>
                      setSmsForm({ ...smsForm, type: value })
                    }
                  >
                    <SelectTrigger
                      id="sms-type"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sms-priority" className="text-purple-900">
                    Priority
                  </Label>
                  <Select
                    value={smsForm.priority}
                    onValueChange={(value) =>
                      setSmsForm({ ...smsForm, priority: value })
                    }
                  >
                    <SelectTrigger
                      id="sms-priority"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="sms-recipients" className="text-purple-900">
                  Recipients
                </Label>
                <Select
                  value={smsForm.recipients}
                  onValueChange={(value) =>
                    setSmsForm({ ...smsForm, recipients: value })
                  }
                >
                  <SelectTrigger
                    id="sms-recipients"
                    className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Users Only</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specific Users Selection */}
              {smsForm.recipients === "specific" && (
                <div className="space-y-3">
                  <Label className="text-purple-900 text-sm font-semibold">
                    Select Users *
                  </Label>

                  {/* Search Input */}
                  <Input
                    placeholder="Search users by name or phone..."
                    value={smsRecipientSearch}
                    onChange={(e) => setSmsRecipientSearch(e.target.value)}
                    className="bg-white border-purple-200 text-sm"
                  />

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSmsForm({
                          ...smsForm,
                          specificRecipients: users.map((u: any) => u._id),
                        });
                      }}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSmsForm({
                          ...smsForm,
                          specificRecipients: [],
                        });
                      }}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* User List */}
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 max-h-64 overflow-y-auto space-y-2">
                    {users
                      .filter((user: any) =>
                        `${user.firstName} ${user.lastName} ${user.phoneNumber}`
                          .toLowerCase()
                          .includes(smsRecipientSearch.toLowerCase())
                      )
                      .map((user: any) => (
                        <div
                          key={user._id}
                          className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-purple-100 cursor-pointer"
                          onClick={() => {
                            const isSelected =
                              smsForm.specificRecipients?.includes(user._id);
                            setSmsForm({
                              ...smsForm,
                              specificRecipients: isSelected
                                ? smsForm.specificRecipients?.filter(
                                    (id) => id !== user._id
                                  ) || []
                                : [
                                    ...(smsForm.specificRecipients || []),
                                    user._id,
                                  ],
                            });
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={smsForm.specificRecipients?.includes(
                              user._id
                            )}
                            onChange={() => {}}
                            className="w-4 h-4 cursor-pointer"
                          />
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.firstName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">
                              {user.firstName?.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {user.phoneNumber}
                            </p>
                          </div>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                  </div>

                  {/* Selected Count */}
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-gray-600">
                      {smsForm.specificRecipients?.length || 0} of{" "}
                      {users.length} user(s) selected
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSmsDialog(false)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-900 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={sendSmsAlert}
                disabled={
                  !smsForm.title ||
                  !smsForm.message ||
                  (smsForm.recipients === "specific" &&
                    (!smsForm.specificRecipients ||
                      smsForm.specificRecipients.length === 0))
                }
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Poll Creation Dialog */}
        <Dialog open={showPollDialog} onOpenChange={setShowPollDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Create New Poll
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                Create a poll or consultation for community input
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="poll-title" className="text-purple-900">
                  Poll Title *
                </Label>
                <Input
                  id="poll-title"
                  value={pollForm.title}
                  onChange={(e) =>
                    setPollForm({ ...pollForm, title: e.target.value })
                  }
                  placeholder="Enter poll title"
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="poll-description" className="text-purple-900">
                  Description
                </Label>
                <Textarea
                  id="poll-description"
                  value={pollForm.description}
                  onChange={(e) =>
                    setPollForm({ ...pollForm, description: e.target.value })
                  }
                  placeholder="Optional description"
                  rows={2}
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="poll-end-date" className="text-purple-900">
                  Poll Ends *
                </Label>
                <Input
                  id="poll-end-date"
                  type="datetime-local"
                  value={pollForm.endDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) =>
                    setPollForm({ ...pollForm, endDate: e.target.value })
                  }
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Choose when voting should close. Default is 7 days from now.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="poll-anonymous"
                  checked={pollForm.isAnonymous}
                  onCheckedChange={(checked) =>
                    setPollForm({ ...pollForm, isAnonymous: checked })
                  }
                />
                <Label htmlFor="poll-anonymous">Anonymous Voting</Label>
              </div>

              <div className="space-y-4">
                <Label className="text-purple-900">Questions</Label>
                {pollForm.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="border-purple-200">
                    <CardContent className="pt-4 space-y-3">
                      <Input
                        placeholder="Enter question"
                        value={question.question}
                        onChange={(e) =>
                          updatePollQuestion(qIndex, "question", e.target.value)
                        }
                        className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                      />
                      <Select
                        value={question.type}
                        onValueChange={(value) =>
                          updatePollQuestion(qIndex, "type", value)
                        }
                      >
                        <SelectTrigger className="border-purple-300 focus:border-purple-400 focus:ring-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Choice</SelectItem>
                          <SelectItem value="multiple">
                            Multiple Choice
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="space-y-2">
                        <Label className="text-sm text-purple-900">
                          Options
                        </Label>
                        {question.options.map((option, oIndex) => (
                          <Input
                            key={oIndex}
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              updatePollOption(qIndex, oIndex, e.target.value)
                            }
                            className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                          />
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPollOption(qIndex)}
                          className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-900 font-medium"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={addPollQuestion}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-900 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPollDialog(false)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-900 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={createPoll}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                <Vote className="w-4 h-4 mr-2" />
                Create Poll
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Incident Management Dialog */}
        <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
          <DialogContent className="border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Manage Incident
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                Update incident status and details
              </DialogDescription>
            </DialogHeader>
            {selectedIncident && (
              <div className="space-y-4">
                <div>
                  <Label className="font-bold text-purple-900">Title:</Label>
                  <p>{selectedIncident.title}</p>
                </div>
                <div>
                  <Label className="font-bold text-purple-900">
                    Description:
                  </Label>
                  <p>{selectedIncident.description}</p>
                </div>
                <div>
                  <Label className="font-bold text-purple-900">
                    Current Status:
                  </Label>
                  <p>{getStatusBadge(selectedIncident.status)}</p>
                </div>
                <div>
                  <Label htmlFor="incident-status" className="text-purple-900">
                    Update Status
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      updateIncidentStatus(selectedIncident._id, value)
                    }
                  >
                    <SelectTrigger
                      id="incident-status"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-bold text-purple-900">
                      Admin Notes:
                    </Label>
                    {!editingIncidentNotes && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingIncidentNotes(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  {editingIncidentNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={incidentNotes}
                        onChange={(e) => setIncidentNotes(e.target.value)}
                        placeholder="Add internal notes about this incident..."
                        rows={3}
                        className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={saveIncidentNotes}
                          disabled={savingIncidentNotes}
                        >
                          {savingIncidentNotes ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingIncidentNotes(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                      {incidentNotes || "No notes added"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Document Management Dialog */}
        <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
          <DialogContent className="border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Process Document Request
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                Review and update document request status
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div>
                  <Label className="font-bold text-purple-900">
                    Document Type:
                  </Label>
                  <p>{selectedDocument.documentType}</p>
                </div>
                <div>
                  <Label className="font-bold text-purple-900">Purpose:</Label>
                  <p>{selectedDocument.purpose}</p>
                </div>
                <div>
                  <Label className="font-bold text-purple-900">
                    Current Status:
                  </Label>
                  <p>{getStatusBadge(selectedDocument.status)}</p>
                </div>
                <div>
                  <Label htmlFor="document-status" className="text-purple-900">
                    Update Status
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      updateDocumentStatus(selectedDocument._id, value)
                    }
                  >
                    <SelectTrigger
                      id="document-status"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-bold text-purple-900">
                      Admin Notes:
                    </Label>
                    {!editingDocumentNotes && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingDocumentNotes(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  {editingDocumentNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={documentNotes}
                        onChange={(e) => setDocumentNotes(e.target.value)}
                        placeholder="Add internal notes about this document request..."
                        rows={3}
                        className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={saveDocumentNotes}
                          disabled={savingDocumentNotes}
                        >
                          {savingDocumentNotes ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingDocumentNotes(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                      {documentNotes || "No notes added"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Poll End Date Dialog */}
        <Dialog
          open={showPollEndDateDialog}
          onOpenChange={setShowPollEndDateDialog}
        >
          <DialogContent className="border-purple-200 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Extend Poll Deadline
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                Choose a new end date for "{selectedPoll?.title}"
              </DialogDescription>
            </DialogHeader>
            {selectedPoll && (
              <div className="space-y-5">
                {/* Current Status */}
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-600 mb-1">
                    CURRENT END TIME
                  </p>
                  <p className="text-sm font-semibold text-purple-900">
                    {new Date(selectedPoll.endDate).toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {new Date(selectedPoll.endDate) > new Date()
                      ? (() => {
                          const now = new Date();
                          const endDate = new Date(selectedPoll.endDate);
                          const diffMs = endDate.getTime() - now.getTime();
                          const diffDays = Math.floor(
                            diffMs / (1000 * 60 * 60 * 24)
                          );
                          const diffHours = Math.ceil(diffMs / 3600000);

                          if (diffDays > 0) {
                            const remainingHours = diffHours - diffDays * 24;
                            return `Ends in ${diffDays} day${
                              diffDays > 1 ? "s" : ""
                            } and ${remainingHours} hour${
                              remainingHours !== 1 ? "s" : ""
                            }`;
                          }
                          return `Ends in ${diffHours} hour${
                            diffHours !== 1 ? "s" : ""
                          }`;
                        })()
                      : (() => {
                          const now = new Date();
                          const endDate = new Date(selectedPoll.endDate);
                          const diffMs = now.getTime() - endDate.getTime();
                          const diffDays = Math.floor(
                            diffMs / (1000 * 60 * 60 * 24)
                          );
                          const diffHours = Math.ceil(diffMs / 3600000);

                          if (diffDays > 0) {
                            const remainingHours = diffHours - diffDays * 24;
                            return `Ended ${diffDays} day${
                              diffDays > 1 ? "s" : ""
                            } and ${remainingHours} hour${
                              remainingHours !== 1 ? "s" : ""
                            } ago`;
                          }
                          return `Ended ${diffHours} hour${
                            diffHours !== 1 ? "s" : ""
                          } ago`;
                        })()}
                  </p>
                </div>
                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      viewPollResults(selectedPoll);
                    }}
                    className="w-full bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700 font-semibold rounded-lg"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                  {selectedPoll.status === "active" && (
                    <Button
                      onClick={() => {
                        updatePollStatus(selectedPoll._id, "closed");
                      }}
                      className="w-full bg-orange-100 hover:bg-orange-200 text-orange-600 hover:text-orange-700 font-semibold rounded-lg"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Close Poll
                    </Button>
                  )}
                </div>
                {/* Custom Date/Time Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="poll-end-date"
                    className="text-xs font-semibold text-gray-700"
                  >
                    CUSTOM DATE & TIME
                  </Label>
                  <Input
                    id="poll-end-date"
                    type="datetime-local"
                    value={pollEndDateText}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setPollEndDateText(e.target.value)}
                    className="border-purple-300 focus:border-purple-400 focus:ring-purple-500 text-sm"
                  />
                </div>
                {/* New Preview */}
                {pollEndDateText && new Date(pollEndDateText) > new Date() && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-600 mb-1">
                      NEW END TIME
                    </p>
                    <p className="text-sm font-semibold text-green-900">
                      {new Date(pollEndDateText).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {(() => {
                        const now = new Date();
                        const newDate = new Date(pollEndDateText);
                        const diffMs = newDate.getTime() - now.getTime();
                        const diffDays = Math.floor(
                          diffMs / (1000 * 60 * 60 * 24)
                        );
                        const diffHours = Math.ceil(diffMs / 3600000);

                        if (diffDays > 0) {
                          const remainingHours = diffHours - diffDays * 24;
                          return `In ${diffDays} day${
                            diffDays > 1 ? "s" : ""
                          } and ${remainingHours} hour${
                            remainingHours !== 1 ? "s" : ""
                          } from now`;
                        }
                        return `In ${diffHours} hour${
                          diffHours !== 1 ? "s" : ""
                        } from now`;
                      })()}
                    </p>
                  </div>
                )}
                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPollEndDateDialog(false)}
                    className="text-gray-700 border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={savePollEndDate}
                    disabled={savingPollEndDate || !pollEndDateText}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    {savingPollEndDate ? "Saving..." : "Save New Date"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Poll Results Dialog */}
        <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Poll Results
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                View voting results and statistics
              </DialogDescription>
            </DialogHeader>
            {selectedPoll && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-purple-900">
                    {selectedPoll.title}
                  </h3>
                  {selectedPoll.description && (
                    <p className="text-muted-foreground">
                      {selectedPoll.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  <p className="text-sm">
                    <span className="font-medium">Total Responses:</span>{" "}
                    {selectedPoll.totalResponses || 0}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{" "}
                    {getStatusBadge(selectedPoll.status)}
                  </p>
                  {selectedPoll.isAnonymous && (
                    <Badge variant="outline">Anonymous</Badge>
                  )}
                </div>
                {selectedPoll.questions?.map((q: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Question {index + 1}: {q.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {q.options?.map((option: any, optIndex: number) => {
                          const votes = option.votes || 0;
                          const percentage = option.percentage || 0;
                          return (
                            <div key={optIndex} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                  {option.text}
                                </span>
                                <span className="text-muted-foreground">
                                  {votes} votes ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-purple-100 rounded-full h-2.5">
                                <div
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Announcement Dialog */}
        <Dialog
          open={showAnnouncementDialog}
          onOpenChange={setShowAnnouncementDialog}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                {editingAnnouncement
                  ? "Edit Announcement"
                  : "Create Announcement"}
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                {editingAnnouncement
                  ? "Update announcement details"
                  : "Create a new community announcement"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ann-title" className="text-purple-900">
                  Title *
                </Label>
                <Input
                  id="ann-title"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter announcement title"
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="ann-content" className="text-purple-900">
                  Content *
                </Label>
                <Textarea
                  id="ann-content"
                  value={announcementForm.content}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      content: e.target.value,
                    })
                  }
                  placeholder="Enter announcement content"
                  rows={6}
                  className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ann-category" className="text-purple-900">
                    Category
                  </Label>
                  <Select
                    value={announcementForm.category}
                    onValueChange={(value) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        category: value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="ann-category"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ann-priority" className="text-purple-900">
                    Priority
                  </Label>
                  <Select
                    value={announcementForm.priority}
                    onValueChange={(value) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        priority: value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="ann-priority"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ann-pinned"
                  checked={announcementForm.isPinned}
                  onCheckedChange={(checked) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      isPinned: checked,
                    })
                  }
                />
                <Label htmlFor="ann-pinned">
                  Pin this announcement (will appear at top)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAnnouncementDialog(false)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-900 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={
                  editingAnnouncement ? updateAnnouncement : createAnnouncement
                }
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                {loading
                  ? "Saving..."
                  : editingAnnouncement
                  ? "Update"
                  : "Create"}{" "}
                Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Verification Edit Dialog */}
        <Dialog
          open={showVerificationDialog}
          onOpenChange={setShowVerificationDialog}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                Edit User Verification
              </DialogTitle>
              <DialogDescription className="text-purple-700">
                Review and update verification status for{" "}
                {selectedVerification?.firstName}{" "}
                {selectedVerification?.lastName}
              </DialogDescription>
            </DialogHeader>
            {selectedVerification && (
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs font-bold text-purple-900 uppercase">
                      User Information
                    </p>
                    <p className="text-sm text-purple-900 mt-1">
                      <span className="font-semibold">Email:</span>{" "}
                      {selectedVerification.email}
                    </p>
                    <p className="text-sm text-purple-900">
                      <span className="font-semibold">Phone:</span>{" "}
                      {selectedVerification.phoneNumber || "N/A"}
                    </p>
                    <p className="text-sm text-purple-900">
                      <span className="font-semibold">Registered:</span>{" "}
                      {new Date(
                        selectedVerification.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="verification-status"
                    className="text-purple-900 font-bold"
                  >
                    Verification Status *
                  </Label>
                  <Select
                    value={verificationForm.verificationStatus}
                    onValueChange={(value) =>
                      setVerificationForm({
                        ...verificationForm,
                        verificationStatus: value,
                      })
                    }
                  >
                    <SelectTrigger
                      id="verification-status"
                      className="border-purple-300 focus:border-purple-400 focus:ring-purple-500"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          Pending - Awaiting Verification
                        </div>
                      </SelectItem>
                      <SelectItem value="approved">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Approved - User Verified
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          Rejected - Verification Denied
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="verification-notes"
                    className="text-purple-900 font-bold"
                  >
                    Verification Notes
                  </Label>
                  <Textarea
                    id="verification-notes"
                    value={verificationForm.verificationNotes}
                    onChange={(e) =>
                      setVerificationForm({
                        ...verificationForm,
                        verificationNotes: e.target.value,
                      })
                    }
                    placeholder="Add notes about this verification decision (optional)"
                    rows={4}
                    className="border-purple-300 focus:border-purple-400 focus:ring-purple-500 mt-2"
                  />
                </div>

                {verificationForm.verificationStatus === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Note:</span> User will be
                      notified that their verification was rejected.
                    </p>
                  </div>
                )}

                {verificationForm.verificationStatus === "approved" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      <span className="font-semibold">Note:</span> User will
                      gain full access to verified features.
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowVerificationDialog(false)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-900 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={submitVerificationUpdate}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                {loading ? "Updating..." : "Update Verification Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
