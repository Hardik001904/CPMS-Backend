// // routes/auth.js
// const express = require("express");
// const router = express.Router();
// const crypto = require("crypto");
// const bcrypt = require("bcryptjs");
// const nodemailer = require("nodemailer");
// const User = require("../models/user"); // adjust path to your User model

// // ─── In-memory OTP store (replace with Redis in production) ─────────────────
// // Structure: { email: { otp, expiresAt, resetToken, resetTokenExpiresAt } }
// const otpStore = new Map();
// // service: "gmail",
// //       host: "smtp.gmail.com",
// //       port: 587,
// //       secure: false, // true for 465, false for 587
// // ─── Nodemailer transporter ──────────────────────────────────────────────────
// // const transporter = nodemailer.createTransport({
// //   host: "smtp.gmail.com",
// //   port: 587,
// //   secure: false,
// //   auth: {
// //     user: process.env.EMAIL_USER,
// //     pass: process.env.EMAIL_PASS, // use an App Password for Gmail
// //   },
// // });

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // ─── Helper: generate 6-digit OTP ───────────────────────────────────────────
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // ─── POST /auth/forgot-password ─────────────────────────────────────────────
// // Accepts: { email }
// // Sends OTP to the registered email
// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required." });
//     }

//     const user = await User.findOne({ email: email.toLowerCase().trim() });

//     // Always respond with success to prevent email enumeration
//     if (!user) {
//       return res.status(200).json({
//         message: "If this email is registered, an OTP has been sent.",
//       });
//     }

//     // Generate OTP and store it (expires in 10 minutes)
//     const otp = generateOTP();
//     const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min

//     otpStore.set(email.toLowerCase().trim(), { otp, expiresAt });

//     // Send email
//     await transporter.sendMail({
//       from: `"Support" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Your Password Reset OTP",
//       html: `
//         <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
//           <h2 style="color: #1f2937; margin-bottom: 8px;">Password Reset OTP</h2>
//           <p style="color: #6b7280; font-size: 14px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
//           <div style="margin: 24px 0; text-align: center;">
//             <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #4f46e5; background: #ede9fe; padding: 16px 28px; border-radius: 8px;">
//               ${otp}
//             </span>
//           </div>
//           <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
//         </div>
//       `,
//     });

//     return res.status(200).json({
//       message: "If this email is registered, an OTP has been sent.",
//     });
//   } catch (err) {
//     console.error("forgot-password error:", err);
//     return res.status(500).json({ message: "Internal server error." });
//   }
// };

// // ─── POST /auth/verify-otp ───────────────────────────────────────────────────
// // Accepts: { email, otp }
// // Returns: { resetToken } — short-lived token used in reset-password route
// const verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({ message: "Email and OTP are required." });
//     }

//     const record = otpStore.get(email.toLowerCase().trim());

//     if (!record) {
//       return res
//         .status(400)
//         .json({ message: "OTP not found. Please request a new one." });
//     }

//     if (Date.now() > record.expiresAt) {
//       otpStore.delete(email.toLowerCase().trim());
//       return res
//         .status(400)
//         .json({ message: "OTP has expired. Please request a new one." });
//     }

//     if (record.otp !== otp.trim()) {
//       return res
//         .status(400)
//         .json({ message: "Invalid OTP. Please try again." });
//     }

//     // OTP is valid — generate a short-lived reset token (15 min)
//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");
//     const resetTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 min

//     // Store hashed token alongside the email record
//     otpStore.set(email.toLowerCase().trim(), {
//       ...record,
//       otp: null, // invalidate OTP after use
//       resetToken: hashedToken,
//       resetTokenExpiresAt,
//     });

//     return res.status(200).json({
//       message: "OTP verified successfully.",
//       resetToken, // send plain token to client; store hashed on server
//     });
//   } catch (err) {
//     console.error("verify-otp error:", err);
//     return res.status(500).json({ message: "Internal server error." });
//   }
// };

// // ─── POST /auth/reset-password/:token ───────────────────────────────────────
// // Accepts: { password }
// // :token is the plain reset token returned from verify-otp
// const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     if (!password || password.length < 6) {
//       return res
//         .status(400)
//         .json({ message: "Password must be at least 6 characters." });
//     }

//     // Hash the incoming token and look it up
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     // Find the matching email in the OTP store
//     let matchedEmail = null;
//     for (const [email, record] of otpStore.entries()) {
//       if (record.resetToken === hashedToken) {
//         matchedEmail = email;
//         break;
//       }
//     }

//     if (!matchedEmail) {
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired reset link." });
//     }

//     const record = otpStore.get(matchedEmail);

//     if (Date.now() > record.resetTokenExpiresAt) {
//       otpStore.delete(matchedEmail);
//       return res
//         .status(400)
//         .json({ message: "Reset link has expired. Please start over." });
//     }

//     // Update the user's password
//     const user = await User.findOne({ email: matchedEmail });
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     const salt = await bcrypt.genSalt(12);
//     user.password = await bcrypt.hash(password, salt);
//     await user.save();

//     // Clean up the OTP store entry
//     otpStore.delete(matchedEmail);

//     return res.status(200).json({ message: "Password reset successfully." });
//   } catch (err) {
//     console.error("reset-password error:", err);
//     return res.status(500).json({ message: "Internal server error." });
//   }
// };

// module.exports = { forgotPassword, verifyOtp, resetPassword };

// ── claude code──────────────────────────────────────

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const User = require("../models/user"); // adjust path as needed

// ── Add these two fields to your UserSchema ──────────────────────────────────
// resetPasswordToken : { type: String },
// resetPasswordExpiry: { type: Date  },
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/forgot-password
// Body: { email }

// ─── In-memory OTP store (replace with Redis in production) ─────────────────
// Structure: { email: { otp, expiresAt, resetToken, resetTokenExpiresAt } }
const otpStore = new Map();

// ─── Helper: generate 6-digit OTP ───────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to avoid leaking whether an email exists
      return res.json({
        message: "Reset link has been sent to your registered email.",
      });
    }

    console.log("user :", user);

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 1000 * 60 * 60; // 1 hour from now

    // Generate OTP and store it (expires in 10 minutes)
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min

    otpStore.set(email.toLowerCase().trim(), { otp, expiresAt });

    user.resetPasswordToken = token;
    user.resetPasswordExpiry = expiry;
    // console.log("resetPasswordToken :", token)
    // console.log("resetPasswordExpiry :", expiry)
    await user.save();

    // Build the reset link (adjust FRONTEND_URL in your .env)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // ── Nodemailer setup ─────────────────────────────────────────────────────
    // Add to .env:  MAIL_USER=you@gmail.com   MAIL_PASS=your_app_password
    // const transporter = nodemailer.createTransport({
    //     service: "gmail",
    //     auth: {
    //         user: process.env.MAIL_USER,
    //         pass: process.env.MAIL_PASS,
    //     },
    // });
    const transporter = nodemailer.createTransport({
      // service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // ← fixes the self-signed certificate error
      },
    });
    // console.log("transporter :", transporter)

    await transporter.sendMail({
      from: `"CPMS" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Password – CPMSr",
      html: `<div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1f2937; margin-bottom: 8px;">Password Reset OTP</h2>
          <p style="color: #6b7280; font-size: 14px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="margin: 24px 0; text-align: center;">
            <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #4f46e5; background: #ede9fe; padding: 16px 28px; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    //   <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px">
    //     <h2 style="margin-bottom:8px;color:#818cf8">CPMS</h2>
    //     <p style="color:#94a3b8;margin-bottom:24px">Hi ${user.fullname}, we received a request to reset your password.</p>
    //     <a href="${resetLink}"
    //        style="display:inline-block;background:#6366f1;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:700;letter-spacing:.05em">
    //       Reset Password
    //     </a>
    //     <p style="color:#475569;font-size:12px;margin-top:24px">
    //       This link expires in <strong>1 hour</strong>.<br/>
    //       If you didn't request this, you can safely ignore this email.
    //     </p>
    //   </div>
    // `,

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// const forgotPassword = (req, res) => {
//     res.json({ message: "If that email exists, a reset link has been sent." });
// }

// router.post("/verify-otp", async (req, res) => {
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const record = otpStore.get(email.toLowerCase().trim());

    if (!record) {
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new one." });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase().trim());
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    if (record.otp !== otp.trim()) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // OTP is valid — generate a short-lived reset token (15 min)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 min

    // Store hashed token alongside the email record
    otpStore.set(email.toLowerCase().trim(), {
      ...record,
      otp: null, // invalidate OTP after use
      resetToken: hashedToken,
      resetTokenExpiresAt,
    });

    return res.status(200).json({
      message: "OTP verified successfully.",
      resetToken, // send plain token to client; store hashed on server
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// POST /api/auth/reset-password/:token
// Body: { password }
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    // Hash the incoming token and look it up
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the matching email in the OTP store
    let matchedEmail = null;
    for (const [email, record] of otpStore.entries()) {
      if (record.resetToken === hashedToken) {
        matchedEmail = email;
        break;
      }
    }

    if (!matchedEmail) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link." });
    }

    const record = otpStore.get(matchedEmail);

    if (Date.now() > record.resetTokenExpiresAt) {
      otpStore.delete(matchedEmail);
      return res
        .status(400)
        .json({ message: "Reset link has expired. Please start over." });
    }

    // Update the user's password
    const user = await User.findOne({ email: matchedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Clean up the OTP store entry
    otpStore.delete(matchedEmail);

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
  // try {
  //   console.log("resetPassword", resetPassword);
  //   const { token } = req.params;
  //   const { password } = req.body;

  //   const user = await User.findOne({
  //     resetPasswordToken: token,
  //     resetPasswordExpiry: { $gt: Date.now() }, // token must not be expired
  //   });

  //   console.log("token", token);
  //   console.log("password :", password);
  //   console.log("user :", user);

  //   if (!user) {
  //     return res
  //       .status(400)
  //       .json({ message: "Invalid or expired reset link." });
  //   }

  //   // Hash the new password
  //   const hashed = await bcrypt.hash(password, 10);
  //   user.password = hashed;
  //   user.resetPasswordToken = undefined; // clear token
  //   user.resetPasswordExpiry = undefined;
  //   await user.save();

  //   res.json({ message: "Password reset successful. You can now log in." });
  // } catch (err) {
  //   console.error("resetPassword error:", err);
  //   res.status(500).json({ message: "Server error" });
  // }
};

module.exports = { forgotPassword, resetPassword, verifyOtp };

// Second code
// const crypto = require("crypto");
// const bcrypt = require("bcrypt");
// const { Resend } = require("resend"); // ← swap nodemailer for resend
// const User = require("../models/user");
// console.log("my file  : ",process.env.RESEND_API_KEY);

// const resend = new Resend(process.env.RESEND_API_KEY); // ← initialize once
// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.json({
//         message: "Reset link has been sent to your registered email.",
//       });
//     }

//     // Token generation — unchanged
//     const token = crypto.randomBytes(32).toString("hex");
//     const expiry = Date.now() + 1000 * 60 * 60;
//     user.resetPasswordToken = token;
//     user.resetPasswordExpiry = expiry;
//     await user.save();

//     const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

//     // from: "CPMS <onboarding@resend.dev>", // free sender, no domain needed
//     // ── Resend (replaces nodemailer entirely) ──────────────────────────────
//     await resend.emails.send({
//       from: "CPMS <onboarding@resend.dev>", // free sender, no domain needed
//       to: user.email,
//       subject: "Reset Your Password – CPMS",
//       html: `
//         <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px">
//           <h2 style="margin-bottom:8px;color:#818cf8">CPMS</h2>
//           <p style="color:#94a3b8;margin-bottom:24px">Hi ${user.name}, we received a request to reset your password.</p>
//           <a href="${resetLink}"
//              style="display:inline-block;background:#6366f1;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:700;letter-spacing:.05em">
//             Reset Password
//           </a>
//           <p style="color:#475569;font-size:12px;margin-top:24px">
//             This link expires in <strong>1 hour</strong>.<br/>
//             If you didn't request this, you can safely ignore this email.
//           </p>
//         </div>
//       `,
//     });
//     // ──────────────────────────────────────────────────────────────────────

//     res.json({ message: "If that email exists, a reset link has been sent." });
//   } catch (err) {
//     console.error("forgotPassword error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // resetPassword stays exactly the same — no changes needed
// const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpiry: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired reset link." });
//     }

//     const hashed = await bcrypt.hash(password, 10);
//     user.password = hashed;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpiry = undefined;
//     await user.save();

//     res.json({ message: "Password reset successful. You can now log in." });
//   } catch (err) {
//     console.error("resetPassword error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = { forgotPassword, resetPassword };
