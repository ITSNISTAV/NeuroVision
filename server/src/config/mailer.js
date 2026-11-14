const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

async function sendWelcomeEmail(toEmail, userName) {
  const mailOptions = {
    from: `"NeuroVision" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '👋 Welcome to NeuroVision!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #ffffff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 40px 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">✦ NeuroVision</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">Map Your Career DNA</p>
        </div>
        <div style="padding: 36px 32px;">
          <h2 style="margin: 0 0 12px; font-size: 22px;">Hey ${userName} 👋</h2>
          <p style="color: #c4b5fd; margin: 0 0 20px; line-height: 1.7;">
            You just signed in to <strong style="color: #ffffff;">NeuroVision</strong>. Welcome back! We're glad you're here.
          </p>
          <p style="color: #a1a1aa; line-height: 1.7; margin: 0 0 28px;">
            Your skill profile is ready and waiting. Keep tracking your progress, close those skill gaps, and stay on top of your career game.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="http://localhost:3000/skills.html"
               style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff;
                      text-decoration: none; padding: 14px 36px; border-radius: 50px;
                      font-weight: 600; font-size: 15px; display: inline-block;">
              Go to Dashboard →
            </a>
          </div>
          <p style="color: #52525b; font-size: 13px; text-align: center; margin: 0;">
            If this wasn't you, please ignore this email or contact support.
          </p>
        </div>
        <div style="border-top: 1px solid #1e1e2e; padding: 20px 32px; text-align: center;">
          <p style="color: #3f3f46; font-size: 12px; margin: 0;">© 2025 NeuroVision. All rights reserved.</p>
        </div>
      </div>
    `
  }
  await transporter.sendMail(mailOptions)
}

async function sendResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"NeuroVision" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔑 Reset your NeuroVision password',
    html: `<div style="font-family:Arial;background:#0f0f1a;color:#fff;padding:40px;border-radius:16px;max-width:600px;margin:auto">
      <h2 style="color:#a855f7">Reset your password</h2>
      <p style="color:#c4b5fd;margin:16px 0">Click the button below. Link expires in 1 hour.</p>
      <a href="${resetLink}" style="background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;padding:12px 32px;border-radius:50px;text-decoration:none;font-weight:600;display:inline-block">Reset Password →</a>
      <p style="color:#52525b;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
    </div>`
  })
}

module.exports = { sendWelcomeEmail, sendResetEmail }