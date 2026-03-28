const express = require("express");
const mongoose = require("mongoose");
// const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const studentRoutes = require("./routes/studentRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const  dotenv  = require("dotenv");

// dotenv.config();
dotenv.config();

const app = express();
const port = process.env.PORT;

// const corsOptions = {
//     origin: '*',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
// };
// app.use(cors(corsOptions));

// app.use(cors({
//   origin: "*", // for dev only
//   credentials: true,
// }));

app.use(cors({
  origin: "https://cpms-job.vercel.app",
  credentials: true,
}));

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use("/user", userRoutes);
// app.use("/company", companyRoutes);
// app.use("/job", jobRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use("/api/company", companyRoutes);
app.use('/api/applications', applicationRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
// app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error :", err));

// const port = 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Running server on http://localhost:${port}/`);
});
