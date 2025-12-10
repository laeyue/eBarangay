import express from "express";
import Poll from "../models/Poll";
import User from "../models/User";
import Notification from "../models/Notification";
import { protect, admin, optionalAuth } from "../middleware/auth";

const router = express.Router();

/**
 * @route   POST /api/polls
 * @desc    Create new poll/voting
 * @access  Admin
 */
router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      questions,
      startDate,
      endDate,
      isAnonymous,
    } = req.body;

    // Transform questions to ensure options are in correct format
    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      type: q.type || "single",
      options: Array.isArray(q.options)
        ? q.options.map((opt) =>
            typeof opt === "string" ? { text: opt, votes: 0 } : opt
          )
        : [],
    }));

    const poll = await Poll.create({
      title,
      description,
      type: type || "poll",
      questions: formattedQuestions,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAnonymous: isAnonymous || false,
      createdBy: req.user._id,
      status: "active", // Auto-activate new polls
    });

    // Create notifications for all users about new poll
    const allUsers = await User.find({
      role: "user",
    }).select("_id");
    const userIds = allUsers.map((u) => u._id);

    if (userIds.length > 0) {
      await Notification.createForUsers(userIds, {
        type: "poll",
        title: "New Poll Available",
        message: `New poll "${title}" is now available. Your voice matters!`,
        priority: "medium",
        relatedEntityType: "poll",
        relatedEntityId: poll._id,
        actionUrl: "/polls",
      });
    }

    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/polls
 * @desc    Get all polls (Admin gets all including deleted, users get active only)
 * @access  Public/Protected
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const includeDeleted = req.query.includeDeleted === "true";

    // Cleanup: Mark all unread notifications for closed polls as read
    try {
      const closedPollIds = await Poll.find({
        status: "closed",
        isDeleted: false,
      }).select("_id");

      if (closedPollIds.length > 0) {
        const pollIds = closedPollIds.map((p) => p._id);
        const result = await Notification.updateMany(
          {
            relatedEntityId: { $in: pollIds },
            relatedEntityType: "poll",
            read: false,
          },
          { read: true, readAt: new Date() }
        );
        if (result.modifiedCount > 0) {
          console.log(
            `🧹 Cleaned up ${result.modifiedCount} unread notifications for closed polls`
          );
        }
      }
    } catch (cleanupError) {
      console.error("Error in cleanup:", cleanupError);
    }

    // Auto-close polls that have passed their endDate
    const closedPolls = await Poll.find({
      status: "active",
      endDate: { $lt: new Date() },
      isDeleted: false,
    }).select("_id");

    if (closedPolls.length > 0) {
      await Poll.updateMany(
        {
          status: "active",
          endDate: { $lt: new Date() },
          isDeleted: false,
        },
        {
          status: "closed",
        }
      );

      // Mark notifications for closed polls as read
      const pollIds = closedPolls.map((p) => p._id);
      await Notification.updateMany(
        {
          relatedEntityId: { $in: pollIds },
          relatedEntityType: "poll",
          read: false,
        },
        { read: true, readAt: new Date() }
      );
      console.log(
        `✅ Auto-closed ${closedPolls.length} polls and marked their notifications as read`
      );
    }

    let query = {};

    // If user is not admin, filter based on status
    if (!req.user || req.user.role !== "admin") {
      // Always hide deleted polls from regular users
      query.isDeleted = false;

      // Filter by status if provided
      if (status === "active") {
        query.status = "active";
        query.startDate = { $lte: new Date() };
        query.endDate = { $gte: new Date() };
      } else if (status === "closed") {
        query.status = "closed";
      } else if (status) {
        query.status = status;
      }
    } else {
      // Admin can see all polls
      if (status) {
        query.status = status;
      }
      // Admin can optionally filter out deleted polls
      if (!includeDeleted) {
        query.isDeleted = false;
      }
    }

    const polls = await Poll.find(query)
      .populate("createdBy", "firstName lastName")
      .populate("deletedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    // Add hasVoted status and response count for each poll
    const pollsWithStatus = polls.map((poll) => {
      const pollObj = poll.toObject();
      pollObj.totalResponses = poll.responses.length;

      // Check if current user has voted
      let hasVoted = false;
      let canVote = true;
      let voteEndedReason = null;

      if (req.user) {
        // For anonymous polls, we cannot track if user voted (no userId stored)
        // For named polls, check if user has a response
        if (!poll.isAnonymous) {
          const userResponse = poll.responses.find(
            (r) => r.userId && r.userId.toString() === req.user._id.toString()
          );
          if (userResponse) {
            hasVoted = true;
            canVote = false;
            voteEndedReason = "You have already voted on this poll";
          } else {
            // User has not voted yet
          }
        }
        // For anonymous polls, we cannot prevent double voting on backend
        // This must be enforced on the frontend
      }

      // Check if voting period has ended
      if (poll.endDate && new Date() > new Date(poll.endDate)) {
        canVote = false;
        if (!voteEndedReason) {
          voteEndedReason = "Voting period has ended";
        }
      }

      // Check if poll is not active
      if (poll.status !== "active") {
        canVote = false;
        if (!voteEndedReason) {
          voteEndedReason = "This poll is not currently active";
        }
      }

      pollObj.hasVoted = hasVoted;
      pollObj.canVote = canVote;
      pollObj.voteEndedReason = voteEndedReason;

      // Don't send full responses unless admin
      if (!req.user || req.user.role !== "admin") {
        pollObj.responses = undefined;
      }

      return pollObj;
    });

    const total = await Poll.countDocuments(query);

    res.json({
      polls: pollsWithStatus,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/polls/:id
 * @desc    Get poll details
 * @access  Public
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if current user has already voted
    let hasVoted = false;
    let userVote = null;
    let canVote = true;
    let voteEndedReason = null;

    if (req.user) {
      const existingResponse = poll.responses.find(
        (r) => r.userId && r.userId.toString() === req.user._id.toString()
      );
      if (existingResponse) {
        hasVoted = true;
        userVote = existingResponse.answers;
        canVote = false;
        voteEndedReason = "You have already voted on this poll";
      }
    }

    // Check if voting period has ended
    if (poll.endDate && new Date() > new Date(poll.endDate)) {
      canVote = false;
      if (!voteEndedReason) {
        voteEndedReason = "Voting period has ended";
      }
    }

    // Check if poll is not active
    if (poll.status !== "active") {
      canVote = false;
      if (!voteEndedReason) {
        voteEndedReason = "This poll is not currently active";
      }
    }

    // Convert poll to object and format
    const pollObj = poll.toObject();

    // Don't send individual responses unless admin
    if (!req.user || req.user.role !== "admin") {
      pollObj.responses = undefined;
    }

    // Add hasVoted flag and total response count
    pollObj.hasVoted = hasVoted;
    pollObj.canVote = canVote;
    pollObj.voteEndedReason = voteEndedReason;
    pollObj.userVote = userVote;
    pollObj.totalResponses = poll.responses.length;

    res.json(pollObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/polls/:id/vote
 * @desc    Submit vote/response to poll
 * @access  Protected
 */
router.post("/:id/vote", protect, async (req, res) => {
  try {
    const { answers } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if voting period has ended
    if (poll.endDate && new Date() > new Date(poll.endDate)) {
      return res.status(400).json({ message: "Voting period has ended" });
    }

    if (poll.status !== "active") {
      return res.status(400).json({ message: "Poll is not active" });
    }

    // Check if user already voted (only for non-anonymous polls)
    if (!poll.isAnonymous) {
      const existingResponse = poll.responses.find(
        (r) => r.userId && r.userId.toString() === req.user._id.toString()
      );

      console.log(
        `📊 Checking vote for user ${req.user._id} on poll ${req.params.id}`
      );
      console.log(`   Poll isAnonymous: ${poll.isAnonymous}`);
      console.log(
        `   Existing responses:`,
        poll.responses.map((r: any) => r.userId?.toString())
      );
      console.log(`   Found existing response:`, !!existingResponse);

      if (existingResponse) {
        console.log(`❌ User ${req.user._id} already voted on this poll`);
        return res
          .status(400)
          .json({ message: "You have already voted on this poll" });
      }
    } else {
      console.log(`📊 Anonymous poll - cannot prevent duplicate votes`);
    }

    // Format answers to ensure proper structure
    const formattedAnswers = answers.map((answer, qIndex) => {
      if (typeof answer === "number") {
        // Single choice - convert to selectedOptions array
        return {
          questionIndex: qIndex,
          selectedOptions: [answer],
          textAnswer: null,
        };
      } else if (Array.isArray(answer)) {
        // Multiple choice - already in array format
        return {
          questionIndex: qIndex,
          selectedOptions: answer,
          textAnswer: null,
        };
      } else if (typeof answer === "object" && answer.selectedOptions) {
        // Already properly formatted
        return {
          questionIndex: qIndex,
          selectedOptions: answer.selectedOptions,
          textAnswer: answer.textAnswer || null,
        };
      } else {
        // Text answer or other format
        return {
          questionIndex: qIndex,
          selectedOptions: [],
          textAnswer: String(answer),
        };
      }
    });

    // Add response
    poll.responses.push({
      userId: poll.isAnonymous ? null : req.user._id,
      answers: formattedAnswers,
    });

    // Update vote counts
    formattedAnswers.forEach((answer, qIndex) => {
      if (answer.selectedOptions && poll.questions[qIndex]) {
        answer.selectedOptions.forEach((optionIndex) => {
          if (poll.questions[qIndex].options[optionIndex]) {
            poll.questions[qIndex].options[optionIndex].votes += 1;
          }
        });
      }
    });

    await poll.save();

    // Mark poll notification as read for this user since they voted
    try {
      await Notification.updateMany(
        {
          userId: req.user._id,
          relatedEntityId: poll._id,
          $or: [{ type: "poll" }, { relatedEntityType: "poll" }],
        },
        { read: true, readAt: new Date() }
      );
      console.log(
        `✅ Marked poll notification as read for user ${req.user._id}`
      );
    } catch (notifError) {
      console.log(
        `⚠️ Could not mark notification as read:`,
        notifError.message
      );
    }

    res.json({ message: "Vote submitted successfully", poll });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PATCH /api/polls/:id
 * @desc    Update poll status or details
 * @access  Admin
 */
router.patch("/:id", protect, admin, async (req, res) => {
  try {
    const { status, title, description, endDate } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (status) poll.status = status;
    if (title) poll.title = title;
    if (description) poll.description = description;
    if (endDate) poll.endDate = endDate;

    await poll.save();

    // If poll is being closed, mark its unread notifications as read
    if (status === "closed") {
      await Notification.updateMany(
        {
          relatedEntityId: req.params.id,
          relatedEntityType: "poll",
          read: false,
        },
        { read: true, readAt: new Date() }
      );
      console.log(
        `✅ Marked poll notifications as read for poll ${req.params.id}`
      );
    }

    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/polls/:id/results
 * @desc    Get poll results with participant data
 * @access  Public (after poll ends) or Admin
 */
router.get("/:id/results", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate(
      "responses.userId",
      "firstName lastName email"
    );

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Only show results if poll is closed or user is admin
    if (poll.status !== "closed" && (!req.user || req.user.role !== "admin")) {
      return res.status(403).json({ message: "Results not available yet" });
    }

    const results = {
      title: poll.title,
      description: poll.description,
      status: poll.status,
      totalResponses: poll.responses.length,
      isAnonymous: poll.isAnonymous,
      questions: poll.questions.map((q, qIndex) => ({
        question: q.question,
        type: q.type,
        options: q.options.map((opt) => ({
          text: opt.text,
          votes: opt.votes,
          percentage:
            poll.responses.length > 0
              ? ((opt.votes / poll.responses.length) * 100).toFixed(1)
              : 0,
        })),
      })),
      // Include participant list for admin (if not anonymous)
      participants:
        req.user && req.user.role === "admin" && !poll.isAnonymous
          ? poll.responses
              .filter((r) => r.userId)
              .map((r) => ({
                user: r.userId,
                submittedAt: r.submittedAt,
              }))
          : null,
    };

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/polls/:id
 * @desc    Soft delete poll (for UNDO support)
 * @access  Admin
 */
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Soft delete instead of hard delete
    poll.isDeleted = true;
    poll.deletedAt = new Date();
    poll.deletedBy = req.user._id;
    await poll.save();

    res.json({
      message: "Poll deleted successfully. You can undo this action.",
      poll: {
        _id: poll._id,
        title: poll.title,
        isDeleted: true,
        deletedAt: poll.deletedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/polls/:id/undo
 * @desc    Restore a soft-deleted poll (UNDO functionality)
 * @access  Admin
 */
router.post("/:id/undo", protect, admin, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (!poll.isDeleted) {
      return res.status(400).json({ message: "Poll is not deleted" });
    }

    // Restore the poll
    poll.isDeleted = false;
    poll.deletedAt = null;
    poll.deletedBy = null;
    await poll.save();

    res.json({
      message: "Poll restored successfully",
      poll,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/polls/:id/permanent
 * @desc    Permanently delete poll (cannot be undone)
 * @access  Admin
 */
router.delete("/:id/permanent", protect, admin, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    await poll.deleteOne();
    res.json({ message: "Poll permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
