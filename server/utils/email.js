const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // If no SMTP credentials are configured, log the email to console for dev
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('--- DEV EMAIL (no SMTP configured) ---');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('HTML:');
    console.log(options.html);
    console.log('--- END DEV EMAIL ---');
    return;
  }

  // Build transporter options with flexible config
  const transportOptions = {};

  // If an explicit service is provided (eg: 'gmail'), nodemailer can use it
  if (process.env.EMAIL_SERVICE) {
    transportOptions.service = process.env.EMAIL_SERVICE;
  } else {
    transportOptions.host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    transportOptions.port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
    // If EMAIL_SECURE is set to 'true' use secure, otherwise infer from port 465
    transportOptions.secure = (process.env.EMAIL_SECURE === 'true') || transportOptions.port === 465;
  }

  transportOptions.auth = {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  };

  // Allow relaxed TLS if explicitly requested in env (useful for some dev SMTPs)
  if (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'false') {
    transportOptions.tls = { rejectUnauthorized: false };
  }

  const transporter = nodemailer.createTransport(transportOptions);

  // Verify transporter configuration and credentials before sending
  try {
    await transporter.verify();
    console.log('Email transporter verified');
  } catch (verifyErr) {
    console.error('Email transporter verification failed:', verifyErr && (verifyErr.message || verifyErr));
    // Rethrow so callers can handle the failure and fall back to dev logging if desired
    throw verifyErr;
  }

  // Define email options
  const mailOptions = {
    from: `"Pizza App" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (sendErr) {
    console.error('Error sending email:', sendErr && (sendErr.message || sendErr));
    throw sendErr;
  }
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken) => {
  // Keep the existing link flow but also support sending short numeric codes to the user.
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/verify-email/${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .code { display:block; padding:12px; background:#fff; border-radius:6px; font-size:20px; letter-spacing:4px; text-align:center; margin:12px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Pizza App!</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with Pizza App. You can either click the button below or enter the 6-digit verification code in the app.</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>If you received a code, enter it into the app's verification screen:</p>
          <div class="code">${process.env.VERIFICATION_CODE_PLACEHOLDER || ''}</div>
          <p>This link or code will expire in 10 minutes.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Pizza App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    email,
    subject: 'Verify Your Email - Pizza App',
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset for your Pizza App account. Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Pizza App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    email,
    subject: 'Password Reset - Pizza App',
    html
  });
};

// Send low stock alert to admin
const sendLowStockAlert = async (adminEmail, itemName, currentStock, threshold) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Low Stock Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Low Stock Alert</h1>
        </div>
        <div class="content">
          <div class="alert">
            <h2>⚠️ Stock Level Critical</h2>
            <p><strong>Item:</strong> ${itemName}</p>
            <p><strong>Current Stock:</strong> ${currentStock}</p>
            <p><strong>Threshold:</strong> ${threshold}</p>
          </div>
          <p>Please restock this item as soon as possible to avoid service disruption.</p>
          <p>Login to your admin dashboard to manage inventory.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Pizza App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    email: adminEmail,
    subject: 'Low Stock Alert - Pizza App',
    html
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLowStockAlert
};

// Send a simple test email (useful for validating SMTP credentials)
const sendTestEmail = async (email) => {
  const html = `
    <p>This is a test email from <strong>Pizza App</strong>.</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
  `;

  await sendEmail({ email, subject: 'Pizza App - Test Email', html });
};

module.exports.sendTestEmail = sendTestEmail;
