import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, polls, notifications } from "@/lib/api";
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
  Vote,
  CheckCircle,
  Clock,
  BarChart,
  ArrowLeft,
  AlertCircle,
  Info,
  Search,
  Filter,
  Bell,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PollsSkeleton } from "@/components/ui/loading-skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Poll = {
  _id: string;
  title: string;
  description?: string;
  questions: {
    question: string;
    type: string;
    options: Array<{
      text: string;
      votes: number;
      _id?: string;
    }>;
  }[];
  status: string;
  isAnonymous: boolean;
  responses?: any[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  totalResponses?: number;
  hasVoted?: boolean;
  canVote?: boolean;
  voteEndedReason?: string;
  userVote?: any;
};

/**
 * Polls Component with Enhanced UI
 * - Card-based design with large buttons
 * - Confirmation modal before vote submission
 * - Disabled submit button after voting
 * - Improved error messages
 * - Active and inactive polls display
 * - localStorage tracking for anonymous poll votes
 */

// Helper functions for localStorage tracking of anonymous polls
const getVotedAnonymousPolls = (): string[] => {
  const stored = localStorage.getItem("votedAnonymousPolls");
  return stored ? JSON.parse(stored) : [];
};

const markPollAsVoted = (pollId: string) => {
  const voted = getVotedAnonymousPolls();
  if (!voted.includes(pollId)) {
    voted.push(pollId);
    localStorage.setItem("votedAnonymousPolls", JSON.stringify(voted));
  }
};

const hasVotedAnonymousPoll = (pollId: string): boolean => {
  return getVotedAnonymousPolls().includes(pollId);
};

const Polls = () => {
  const navigate = useNavigate();
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [closedPolls, setClosedPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewingResults, setViewingResults] = useState(false);
  const [pollResults, setPollResults] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">(
    "all"
  );
  const [pollNotifications, setPollNotifications] = useState<Map<string, any>>(
    new Map()
  );

  // Confirmation modal state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  useEffect(() => {
    const user = auth.getStoredUser();
    if (!user || !auth.isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchPolls();
  }, [navigate]);

  // Fetch poll notifications
  useEffect(() => {
    const fetchPollNotifications = async () => {
      try {
        const response = await notifications.getUnread();
        const pollNotifs =
          response?.notifications?.filter(
            (n: any) => n.relatedEntityType === "poll"
          ) || [];
        const notifMap = new Map();
        pollNotifs.forEach((notif: any) => {
          notifMap.set(notif.relatedEntityId, notif);
        });
        setPollNotifications(notifMap);
      } catch (error) {
        console.error("Error fetching poll notifications:", error);
      }
    };
    fetchPollNotifications();
  }, []);

  const fetchPolls = async () => {
    try {
      console.log("🔄 Fetching polls from API");
      const [active, closed] = await Promise.all([
        polls.getAll(1, 50, "active"),
        polls.getAll(1, 50, "closed"),
      ]);
      console.log("📊 Active polls received:", active.polls);
      console.log("📊 Closed polls received:", closed.polls);

      // For anonymous polls, check localStorage to see if user has voted
      const processedActive = (active.polls || []).map((poll: Poll) => {
        if (poll.isAnonymous && hasVotedAnonymousPoll(poll._id)) {
          return {
            ...poll,
            hasVoted: true,
            canVote: false,
            voteEndedReason: "You have already voted on this poll",
          };
        }
        return poll;
      });

      const processedClosed = (closed.polls || []).map((poll: Poll) => {
        if (poll.isAnonymous && hasVotedAnonymousPoll(poll._id)) {
          return {
            ...poll,
            hasVoted: true,
            canVote: false,
            voteEndedReason: "You have already voted on this poll",
          };
        }
        return poll;
      });

      // Check if any polls have hasVoted: true
      if (processedActive.length > 0) {
        const votedPolls = processedActive.filter((p: Poll) => p.hasVoted);
        console.log(
          `✅ Found ${votedPolls.length} voted polls in active`,
          votedPolls
        );
      }

      setActivePolls(processedActive);
      setClosedPolls(processedClosed);

      // REMOVED: Auto-marking as read on page load
      // Now users need to explicitly vote on polls to mark notifications as read
      // This allows the dashboard badge to show before they're marked as read

      // Dispatch event to update notification counter globally
      window.dispatchEvent(new Event("pollsViewed"));
    } catch (error: any) {
      console.error("❌ Error fetching polls:", error);
      toast.error(error.message || "Error fetching polls");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (questionIndex: number, value: any) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const togglePollNotificationRead = async (
    e: React.MouseEvent,
    pollId: string
  ) => {
    e.stopPropagation();
    try {
      const notif = pollNotifications.get(pollId);
      if (!notif) return;

      if (notif.read) {
        // Mark as unread
        await notifications.markAsUnread(notif._id);
        const newMap = new Map(pollNotifications);
        newMap.set(pollId, { ...notif, read: false });
        setPollNotifications(newMap);
      } else {
        // Mark as read
        await notifications.markAsRead(notif._id);
        const newMap = new Map(pollNotifications);
        newMap.set(pollId, {
          ...notif,
          read: true,
          readAt: new Date().toISOString(),
        });
        setPollNotifications(newMap);
      }

      // Update global notification counter
      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error) {
      console.error("Error toggling notification read status:", error);
      toast.error("Failed to update notification");
    }
  };

  const handleMultipleChoice = (
    questionIndex: number,
    optionIndex: number,
    checked: boolean
  ) => {
    const newAnswers = [...answers];
    if (!newAnswers[questionIndex]) {
      newAnswers[questionIndex] = [];
    }

    if (checked) {
      newAnswers[questionIndex] = [
        ...(newAnswers[questionIndex] || []),
        optionIndex,
      ];
    } else {
      newAnswers[questionIndex] = newAnswers[questionIndex].filter(
        (i: number) => i !== optionIndex
      );
    }
    setAnswers(newAnswers);
  };

  // Show confirmation dialog before submitting
  const handleSubmitClick = () => {
    if (!selectedPoll) return;

    // Validate all questions answered
    if (
      answers.length !== selectedPoll.questions.length ||
      answers.some(
        (a) =>
          a === undefined || a === null || (Array.isArray(a) && a.length === 0)
      )
    ) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  // Actually submit the vote after confirmation
  const confirmSubmitVote = async () => {
    if (!selectedPoll) return;

    const pollId = selectedPoll._id;

    setShowConfirmDialog(false);
    setSubmitting(true);

    try {
      console.log("🗳️ Submitting vote for poll:", pollId);
      console.log("   Poll is anonymous:", selectedPoll.isAnonymous);
      await polls.vote(pollId, answers);
      console.log("✅ Vote submitted successfully");

      // For anonymous polls, mark as voted in localStorage
      if (selectedPoll.isAnonymous) {
        markPollAsVoted(pollId);
        console.log("📝 Marked anonymous poll as voted in localStorage");
      }

      toast.success(
        "Vote submitted successfully! Thank you for participating."
      );

      // Immediately update local state to mark as voted (optimistic update)
      console.log("📝 Updating local state optimistically");
      setActivePolls((prev) => {
        const updated = prev.map((p) =>
          p._id === pollId
            ? {
                ...p,
                hasVoted: true,
                canVote: false,
                voteEndedReason: "You have already voted on this poll",
              }
            : p
        );
        console.log("Active polls after optimistic update:", updated);
        return updated;
      });

      // Also update closed polls in case it moved there
      setClosedPolls((prev) => {
        const updated = prev.map((p) =>
          p._id === pollId
            ? {
                ...p,
                hasVoted: true,
                canVote: false,
                voteEndedReason: "You have already voted on this poll",
              }
            : p
        );
        console.log("Closed polls after optimistic update:", updated);
        return updated;
      });

      setSelectedPoll(null);
      setAnswers([]);

      // Dispatch event to notify Dashboard that a poll was voted on
      window.dispatchEvent(new Event("pollVoted"));

      // Fetch fresh data from server
      console.log("🔄 Fetching fresh poll data from server");
      await fetchPolls();
      console.log("✅ Fetched fresh poll data");
    } catch (error: any) {
      console.error("❌ Error submitting vote:", error);
      toast.error(error.message || "Error submitting vote");
    } finally {
      setSubmitting(false);
    }
  };

  const viewResults = async (poll: Poll) => {
    try {
      const results = await polls.getResults(poll._id);
      setPollResults(results);
      setShowResultsDialog(true);
    } catch (error: any) {
      // Improved error message
      if (error.message.includes("not available")) {
        toast.error(
          "Results not available yet. Please wait for the poll to end.",
          {
            description:
              "Poll results will be published once the voting period closes.",
            duration: 5000,
          }
        );
      } else {
        toast.error(error.message || "Error fetching results");
      }
    }
  };

  const renderVotingInterface = () => {
    if (!selectedPoll) return null;

    const allQuestionsAnswered = selectedPoll.questions.every((_, idx) => {
      const answer = answers[idx];
      return (
        answer !== undefined &&
        answer !== null &&
        (!Array.isArray(answer) || answer.length > 0)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setSelectedPoll(null)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Polls
          </Button>
        </div>

        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="text-3xl">{selectedPoll.title}</CardTitle>
            {selectedPoll.description && (
              <CardDescription className="text-base mt-2">
                {selectedPoll.description}
              </CardDescription>
            )}
            <div className="flex gap-2 mt-4">
              {selectedPoll.isAnonymous && (
                <Badge variant="secondary" className="text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Anonymous Voting
                </Badge>
              )}
              <Badge variant="outline" className="text-sm">
                {selectedPoll.totalResponses || 0} Responses
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            {selectedPoll.questions.map((question, qIndex) => (
              <Card
                key={qIndex}
                className="border-2 hover:shadow-md transition-shadow"
              >
                <CardHeader className="bg-muted/30">
                  <Label className="text-xl font-semibold flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {qIndex + 1}
                    </span>
                    <span className="flex-1">{question.question}</span>
                  </Label>
                </CardHeader>
                <CardContent className="pt-6">
                  {question.type === "single" && (
                    <RadioGroup
                      value={answers[qIndex]?.toString()}
                      onValueChange={(value) =>
                        handleVote(qIndex, parseInt(value))
                      }
                      className="space-y-3"
                    >
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                          <RadioGroupItem
                            value={optIndex.toString()}
                            id={`q${qIndex}-opt${optIndex}`}
                            className="w-5 h-5"
                          />
                          <Label
                            htmlFor={`q${qIndex}-opt${optIndex}`}
                            className="flex-1 cursor-pointer text-base font-medium"
                          >
                            {typeof option === "string" ? option : option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === "multiple" && (
                    <div className="space-y-3">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={`q${qIndex}-opt${optIndex}`}
                            checked={
                              answers[qIndex]?.includes(optIndex) || false
                            }
                            onCheckedChange={(checked) =>
                              handleMultipleChoice(
                                qIndex,
                                optIndex,
                                checked as boolean
                              )
                            }
                            className="w-5 h-5"
                          />
                          <Label
                            htmlFor={`q${qIndex}-opt${optIndex}`}
                            className="flex-1 cursor-pointer text-base font-medium"
                          >
                            {typeof option === "string" ? option : option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-col gap-4 pt-4">
              {!allQuestionsAnswered && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Info className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Please answer all questions to submit your vote
                  </span>
                </div>
              )}

              <Button
                onClick={handleSubmitClick}
                disabled={submitting || !allQuestionsAnswered}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {submitting ? (
                  <>
                    <span className="animate-pulse">
                      Submitting Your Vote...
                    </span>
                  </>
                ) : (
                  <>
                    <Vote className="w-5 h-5 mr-2" />
                    Submit My Vote
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                Confirm Your Vote
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Are you sure you want to submit this vote? This action cannot be
                undone, and you won't be able to change your answers after
                submission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmSubmitVote}
                disabled={submitting}
                className="bg-primary"
              >
                Yes, Submit Vote
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  const renderResults = () => {
    if (!showResultsDialog || !pollResults) return null;

    return (
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{pollResults.title}</DialogTitle>
            {pollResults.description && (
              <DialogDescription className="text-base">
                {pollResults.description}
              </DialogDescription>
            )}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary" className="text-sm">
                {pollResults.totalResponses || 0} Total Votes
              </Badge>
              <Badge
                className={
                  pollResults.status === "active"
                    ? "bg-green-500"
                    : "bg-gray-500"
                }
              >
                {pollResults.status}
              </Badge>
            </div>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {pollResults.questions?.map((question: any, qIndex: number) => {
              const totalVotes = pollResults.totalResponses || 1;
              return (
                <Card key={qIndex} className="border-2">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-base font-semibold flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                        {qIndex + 1}
                      </span>
                      <span>{question.question}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {question.options.map((option: any, optIndex: number) => {
                      const optionText =
                        typeof option === "string" ? option : option.text;
                      const votes =
                        typeof option === "object" ? option.votes : 0;
                      const percentage =
                        option.percentage ||
                        ((votes / totalVotes) * 100).toFixed(1);

                      return (
                        <div key={optIndex} className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>{optionText}</span>
                            <span className="text-muted-foreground">
                              {votes} votes ({percentage}%)
                            </span>
                          </div>
                          <Progress
                            value={parseFloat(percentage.toString())}
                            className="h-3"
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto p-6">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold">Community Polls & Voting</h1>
            <p className="text-muted-foreground text-lg">
              Participate in community decisions and consultations
            </p>
          </div>
          <PollsSkeleton />
        </div>
      </div>
    );
  }

  if (selectedPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto p-6">{renderVotingInterface()}</div>
      </div>
    );
  }

  // Filter and search polls
  const allPolls = [...activePolls, ...closedPolls];
  const filteredPolls = allPolls.filter((poll) => {
    const matchesSearch =
      poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && poll.status === "active") ||
      (filterStatus === "closed" && poll.status === "closed");
    return matchesSearch && matchesFilter;
  });

  const displayActivePolls = filteredPolls.filter((p) => p.status === "active");
  const displayClosedPolls = filteredPolls.filter((p) => p.status === "closed");

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
                <Vote className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow leading-tight">
                  Community Polls
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Participate in voting & consultations
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

      <div className="container mx-auto px-6 max-w-6xl space-y-8 pb-10">
        {/* Search and Filter Bar */}
        <div
          className="flex flex-col md:flex-row gap-4 md:items-center animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
            <Input
              type="text"
              placeholder="Search polls by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 text-base border-2 border-blue-200 shadow-sm focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              className="btn-scale whitespace-nowrap"
              size="sm"
            >
              All ({allPolls.length})
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              onClick={() => setFilterStatus("active")}
              className="btn-scale whitespace-nowrap"
              size="sm"
            >
              <Clock className="h-4 w-4 mr-2" />
              Active ({activePolls.length})
            </Button>
            <Button
              variant={filterStatus === "closed" ? "default" : "outline"}
              onClick={() => setFilterStatus("closed")}
              className="btn-scale whitespace-nowrap"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Closed ({closedPolls.length})
            </Button>
          </div>
        </div>

        {/* Active Polls */}
        {(filterStatus === "all" || filterStatus === "active") && (
          <div
            className="space-y-6 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-3xl font-semibold">Active Polls</h2>
              <Badge
                variant="secondary"
                className="text-base px-3 py-1 shadow-sm"
              >
                {displayActivePolls.length}
              </Badge>
            </div>

            {displayActivePolls.length === 0 ? (
              <Card className="border-2 shadow-lg">
                <CardContent className="py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Vote className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">
                    No Active Polls
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    {searchQuery
                      ? `No polls match "${searchQuery}"`
                      : "There are currently no active polls. Check back later for community consultations."}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="mt-6"
                    >
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {displayActivePolls.map((poll, index) => {
                  const hasVoted = poll.hasVoted || false;
                  const canVote = poll.canVote !== false;
                  const voteEndedReason = poll.voteEndedReason;

                  return (
                    <Card
                      key={poll._id}
                      className="card-interactive hover-lift cursor-pointer border-2 border-blue-200 hover:border-blue-500 hover:shadow-2xl group animate-fade-in transition-all overflow-hidden relative bg-white/80 backdrop-blur-sm"
                      onClick={() => !hasVoted && setSelectedPoll(poll)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-blue-400/10 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-300/5 to-blue-300/5 rounded-full blur-3xl" />
                      <CardHeader className="relative pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg group-hover:shadow-xl">
                            <Vote className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end items-start">
                            <Badge className="bg-green-500/90 hover:bg-green-600 shadow-sm text-white">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg text-blue-900 group-hover:text-blue-700 transition-colors font-bold leading-tight">
                          {poll.title}
                        </CardTitle>
                        {poll.description && (
                          <CardDescription className="line-clamp-2 text-sm text-blue-600 font-medium mt-2">
                            {poll.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 transition-colors">
                            <p className="text-blue-600 mb-1 font-medium">
                              Questions
                            </p>
                            <p className="font-bold text-lg text-blue-900">
                              {poll.questions.length}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 transition-colors">
                            <p className="text-blue-600 mb-1 font-medium">
                              Responses
                            </p>
                            <p className="font-bold text-lg text-blue-900">
                              {poll.totalResponses || 0}
                            </p>
                          </div>
                        </div>

                        {poll.endDate && (
                          <div className="text-sm p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-amber-800 dark:text-amber-400 flex items-center gap-2 font-medium">
                              <Clock className="h-4 w-4" />
                              Ends:{" "}
                              {new Date(poll.endDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        )}

                        {poll.isAnonymous && (
                          <Badge
                            variant="outline"
                            className="w-full justify-center"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Anonymous Voting
                          </Badge>
                        )}

                        {!canVote && voteEndedReason && (
                          <div className="text-sm p-3 bg-muted rounded-lg border">
                            <p className="text-muted-foreground">
                              {voteEndedReason}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!canVote || hasVoted ? (
                            <Button
                              variant="outline"
                              disabled
                              className="flex-1 h-11 opacity-60 cursor-not-allowed"
                              size="lg"
                              title={
                                hasVoted
                                  ? "You have already voted on this poll"
                                  : "Voting for this poll has ended"
                              }
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              {hasVoted ? "Already Voted" : "Voting Closed"}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                // Extra safety check
                                if (hasVoted || !canVote) {
                                  toast.error(
                                    "You have already voted on this poll"
                                  );
                                  return;
                                }
                                setSelectedPoll(poll);
                                setAnswers(new Array(poll.questions.length));
                              }}
                              className="flex-1 h-11 gradient-user text-white btn-scale"
                              size="lg"
                            >
                              <Vote className="w-5 h-5 mr-2" />
                              Vote Now
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => viewResults(poll)}
                            size="lg"
                            className="h-11 btn-scale"
                          >
                            <BarChart className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Closed Polls (Inactive) */}
        {(filterStatus === "all" || filterStatus === "closed") &&
          displayClosedPolls.length > 0 && (
            <div
              className="space-y-6 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="text-3xl font-semibold">Closed Polls</h2>
                <Badge
                  variant="secondary"
                  className="text-base px-3 py-1 shadow-sm"
                >
                  {displayClosedPolls.length}
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {displayClosedPolls.map((poll, index) => (
                  <Card
                    key={poll._id}
                    className="card-interactive hover-lift border-2 opacity-90 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
                          <Vote className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex gap-2 items-start">
                          <Badge variant="secondary" className="shadow-sm">
                            Closed
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl leading-tight mb-2">
                        {poll.title}
                      </CardTitle>
                      {poll.description && (
                        <CardDescription className="line-clamp-2 text-base">
                          {poll.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-muted-foreground mb-1">
                            Responses
                          </p>
                          <p className="font-bold text-lg">
                            {poll.totalResponses || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-muted-foreground mb-1">
                            Questions
                          </p>
                          <p className="font-bold text-lg">
                            {poll.questions.length}
                          </p>
                        </div>
                      </div>

                      {poll.endDate && (
                        <div className="text-sm p-3 bg-muted/50 rounded-lg border mb-4">
                          <p className="text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Closed:{" "}
                              {new Date(poll.endDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => viewResults(poll)}
                        className="w-full h-11 btn-scale"
                        size="lg"
                      >
                        <BarChart className="w-5 h-5 mr-2" />
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Results Dialog */}
      {renderResults()}
    </div>
  );
};

export default Polls;
