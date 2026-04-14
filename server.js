const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const studentRoutes = require("./routes/studentRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const statsRoutes = require("./routes/statsRoutes");
const contactRoutes = require("./routes/contactRoutes");

// ── NEW: Notification imports ──────────────────────────────────────────────
const notificationRoutes = require("./routes/notificationRoutes");
const { initSocket } = require("./socket/socketManager");
// ───────────────────────────────────────────────────────────────────────────

const Job = require("./models/job");

const app = express();
const port = process.env.PORT;

// const corsOptions = {`
//     origin: '*',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
// };
// app.use(cors(corsOptions));

app.use(
  cors({
    origin: "*", // for dev only
    credentials: true,
  }),
);
//
// app.use(cors({
//   origin: "https://cpms-job.vercel.app",
//   credentials: true,
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats",statsRoutes);
app.use("/api/notifications", notificationRoutes); // add before httpServer
app.use("/api/", contactRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ── NEW: Use http.createServer so Socket.io can share the server ───────────
const httpServer = http.createServer(app);
initSocket(httpServer); // Initialize Socket.io
// ───────────────────────────────────────────────────────────────────────────

const closeExpiredJobs = async () => {
  try {
    const today = new Date();
    await Job.updateMany(
      { deadline: { $lt: today }, status: "Open" },
      { status: "Closed" },
    );
    console.log("Expired jobs closed");
  } catch (error) {
    console.log("Error closing expired jobs:", error);
  }
};

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB Connected");

    // Run once
    closeExpiredJobs();

    // Run every hour
    setInterval(closeExpiredJobs, 60 * 60 * 1000);

    // Start server AFTER DB connected
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Running server on http://localhost:${port}/`);
    });
  })
  .catch((err) => console.error("MongoDB Error :", err));
// mongoose
//   .connect(process.env.MONGO_URL)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error("MongoDB Error :", err));
// mongoose
//   .connect(process.env.MONGO_URL)
//   .then(() => {
//     console.log("MongoDB Connected");

//     closeExpiredJobs(); // run once
//     setInterval(closeExpiredJobs, 60 * 60 * 1000); // run every hour
//   })
//   .catch((err) => console.error("MongoDB Error :", err));

// httpServer.listen(port, () => {
//   console.log(`Running server on http://localhost:${port}/`);
// });

// const port = 3000;
// app.listen(port, "0.0.0.0", () => {
//   console.log(`Running server on http://localhost:${port}/`);
// });
