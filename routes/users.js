import express from 'express';
import User from '../models/User.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { sendAccountApprovedEmail } from '../utils/mailer.js';

const router = express.Router();

// Apply protection to all endpoints in this file
router.use(protect);
router.use(restrictTo('super_user', 'it_administrator'));

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (super_user, it_administrator)
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update user details, role or status
// @route   PUT /api/v1/users/:id
// @access  Private (super_user, it_administrator)
router.put('/:id', async (req, res) => {
  try {
    const { fullName, phone, role, status } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const oldStatus = user.status;
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    if (status === 'active' && oldStatus !== 'active') {
      try {
        await sendAccountApprovedEmail(user.email, user.fullName);
        console.log(`[USERS] Account approval email sent to ${user.email}`);
      } catch (emailErr) {
        console.error('Failed to send account approval email:', emailErr);
      }
    }

    const updatedUser = await User.findById(user._id).select('-passwordHash');

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (super_user, it_administrator)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
