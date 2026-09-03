import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @desc    Get all notifications for logged in user's role
// @route   GET /api/v1/notifications
// @access  Private
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetRole: req.user.role },
        { targetRole: null }
      ]
    })
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(50);

    // Filter unread status for this specific user
    const formattedNotifications = notifications.map(notif => {
      const isRead = notif.readBy.includes(req.user._id);
      return {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        user: notif.user,
        targetRole: notif.targetRole,
        isRead,
        createdAt: notif.createdAt
      };
    });

    res.json({
      success: true,
      count: formattedNotifications.length,
      unreadCount: formattedNotifications.filter(n => !n.isRead).length,
      data: formattedNotifications
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Mark a notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
router.put('/read-all', async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetRole: req.user.role },
        { targetRole: null }
      ],
      readBy: { $ne: req.user._id }
    });

    for (let notif of notifications) {
      notif.readBy.push(req.user._id);
      await notif.save();
    }

    res.json({ success: true, count: notifications.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
