import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, incidents } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";

const incidentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "Title must be at least 5 characters" })
    .max(100),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(1000),
  location: z
    .string()
    .trim()
    .min(3, { message: "Location must be at least 3 characters" })
    .max(200),
});

const ReportIncident = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [viewingIncident, setViewingIncident] = useState<any | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [editingAdminNotes, setEditingAdminNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingAdminNotes, setSavingAdminNotes] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    type: "other",
    priority: "medium",
  });

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Get current user
    auth.getCurrentUser().then((user) => {
      setCurrentUser(user);
    });

    // Load incident if ID is provided in query params
    const incidentId = searchParams.get("id");
    if (incidentId) {
      loadIncident(incidentId);

      // Poll for updates every 5 seconds to show admin notes changes
      const pollInterval = setInterval(() => {
        loadIncident(incidentId);
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [navigate, searchParams]);

  const loadIncident = async (incidentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/incidents/${incidentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const incident = await response.json();
        setViewingIncident(incident);
        setAdminNotes(incident.adminNotes || "");
        setFormData({
          title: incident.title,
          description: incident.description,
          location: incident.location,
          type: incident.type,
          priority: incident.priority,
        });
      }
    } catch (error) {
      toast.error("Failed to load incident");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5000000) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
    }
  };

  const handlePhotoPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.size > 5000000) {
          toast.error("Pasted image must be less than 5MB");
          return;
        }
        setPhotoFile(file);
        toast.success("Image pasted and attached");
        break;
      }
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!viewingIncident) return;
    setSavingAdminNotes(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/admin/incidents/${viewingIncident._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ adminNotes }),
        }
      );
      if (response.ok) {
        setViewingIncident({ ...viewingIncident, adminNotes });
        setEditingAdminNotes(false);
        toast.success("Admin notes saved!");
      } else {
        toast.error("Failed to save admin notes");
      }
    } catch (error) {
      toast.error("Error saving admin notes");
    } finally {
      setSavingAdminNotes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = incidentSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!auth.isAuthenticated()) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("title", validation.data.title);
      data.append("description", validation.data.description);
      data.append("location", validation.data.location);
      data.append("type", formData.type);
      data.append("priority", formData.priority);

      if (photoFile) {
        data.append("photo", photoFile);
      }

      await incidents.create(data);
      toast.success("Incident reported successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error submitting incident");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-cyan-50/30">
      {/* Enhanced Navigation */}
      <nav className="border-b border-blue-300 bg-white/98 backdrop-blur shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-500 font-semibold h-9 transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Enhanced Card */}
        <Card className="border-2 border-blue-300 shadow-2xl hover:shadow-3xl transition-all overflow-hidden">
          {/* Enhanced Header */}
          <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white border-b-4 border-blue-400 p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                <Upload className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-white drop-shadow-md">
                  {viewingIncident ? "Incident Details" : "Report an Incident"}
                </CardTitle>
                <CardDescription className="text-blue-100 font-medium">
                  {viewingIncident
                    ? "View your incident report and what's needed"
                    : "Help us improve safety by reporting community incidents"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            {viewingIncident ? (
              // View mode - show incident details
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-blue-900 text-lg">
                      Incident Information
                    </h3>
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs font-mono font-bold rounded-lg">
                      REF: {viewingIncident._id.slice(-8).toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                        Title
                      </p>
                      <p className="text-gray-800 font-semibold text-lg">
                        {formData.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                        Description
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap bg-white/50 p-3 rounded border border-blue-100">
                        {formData.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                          Type
                        </p>
                        <p className="text-gray-800 capitalize font-medium bg-white p-2 rounded border border-blue-100">
                          {formData.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                          Priority
                        </p>
                        <p className="text-gray-800 capitalize font-medium bg-white p-2 rounded border border-blue-100">
                          {formData.priority}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                          Status
                        </p>
                        <p className="text-gray-800 capitalize font-medium bg-white p-2 rounded border border-blue-100">
                          {viewingIncident.status}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                        Location
                      </p>
                      <p className="text-gray-800 bg-white/50 p-3 rounded border border-blue-100">
                        {formData.location}
                      </p>
                    </div>
                    {currentUser?.role === "admin" && (
                      <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-amber-900">
                            Admin Notes
                          </p>
                          {!editingAdminNotes && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingAdminNotes(true)}
                              className="text-amber-700 border-amber-300 hover:bg-amber-100"
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                        {editingAdminNotes ? (
                          <div className="space-y-2">
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add admin notes here..."
                              className="min-h-20 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveAdminNotes}
                                disabled={savingAdminNotes}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                {savingAdminNotes ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAdminNotes(false);
                                  setAdminNotes(
                                    viewingIncident.adminNotes || ""
                                  );
                                }}
                                disabled={savingAdminNotes}
                                className="text-amber-700 border-amber-300 hover:bg-amber-100"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-amber-800">
                            {adminNotes || "No admin notes yet"}
                          </p>
                        )}
                      </div>
                    )}
                    {viewingIncident.adminNotes &&
                      currentUser?.role !== "admin" && (
                        <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
                            Admin Notes
                          </p>
                          <p className="text-sm text-amber-800">
                            {viewingIncident.adminNotes}
                          </p>
                        </div>
                      )}
                    {!viewingIncident.adminNotes &&
                      currentUser?.role !== "admin" && (
                        <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-300 rounded opacity-60">
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
                            Admin Notes
                          </p>
                          <p className="text-sm text-amber-700 italic">
                            No admin notes yet
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              // Create mode - show form
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Incident Title */}
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-blue-900 font-bold text-sm"
                  >
                    Incident Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Brief, clear title of the incident"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="h-11 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 text-base"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-blue-900 font-bold text-sm"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about what happened, when, and who was involved"
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={5}
                    className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 resize-none text-base"
                    required
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label
                    htmlFor="location"
                    className="text-blue-900 font-bold text-sm"
                  >
                    Location *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="Street address or landmark"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="h-11 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 text-base flex-1"
                      required
                    />
                    <Button
                      type="button"
                      className="h-11 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Type & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="type"
                      className="text-blue-900 font-bold text-sm"
                    >
                      Incident Type
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(val) => handleChange("type", val)}
                    >
                      <SelectTrigger className="h-11 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public-safety">
                          Public Safety
                        </SelectItem>
                        <SelectItem value="health">
                          Health & Sanitation
                        </SelectItem>
                        <SelectItem value="infrastructure">
                          Infrastructure
                        </SelectItem>
                        <SelectItem value="noise">Noise Complaint</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="priority"
                      className="text-blue-900 font-bold text-sm"
                    >
                      Priority Level
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(val) => handleChange("priority", val)}
                    >
                      <SelectTrigger className="h-11 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label
                    htmlFor="photo"
                    className="text-blue-900 font-bold text-sm"
                  >
                    Attach Photo (Optional)
                  </Label>
                  <div
                    className="border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center hover:bg-blue-50 transition-colors cursor-pointer"
                    onPaste={handlePhotoPaste}
                  >
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label htmlFor="photo" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-blue-500" />
                        <p className="font-semibold text-blue-900">
                          {photoFile
                            ? photoFile.name
                            : "Click to upload or drag photo"}
                        </p>
                        <p className="text-sm text-blue-600">
                          Max 5MB • JPG, PNG
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 p-5 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    📋 Important Information
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Provide as much detail as possible</li>
                    <li>• Photos help authorities respond faster</li>
                    <li>• All reports are confidential</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      Submit Incident Report
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportIncident;
