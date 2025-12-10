import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import incidentRoutes from "./routes/incidents";
import documentRoutes from "./routes/documents";
import adminRoutes from "./routes/admin";
import smsRoutes from "./routes/sms";
import pollRoutes from "./routes/polls";
import notificationRoutes from "./routes/notifications";
import announcementRoutes from "./routes/announcements";
import statsRoutes from "./routes/stats";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);
const NODE_ENV: string = process.env.NODE_ENV || "development";

// Enable trailing slash handling
app.set("strict routing", false);

// Connect to MongoDB with error handling
connectDB().catch((error) => {
  console.error("MongoDB connection failed:", error.message);
  console.log("Starting server anyway - API will work without database");
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Make upload available to routes via middleware
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/stats", statsRoutes);

// Root endpoint - API documentation
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "BarangayConnect Hub API Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      incidents: "/api/incidents",
      documents: "/api/documents",
      admin: "/api/admin",
      sms: "/api/sms",
      polls: "/api/polls",
      notifications: "/api/notifications",
      announcements: "/api/announcements",
      stats: "/api/stats/public",
    },
    documentation: "Available at /api/docs",
  });
});

// API root endpoint - same as root
app.get("/api", (req: Request, res: Response) => {
  res.json({
    message: "BarangayConnect Hub API Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      incidents: "/api/incidents",
      documents: "/api/documents",
      admin: "/api/admin",
      sms: "/api/sms",
      polls: "/api/polls",
      notifications: "/api/notifications",
      announcements: "/api/announcements",
      stats: "/api/stats/public",
    },
    documentation: "Available at /api/docs",
  });
});

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableEndpoints: {
      root: "GET /",
      health: "GET /api/health",
      auth: "GET/POST /api/auth/*",
      incidents: "GET/POST /api/incidents/*",
      documents: "GET/POST /api/documents/*",
      admin: "GET/POST /api/admin/*",
      sms: "GET/POST /api/sms/*",
      polls: "GET/POST /api/polls/*",
      notifications: "GET/POST /api/notifications/*",
      announcements: "GET/POST /api/announcements/*",
      stats: "GET /api/stats/public",
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", {
    message: err.message,
    stack: NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 API URL: http://0.0.0.0:${PORT}/api`);
  console.log(
    `🌐 Local Network: http://192.168.x.x:${PORT}/api (replace x.x with your IP)`
  );
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
