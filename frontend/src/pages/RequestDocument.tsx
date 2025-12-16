import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, documents } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, FileText } from "lucide-react";
import { z } from "zod";

const requestSchema = z.object({
  documentType: z.string().min(1, { message: "Please select a document type" }),
  purpose: z
    .string()
    .trim()
    .min(5, { message: "Purpose must be at least 5 characters" })
    .max(500),
});

const RequestDocument = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [editingAdminNotes, setEditingAdminNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingAdminNotes, setSavingAdminNotes] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Get current user
    auth.getCurrentUser().then((user) => {
      setCurrentUser(user);
    });

    // Load document if ID is provided in query params
    const documentId = searchParams.get("id");
    if (documentId) {
      loadDocument(documentId);

      // Poll for updates every 5 seconds to show admin notes changes
      const pollInterval = setInterval(() => {
        loadDocument(documentId);
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [navigate, searchParams]);

  const loadDocument = async (documentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const doc = await response.json();
        setViewingDocument(doc);
        setAdminNotes(doc.adminNotes || "");
        setDocumentType(doc.documentType);
        setPurpose(doc.purpose);
        setNotes(doc.notes || "");
      }
    } catch (error) {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!viewingDocument) return;
    setSavingAdminNotes(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/admin/documents/${viewingDocument._id}`,
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
        setViewingDocument({ ...viewingDocument, adminNotes });
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

  const documentTypes = [
    "Barangay Clearance",
    "Certificate of Residency",
    "Certificate of Indigency",
    "Business Permit",
    "Barangay ID",
    "Community Tax Certificate",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = requestSchema.safeParse({ documentType, purpose });
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
      await documents.create({
        documentType: validation.data.documentType,
        purpose: validation.data.purpose,
        notes: notes,
      });
      toast.success("Document request submitted successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error submitting request");
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
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-white drop-shadow-md">
                  {viewingDocument
                    ? "Document Request Details"
                    : "Request a Document"}
                </CardTitle>
                <CardDescription className="text-blue-100 font-medium">
                  {viewingDocument
                    ? "View your document request and what's needed"
                    : "Get barangay certificates and permits online"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            {viewingDocument ? (
              // View mode - show document request details
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-blue-900 text-lg">
                      Request Information
                    </h3>
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs font-mono font-bold rounded-lg">
                      REF: {viewingDocument._id.slice(-8).toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                        Document Type
                      </p>
                      <p className="text-gray-800 font-semibold text-lg">
                        {documentType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                        Purpose
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap bg-white/50 p-3 rounded border border-blue-100">
                        {purpose}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                          Status
                        </p>
                        <p className="text-gray-800 capitalize font-medium bg-white p-2 rounded border border-blue-100">
                          {viewingDocument.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                          Date Submitted
                        </p>
                        <p className="text-gray-800 text-sm bg-white p-2 rounded border border-blue-100">
                          {new Date(
                            viewingDocument.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
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
                                    viewingDocument.adminNotes || ""
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
                            {viewingDocument.adminNotes || "No admin notes yet"}
                          </p>
                        )}
                      </div>
                    )}
                    {currentUser?.role !== "admin" && (
                      <>
                        {viewingDocument.adminNotes && (
                          <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
                              Admin Notes
                            </p>
                            <p className="text-sm text-amber-800">
                              {viewingDocument.adminNotes}
                            </p>
                          </div>
                        )}
                        {!viewingDocument.adminNotes && (
                          <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-300 rounded opacity-60">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">
                              Admin Notes
                            </p>
                            <p className="text-sm text-amber-700 italic">
                              No admin notes yet
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Create mode - show form
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Document Type */}
                <div className="space-y-2">
                  <Label
                    htmlFor="documentType"
                    className="text-blue-900 font-bold text-sm"
                  >
                    Document Type *
                  </Label>
                  <Select
                    value={documentType}
                    onValueChange={setDocumentType}
                    required
                  >
                    <SelectTrigger className="h-11 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50">
                      <SelectValue placeholder="Select the document you need" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-600 font-medium">
                    Choose the certificate or permit you're requesting
                  </p>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label
                    htmlFor="purpose"
                    className="text-blue-900 font-bold text-sm"
                  >
                    Purpose *
                  </Label>
                  <Textarea
                    id="purpose"
                    placeholder="Explain why you need this document (e.g., school enrollment, job application, etc.)"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={4}
                    className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 resize-none text-base"
                    required
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-blue-900 font-bold text-sm"
                  >
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requests or additional information we should know"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50 resize-none text-base"
                  />
                </div>

                {/* Processing Timeline */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 p-5 rounded-xl border-2 border-green-200">
                  <p className="text-sm font-bold text-green-900 mb-3">
                    ⏱️ Processing Timeline
                  </p>
                  <ul className="text-sm text-green-700 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-600"></span>
                      <span>
                        <strong>Standard:</strong> 3-5 business days
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-600"></span>
                      <span>
                        <strong>Expedited:</strong> 1-2 business days (with fee)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-600"></span>
                      <span>Updates via SMS & email</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-600"></span>
                      <span>Bring valid ID when claiming</span>
                    </li>
                  </ul>
                </div>

                {/* Important Info */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50/50 p-5 rounded-xl border-2 border-orange-200">
                  <p className="text-sm font-bold text-orange-900 mb-2">
                    📋 Important Reminders
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Ensure you are a registered resident</li>
                    <li>• Submit accurate information</li>
                    <li>• Fee applies (see cashier window)</li>
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
                      Processing Your Request...
                    </>
                  ) : (
                    <>
                      Submit Document Request
                      <FileText className="ml-2 h-4 w-4" />
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

export default RequestDocument;
