const nodemailer = require('nodemailer');
const config = require('../config');

// A Nodemailer "transporter" is the object that actually talks to Gmail.
// We build it once and reuse it, instead of reconnecting on every email.
let transporter = null;

// Returns true only when every SMTP setting is filled in.
// We check this so the app can start (and login still work) even when the
// student has not added their Gmail App Password yet.
const isEmailConfigured = () =>
  Boolean(config.emailHost && config.emailUser && config.emailPassword);

// Builds (and caches) the Gmail SMTP transporter.
const getTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error('Email is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in server/.env');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.emailHost,
      port: Number(config.emailPort) || 587,
      secure: false, // false because we use STARTTLS on port 587
      auth: {
        user: config.emailUser,
        pass: config.emailPassword, // the Google App Password
      },
    });
  }

  return transporter;
};

// Builds the plain-text OTP email body.
// Keeping the template in one place makes it easy to change later.
const buildOtpEmail = (otp) => `Hello,

We received a request to reset your WeaveConnect password.

Your OTP is:

${otp}

This OTP is valid for 10 minutes.

If you did not request a password reset, you can ignore this email.

Regards,
WeaveConnect Team`;

// Sends the OTP email to the user.
// `to` is the address the user typed in, and `from` is EMAIL_FROM from the .env file.
const sendOtpEmail = async (to, otp) => {
  const mail = getTransporter();

  const info = await mail.sendMail({
    from: config.emailFrom || config.emailUser,
    to,
    subject: 'WeaveConnect Password Reset OTP',
    text: buildOtpEmail(otp),
  });

  // NOTE: we deliberately never log the OTP or the email password, so
// secrets can never leak into the terminal or a log file.
  console.log('[email] OTP email sent, message id:', info.messageId);
  return info;
};

module.exports = { sendOtpEmail, isEmailConfigured };
