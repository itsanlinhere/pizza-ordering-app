const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { sendVerificationEmail: sendVerificationEmailWithTemplate } = require('../utils/email');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').isLength({ min: 10, max: 10 }).isNumeric().withMessage('Phone number must be 10 digits'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    console.log('Register route called with body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, role } = req.body;

    console.log('Creating user:', { name, email, phone, role });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'user'
    });

    // If EMAIL_VERIFICATION is explicitly set to 'false', skip sending verification and mark verified
    if (process.env.EMAIL_VERIFICATION === 'false') {
      user.isVerified = true;
      await user.save();
    } else {
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      try {
        await sendVerificationEmail(user.email, verificationToken);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Fallback: log verification URL so developer can verify accounts when SMTP fails
        try {
          const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
          console.log('Verification URL (dev):', `${clientUrl}/verify-email/${verificationToken}`);
        } catch (err) {
          console.error('Failed to log verification URL:', err);
        }
      }
    }

    const token = generateToken(user._id);

    // Build response payload. In development include the raw verification token to ease testing
    const responsePayload = {
      success: true,
      message: process.env.NODE_ENV !== 'production'
        ? 'User registered (dev) - verification token included for testing'
        : 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        },
        token
      }
    };

    if (process.env.NODE_ENV !== 'production' && typeof verificationToken !== 'undefined') {
      responsePayload.data.verificationToken = verificationToken;
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    console.error('Register route error:', error && (error.stack || error));
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      message: isDev ? (error.message || 'Server error') : 'Server error',
      ...(isDev ? { stack: error.stack } : {})
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If EMAIL_VERIFICATION is enabled (not set to 'false'), require user to be verified
    if (process.env.EMAIL_VERIFICATION !== 'false' && !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email
// @access  Public
router.post('/verify-email', [
  body('token').exists().withMessage('Verification token is required')
], async (req, res) => {
  try {
    const { token } = req.body;

    // Log the incoming token for debugging (dev)
    console.log('Verify-email called with token:', token);

    const hashedToken = require('crypto').createHash('sha256').update(token).digest('hex');
    console.log('Hashed token:', hashedToken);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    console.log('Verification lookup result userId:', user ? user._id : null);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route POST /api/auth/send-verification-code
// @desc  Generate a short numeric verification code and email it to the user
// @access Public
router.post('/send-verification-code', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const code = user.generateEmailVerificationCode();
    await user.save();

    try {
      // send email with code in the body. The email util will log in dev if SMTP isn't configured
      await sendVerificationEmailWithTemplate(user.email, undefined /* token not used here */);
      // For dev, also log the raw code
      console.log('Verification code (dev):', code);
    } catch (e) {
      console.error('Failed to send verification code email:', e && e.message);
    }

    return res.json({ success: true, message: 'Verification code generated and sent (check your email)', debug: process.env.NODE_ENV !== 'production' ? { code } : undefined });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route POST /api/auth/verify-code
// @desc  Verify numeric code entered by user
// @access Public
router.post('/verify-code', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { email, code } = req.body;
    const hashed = require('crypto').createHash('sha256').update(code).digest('hex');
    const user = await User.findOne({ email, emailVerificationCode: hashed, emailVerificationExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });

    user.isVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already verified' });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Resend verification email failed:', emailError && (emailError.message || emailError));
      // Fallback to logging the URL for dev
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      console.log('Verification URL (dev):', `${clientUrl}/verify-email/${verificationToken}`);
    }

    // In development, include the raw verification token in the response to ease testing
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ success: true, message: 'Verification email resent (dev)', verificationToken });
    }

    res.json({ success: true, message: 'Verification email resent (check your inbox or server logs in dev)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          addresses: user.addresses
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
