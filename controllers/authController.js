const jwt = require("jsonwebtoken");
const User = require("../models/user");
const CollegeStudent = require("../models/collegeStudent.js"); // Import the master list
const bcrypt = require("bcrypt");
const useragent = require("useragent");
const { NotificationService } = require("../services/notificationService.js");
const { emitToUser, emitToRole } = require("../socket/socketManager");

// Define your college configuration
const COLLEGE_CONFIG = {
  emailDomain: "university.edu", // Only allow @university.edu
  autoApproveStudents: true,
};

// Define your college configuration

/**
 * @route   POST /api/auth/register/student
 */
const studentRegister = async (req, res) => {
  try {
    const { name, email, password, department, enrollmentNumber } = req.body;

    // 1. Domain Validation
    if (!email.endsWith(`@${COLLEGE_CONFIG.emailDomain}`)) {
      return res.status(403).json({
        message: `Unauthorized email domain. Use your institutional @${COLLEGE_CONFIG.emailDomain} address.`,
      });
    }

    // 2. Cross-reference with Master List (The "Collage Check")
    const isMasterListed = await CollegeStudent.findOne({
      enrollmentNumber: enrollmentNumber.trim(),
    });

    if (!isMasterListed) {
      return res.status(403).json({
        message:
          "Enrollment Number not found in our institutional records. Please contact the Registrar Office.",
      });
    }
    // Now check if department matches for THAT SAME student
    if (isMasterListed.department !== department) {
      return res.status(403).json({
        message:
          "Department does not match institutional records for this Enrollment Number.",
      });
    }
    // 3. Prevent duplicate account for same Enrollment Number
    const existingEnrollment = await User.findOne({
      "profile.enrollmentNumber": enrollmentNumber,
    });
    if (existingEnrollment) {
      return res.status(400).json({
        message:
          "An account is already associated with this Enrollment Number.",
      });
    }

    // 4. Standard uniqueness check
    let user = await User.findOne({ email });
    if (user)
      return res.status(400).json({ message: "Email already registered." });

    // 5. Create the account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      status: "APPROVED",
      profile: {
        department,
        enrollmentNumber,
        gradYear: new Date().getFullYear().toString(),
      },
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Institutional identity verified. Registration complete.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/auth/register/company
 */
const companyRegister = async (req, res) => {
  try {
    const { name, email, password, hrName, industry, website } = req.body;

    let user = await User.findOne({ email });
    if (user)
      return res
        .status(400)
        .json({ message: "Corporate email already in use." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "COMPANY",
      status: "PENDING", // Must be approved by Admin
      profile: {
        hrName,
        industry,
        website,
      },
    });
    console.log("Company data registrare : ", newUser);

    await newUser.save();

    if (newUser.role === "COMPANY") {
      try {
        const adminNotifs = await NotificationService.companyRegistered({
          company: newUser,
        });
        adminNotifs.forEach((n) => emitToRole("ADMIN", n));
      } catch (err) {
        console.error("Notification error:", err);
      }
    }

    res.status(201).json({
      success: true,
      message:
        "Corporate registration received. Pending administrative approval.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * @route   POST /api/auth/login
 *
 * Netflix-style single session logic:
 *
 * CASE A — No existing session → login normally.
 * CASE B — Existing session found AND request includes confirmTakeover: true
 *           → kick old session via socket, then login.
 * CASE C — Existing session found, no confirmTakeover flag
 *           → return 409 with existing device info so frontend can show
 *             "Someone is already logged in on Chrome / Windows. Continue?"
 */
const login = async (req, res) => {
  try {
    const { email, password, role, confirmTakeover } = req.body;

    // 1 Required fields check
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required.",
      });
    }

    // 2 Validate role value
    const allowedRoles = ["STUDENT", "COMPANY", "ADMIN"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected.",
      });
    }

    // 3 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    // 4 Check role match
    if (user.role !== role) {
      return res.status(400).json({
        message: "Invalid credentials for selected role.",
      });
    }

    if (user.status === "PENDING") {
      return res
        .status(403)
        .json({ message: "Your account is awaiting administrator approval." });
    }

    if (user.status === "REJECTED") {
      return res
        .status(403)
        .json({ message: "Your application was rejected by admin." });
    }

    // 5 Check approval
    if (user.status !== "APPROVED") {
      return res.status(403).json({ message: "Account access restricted." });
    }

    // 6 Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password.",
      });
    }

    // ── SESSION CONFLICT CHECK (Netflix logic) ────────────────────────────────
    const INACTIVE_LIMIT_MS = 15 * 60 * 1000;
    const now = new Date();
    user.sessions = user.sessions.filter(
      (s) => now - new Date(s.lastActive) < INACTIVE_LIMIT_MS, // 15 min
    );
    const existingSession = user.sessions.length > 0 ? user.sessions[0] : null;

    if (existingSession && !confirmTakeover) {
      // Tell the frontend someone is already logged in — let it ask the user
      return res.status(409).json({
        message: "SESSION_CONFLICT",
        existingSession: {
          device: existingSession.device,
          browser: existingSession.browser,
          ip: existingSession.ip,
          lastActive: existingSession.lastActive,
        },
      });
    }

    // If confirmTakeover === true, kick the existing session via socket first
    if (existingSession && confirmTakeover) {
      emitToUser(user._id.toString(), {
        type: "SESSION_KICKED",
        message:
          "Your session was ended because someone logged in from another device.",
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 7 Generate token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || "PLACEMENT_PRO_SECRET_KEY",
      { expiresIn: "24h" },
    );

    //  Device detection
    const agent = useragent.parse(req.headers["user-agent"]);

    const deviceInfo = {
      token,
      device: agent.device.toString(), // mobile / desktop
      browser: agent.toAgent(),
      ip: req.ip,
      lastActive: new Date(),
    };

    // Replace old sessions (single login)
    user.sessions = [deviceInfo];
    await user.save();

    // 8 Remove password before sending
    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
      sessions: user.sessions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Active Sessions:
// - Chrome on Windows (Ahmedabad)
// - Mobile Chrome (Android)
const getMySessions = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(
    user.sessions.map((s) => ({
      device: s.device,
      browser: s.browser,
      ip: s.ip,
      lastActive: s.lastActive,
    })),
  );
};

// API: Logout Specific Session
// const logoutSingleSession = async (req, res) => {
//   try {
//     const { userId, token } = req.body;
//     const user = await User.findById(userId);
//     user.sessions = user.sessions.filter((s) => s.token !== token);
//     await user.save();
//     res.json({
//       message: "Session removed",
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

/**
 * @route   POST /api/auth/logout
 * Logout the currently authenticated user's session.
 */
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = await User.findById(req.user.id);
    console.log("logout user before : ", user);
    user.sessions = user.sessions.filter((s) => s.token !== token);
    console.log("logout user after : ", user);
    await user.save();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/auth/admin/force-logout/:userId   (Admin only)
 * Force logout a user from all devices.
 */
const forceLogoutUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, {
      sessions: [],
    });

    // Notify the kicked user in real time
    emitToUser(userId, {
      type: "SESSION_KICKED",
      message: "You have been logged out by an administrator.",
    });

    res.json({
      message: "User logged out from all devices",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/auth/ping
 *
 * Called by the frontend every ~4 minutes while the user is active.
 * The authMiddleware already updates lastActive on EVERY request,
 * so this endpoint only needs to exist as a lightweight target.
 * Do NOT duplicate the lastActive update here.
 */
const ping = async (req, res) => {
  // authMiddleware already updated lastActive — just confirm the session is alive.
  res.json({ message: "Session active" });
};
// const ping = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     const token = req.headers.authorization.split(" ")[1];
//     const session = user.sessions.find((s) => s.token === token);
//     if (!session) {
//       return res.status(401).json({ message: "Session not found" });
//     }

//     //  update last active time
//     session.lastActive = new Date();
//     await user.save();
//     res.json({ message: "Session active" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const getUser = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      count: users.length,
      users,
      message: "user found",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    res.status(200).json({ user: user, message: "User id Found" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Only allowed fields
    const allowedUpdates = ["name", "password", "profile"];
    const updates = {};

    for (let key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Hash password if provided
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  studentRegister,
  companyRegister,
  login,
  logout,
  getUser,
  updateMyProfile,
  deleteUser,
  getUserById,
  getMySessions,
  forceLogoutUser,
  ping,
};
