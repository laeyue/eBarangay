import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, notifications } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowLeft,
  Save,
  Shield,
  Calendar,
  CheckCircle2,
  Upload,
  Camera,
  AlertCircle,
  Clock,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [unreadVerificationCount, setUnreadVerificationCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  // Profile form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile picture and verification
  const [profilePicture, setProfilePicture] = useState<string | null>(() => {
    const storedUser = auth.getStoredUser();
    return storedUser?.profilePicture || null;
  });
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [verificationDocument, setVerificationDocument] = useState<File | null>(
    null
  );
  const [uploadingVerification, setUploadingVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null
  );
  const [verificationDate, setVerificationDate] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      const storedUser = auth.getStoredUser();
      if (!storedUser || !auth.isAuthenticated()) {
        navigate("/login");
        return;
      }

      try {
        // Fetch complete user profile from backend
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const fullUser = await response.json();
          setUser(fullUser);
          setFirstName(fullUser.firstName || "");
          setLastName(fullUser.lastName || "");
          setPhoneNumber(fullUser.phoneNumber || "");
          setAddress(fullUser.address || "");
          setProfilePicture(fullUser.profilePicture || null);
          setVerificationStatus(fullUser.verificationStatus || "pending");
          setVerificationMessage(fullUser.verificationMessage || null);
          setVerificationDate(fullUser.verificationDate || null);
          setVerificationNotes(fullUser.verificationNotes || null);

          // Update localStorage with complete user data
          localStorage.setItem("user", JSON.stringify(fullUser));
        } else {
          // Fallback to stored user if fetch fails
          setUser(storedUser);
          setFirstName(storedUser.firstName || "");
          setLastName(storedUser.lastName || "");
          setPhoneNumber(storedUser.phoneNumber || "");
          setAddress(storedUser.address || "");
        }
      } catch (error) {
        // Fallback to stored user if fetch fails
        setUser(storedUser);
        setFirstName(storedUser.firstName || "");
        setLastName(storedUser.lastName || "");
        setPhoneNumber(storedUser.phoneNumber || "");
        setAddress(storedUser.address || "");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    // Refresh verification status every 30 seconds to show real-time updates
    const refreshInterval = setInterval(() => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:5000/api"
            }/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ).then(async (response) => {
            if (response.ok) {
              const fullUser = await response.json();
              localStorage.setItem("user", JSON.stringify(fullUser));

              // Update verification status if it has changed
              setVerificationStatus(fullUser.verificationStatus || "pending");
              setVerificationMessage(fullUser.verificationMessage || null);
              setVerificationDate(fullUser.verificationDate || null);
              setVerificationNotes(fullUser.verificationNotes || null);
            }
          });
        }
      } catch (error) {
        // Silent fail - don't interrupt user experience
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [navigate]);

  // Fetch unread verification notifications
  const fetchVerificationNotifications = async () => {
    try {
      const count = await notifications.getUnreadCount("verification_status");
      setUnreadVerificationCount(count?.count || 0);
    } catch (error) {
      console.error("Error fetching verification notifications:", error);
    }
  };

  // Fetch verification count on mount and when component updates
  useEffect(() => {
    fetchVerificationNotifications();
    const interval = setInterval(fetchVerificationNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkVerificationRead = async () => {
    try {
      setMarkingAll(true);
      await notifications.markVerificationAsRead();
      setUnreadVerificationCount(0);
      // Dispatch event to update dashboard badge
      window.dispatchEvent(new Event("verificationUpdated"));
      toast.success("Verification notifications marked as read");
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/update-profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            firstName,
            lastName,
            phoneNumber,
            address,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Update failed");
      }

      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password change failed");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error changing password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingPicture(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("profilePicture", file);

      // Upload to backend
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/auth/upload-profile-picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload profile picture");
      }

      const updatedUser = await response.json();

      // Update local state and localStorage
      setProfilePicture(updatedUser.profilePicture || null);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleVerificationUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images or PDFs)
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setVerificationDocument(file);
  };

  const handleSubmitVerification = async () => {
    if (!verificationDocument) {
      toast.error("Please select a verification document");
      return;
    }

    setUploadingVerification(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("verificationDocument", verificationDocument);

      // TODO: Implement verification upload API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      setVerificationStatus("pending");
      setVerificationDocument(null);
      toast.success(
        "Verification document submitted! We'll review it within 24-48 hours."
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to submit verification document");
    } finally {
      setUploadingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-user flex items-center justify-center">
        <div className="text-center text-white">
          <div className="h-16 w-16 rounded-full border-4 border-white/30 border-t-white animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      {/* Enhanced Header with Gradient */}
      <div className="relative w-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 text-white py-12 mb-10 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl -ml-48 -mb-48" />
        </div>

        <div className="w-full mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
          <div className="flex items-center justify-between mb-6 gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/20 font-semibold h-9"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            {unreadVerificationCount > 0 && (
              <Button
                variant="secondary"
                disabled={markingAll}
                onClick={handleMarkVerificationRead}
                className="bg-white/15 text-white border border-white/40 hover:bg-white/25 font-semibold h-10 px-4 rounded-lg transition-all duration-300 hover:shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark all read ({unreadVerificationCount})
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
            {/* Avatar with upload */}
            <div className="relative group shrink-0">
              <div className="h-40 w-40 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/50 flex items-center justify-center shadow-2xl overflow-hidden">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-20 w-20 text-white" />
                )}
              </div>
              <label
                htmlFor="profile-picture-upload"
                className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-white border-4 border-blue-600 shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              >
                <Camera className="h-6 w-6 text-blue-600" />
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingPicture}
                />
              </label>
              {verificationStatus === "approved" && (
                <div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-green-500 border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {/* User Info Section */}
            <div className="flex-1">
              <div className="space-y-3">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                    {firstName} {lastName}
                  </h1>
                  <p className="text-blue-100 text-lg font-medium drop-shadow">
                    {user?.email}
                  </p>
                </div>

                {/* Badge Row */}
                <div className="flex flex-wrap gap-2 pt-3">
                  <Badge className="bg-white/25 text-white border border-white/50 backdrop-blur-sm font-semibold">
                    {user?.role === "admin" ? (
                      <Shield className="h-3 w-3 mr-1.5" />
                    ) : (
                      <UserIcon className="h-3 w-3 mr-1.5" />
                    )}
                    {user?.role === "admin" ? "Administrator" : "User"}
                  </Badge>
                  <Badge className="bg-white/25 text-white border border-white/50 backdrop-blur-sm font-semibold">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    Member since{" "}
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </Badge>
                  {verificationStatus === "approved" && (
                    <Badge className="bg-green-500 hover:bg-green-600 font-semibold border-0 shadow-lg">
                      <CheckCircle2 className="h-3 w-3 mr-1.5" />
                      Verified
                    </Badge>
                  )}
                  {verificationStatus === "pending" && (
                    <Badge className="bg-yellow-500/90 hover:bg-yellow-600 text-white font-semibold border-0 shadow-lg">
                      <Clock className="h-3 w-3 mr-1.5" />
                      Verification Pending
                    </Badge>
                  )}
                  {verificationStatus === "rejected" && (
                    <Badge className="bg-red-500 hover:bg-red-600 font-semibold border-0 shadow-lg">
                      <AlertCircle className="h-3 w-3 mr-1.5" />
                      Verification Rejected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 pb-12 max-w-4xl space-y-6">
        {/* Profile Information */}
        <Card className="border-2 shadow-xl card-interactive animate-fade-in overflow-hidden">
          <CardHeader className="pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-xl gradient-user flex items-center justify-center shadow-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">Personal Information</CardTitle>
                <CardDescription className="text-base">
                  Update your personal details and contact information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2.5">
                  <Label htmlFor="firstName" className="text-sm font-semibold">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm transition-all"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="lastName" className="text-sm font-semibold">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-12 h-12 bg-muted/70 border-2 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Email address cannot be changed
                </p>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="phoneNumber" className="text-sm font-semibold">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-12 h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="address" className="text-sm font-semibold">
                  Complete Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    id="address"
                    placeholder="Street, Barangay, City, Province"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="pl-12 border-2 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm transition-all resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={updating}
                className="w-full h-12 text-base font-semibold btn-scale gradient-user text-white shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5 mr-2" />
                {updating ? "Saving Changes..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card
          className="border-2 shadow-xl card-interactive animate-fade-in overflow-hidden"
          style={{ animationDelay: "100ms" }}
        >
          <CardHeader className="pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">Security Settings</CardTitle>
                <CardDescription className="text-base">
                  Update your password to keep your account secure
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-2.5">
                <Label
                  htmlFor="currentPassword"
                  className="text-sm font-semibold"
                >
                  Current Password *
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm transition-all"
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2.5">
                <Label htmlFor="newPassword" className="text-sm font-semibold">
                  New Password *
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm transition-all"
                />
              </div>

              <div className="space-y-2.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold"
                >
                  Confirm New Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 border-2 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={changingPassword}
                className="w-full h-12 text-base font-semibold btn-scale bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
              >
                <Lock className="w-5 h-5 mr-2" />
                {changingPassword ? "Changing Password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resident Verification */}
        {verificationStatus !== "approved" && (
          <Card
            className="border-2 shadow-xl card-interactive animate-fade-in overflow-hidden"
            style={{ animationDelay: "150ms" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 pointer-events-none" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    Resident Verification
                  </CardTitle>
                  <CardDescription>
                    Verify your residency status to access more features
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {verificationStatus === "pending" ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                          Verification In Progress
                        </h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                          Your verification document is being reviewed. This
                          typically takes 24-48 hours.
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                          Awaiting admin review...
                        </p>
                      </div>
                    </div>
                  </div>

                  {verificationMessage && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Admin Message:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            {verificationMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationNotes && verificationNotes.trim() && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                            Admin Notes:
                          </p>
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            {verificationNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : verificationStatus === "rejected" ? (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
                          Verification Rejected
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          Your verification was not approved. Please review the
                          feedback below and resubmit with correct documents.
                        </p>
                      </div>
                    </div>
                  </div>

                  {verificationMessage && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                            Reason:
                          </p>
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            {verificationMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationNotes && verificationNotes.trim() && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                            Admin Notes:
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {verificationNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Required Documents (any one):
                        </p>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          <li>• Barangay Certificate of Residency</li>
                          <li>
                            • Utility Bill (Water/Electric) with your name and
                            address
                          </li>
                          <li>• Valid ID with current address visible</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="verification-doc-retry"
                      className="text-sm font-medium"
                    >
                      Upload New Verification Document
                    </Label>
                    <Input
                      id="verification-doc-retry"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleVerificationUpload}
                      className="h-11 border-2 focus:border-primary"
                    />
                    {verificationDocument && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {verificationDocument.name} selected
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmitVerification}
                    disabled={!verificationDocument || uploadingVerification}
                    className="w-full h-11 text-base btn-scale bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {uploadingVerification
                      ? "Resubmitting..."
                      : "Resubmit for Verification"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Verification Approved Badge */}
        {verificationStatus === "approved" && (
          <Card
            className="border-2 shadow-xl animate-fade-in overflow-hidden border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20"
            style={{ animationDelay: "150ms" }}
          >
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center gap-4 text-center justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-1">
                    Verification Approved
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your residency has been verified successfully!
                  </p>
                  {verificationMessage && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2 italic">
                      {verificationMessage}
                    </p>
                  )}
                  {verificationNotes && verificationNotes.trim() && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      <span className="font-semibold">Admin Notes:</span>{" "}
                      {verificationNotes}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Statistics */}
        <div
          className="grid md:grid-cols-3 gap-6 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <Card className="border-2 shadow-xl card-interactive hover-lift overflow-hidden bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20">
            <CardContent className="pt-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">
                    Account Type
                  </p>
                  <p className="text-xl font-bold capitalize text-purple-700 dark:text-purple-300">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl card-interactive hover-lift overflow-hidden">
            <CardContent className="pt-8">
              <div className="flex items-center gap-4">
                <div
                  className={`h-14 w-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                    verificationStatus === "approved"
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : verificationStatus === "rejected"
                      ? "bg-gradient-to-br from-red-500 to-red-600"
                      : "bg-gradient-to-br from-yellow-500 to-orange-600"
                  }`}
                >
                  {verificationStatus === "approved" && (
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  )}
                  {verificationStatus === "pending" && (
                    <Clock className="h-7 w-7 text-white" />
                  )}
                  {verificationStatus === "rejected" && (
                    <AlertCircle className="h-7 w-7 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">
                    Verification Status
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      verificationStatus === "approved"
                        ? "text-green-600 dark:text-green-400"
                        : verificationStatus === "rejected"
                        ? "text-red-600 dark:text-red-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {verificationStatus === "approved"
                      ? "Verified"
                      : verificationStatus === "pending"
                      ? "Pending"
                      : "Rejected"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl card-interactive hover-lift overflow-hidden bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="pt-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">
                    Member Since
                  </p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
