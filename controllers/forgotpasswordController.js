// ── ADD THESE TO YOUR authController.js ──────────────────────────────────────

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
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Return success anyway to avoid leaking whether an email exists
            return res.json({ message: "Reset link has been sent to your registered email." });
        }

        console.log("user :", user);

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = Date.now() + 1000 * 60 * 60; // 1 hour from now

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
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false   // ← fixes the self-signed certificate error
            },
        });
        // console.log("transporter :", transporter)

        await transporter.sendMail({
            from: `"CPMS" <${process.env.MAIL_USER}>`,
            to: user.email,
            subject: "Reset Your Password – CPMSr",
            html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px">
          <h2 style="margin-bottom:8px;color:#818cf8">CPMS</h2>
          <p style="color:#94a3b8;margin-bottom:24px">Hi ${user.fullname}, we received a request to reset your password.</p>
          <a href="${resetLink}"
             style="display:inline-block;background:#6366f1;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:700;letter-spacing:.05em">
            Reset Password
          </a>
          <p style="color:#475569;font-size:12px;margin-top:24px">
            This link expires in <strong>1 hour</strong>.<br/>
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
        });

        res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (err) {
        console.error("forgotPassword error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


// const forgotPassword = (req, res) => {
//     res.json({ message: "If that email exists, a reset link has been sent." });
// }

// POST /api/auth/reset-password/:token
// Body: { password }
const resetPassword = async (req, res) => {
    try {

        console.log("resetPassword",resetPassword)
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }, // token must not be expired
        });

        console.log("token",token)
        console.log("password :",password)
        console.log("user :",user)

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset link." });
        }

        // Hash the new password
        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        user.resetPasswordToken = undefined; // clear token
        user.resetPasswordExpiry = undefined;
        await user.save();

        res.json({ message: "Password reset successful. You can now log in." });
    } catch (err) {
        console.error("resetPassword error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { forgotPassword, resetPassword };