import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { sendPendingApprovalEmail, sendWelcomeEmail, sendLoginEmail } from '../utils/mailer.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretprintflowtoken', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    // Validate password strength: 8-12 characters, A-Z, a-z, symbols, numbers
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,12}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be 8-12 characters long and include at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special symbol.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email.' });
    }

    // Create user (hashing password is handled pre-save by model)
    const user = await User.create({
      email,
      passwordHash: password, // Named passwordHash because Mongoose model maps passwordHash
      fullName,
      phone: phone || '',
      role: role || 'user',
    });

    if (user) {
      // Create user signup notification
      try {
        await Notification.create({
          title: 'New User Registered',
          message: `New user ${user.fullName} (${user.email}) registered as ${user.role}.`,
          type: 'user_signup',
          user: user._id,
          targetRole: 'super_user'
        });
      } catch (notifErr) {
        console.error('Failed to create signup notification:', notifErr);
      }

      if (user.status === 'pending') {
        try {
          await sendPendingApprovalEmail(user.email, user.fullName);
        } catch (emailErr) {
          console.error('Failed to send pending approval email:', emailErr);
        }
        return res.status(201).json({
          success: true,
          message: 'Registration successful! Your account is pending approval by the Admin. You will be able to log in once approved.',
          data: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            status: user.status,
          },
        });
      }

      try {
        await sendWelcomeEmail(user.email, user.fullName);
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
      }

      const token = generateToken(user._id);
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status,
          token,
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data provided.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide both email and password.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      let statusError = `This account is currently ${user.status}.`;
      if (user.status === 'pending') {
        statusError = 'Your account is pending approval by the Admin. You will be able to log in once approved.';
      } else if (user.status === 'suspended') {
        statusError = 'Your account has been suspended. Please contact support.';
      } else if (user.status === 'inactive') {
        statusError = 'Your account is inactive. Please contact support.';
      }
      return res.status(403).json({ success: false, error: statusError });
    }

    const token = generateToken(user._id);

    // Send login notification email asynchronously
    sendLoginEmail(user.email, user.fullName).catch(err => {
      console.error('Failed to send login email:', err);
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update current user profile
// @route   PUT /api/v1/auth/me
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const { fullName, phone, jobTitle, linkedin, instagram } = req.body;
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (instagram !== undefined) user.instagram = instagram;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        jobTitle: user.jobTitle,
        linkedin: user.linkedin,
        instagram: user.instagram,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
