import express from 'express';
import CustomizeConfig from '../models/CustomizeConfig.js';
import CardApproval from '../models/CardApproval.js';
import Notification from '../models/Notification.js';
import { sendApprovalEmail, sendApprovalConfirmationEmail } from '../utils/mailer.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get the Card Studio custom configuration defaults
// @route   GET /api/v1/customize-config
// @access  Public (so any user designing a card can read the defaults)
router.get('/', async (req, res) => {
  try {
    let config = await CustomizeConfig.findOne();
    if (!config) {
      // If no config has been set yet, return an object containing the model's default fields
      config = new CustomizeConfig();
    }
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Save/Update Card Studio configuration defaults & social links visible/order
// @route   POST /api/v1/customize-config
// @access  Private (super_user only)
router.post(
  '/',
  protect,
  restrictTo('super_user'),
  async (req, res) => {
    try {
      // Use findOneAndUpdate with empty filter and upsert option to keep at most one config in the collection
      const config = await CustomizeConfig.findOneAndUpdate(
        {},
        req.body,
        { upsert: true, new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Card Studio configuration updated successfully.',
        data: config
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// @desc    Submit customized design for approval
// @route   POST /api/v1/customize-config/send-approval
// @access  Private (Registered users)
router.post('/send-approval', protect, async (req, res) => {
  try {
    const { designDetails, designType } = req.body;
    if (!designDetails) {
      return res.status(400).json({ success: false, error: 'Design details are required.' });
    }

    const approval = await CardApproval.create({
      user: req.user._id,
      userEmail: req.user.email,
      designDetails,
      designType: designType || 'business_card'
    });

    const approvalUrl = await sendApprovalEmail(req.user.email, approval._id, designDetails);

    // Fire-and-forget notification creation so the user response is not delayed.
    Notification.create({
      title: 'Design Approval Requested',
      message: `${req.user.fullName} (${req.user.email}) submitted a design for approval.`,
      type: 'design_approval',
      user: req.user._id,
      targetRole: 'super_user'
    }).catch((notifErr) => {
      console.error('Failed to create design approval notification:', notifErr);
    });

    res.status(201).json({
      success: true,
      message: `Approval request email has been sent successfully to ${req.user.email}.`,
      data: approval,
      approvalUrl // returned for convenience in development/testing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get all design approval requests (Super Admin dashboard view)
// @route   GET /api/v1/customize-config/approvals
// @access  Private (super_user only)
router.get('/approvals', protect, restrictTo('super_user'), async (req, res) => {
  try {
    const approvals = await CardApproval.find()
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: approvals.length,
      data: approvals
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get a single design approval request details (for frontend approval view)
// @route   GET /api/v1/customize-config/approval/:id
// @access  Public
router.get('/approval/:id', async (req, res) => {
  try {
    const approval = await CardApproval.findById(req.params.id)
      .populate('user', 'fullName email');

    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found.' });
    }

    res.json({
      success: true,
      data: approval
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Approve a design request (called by user clicking the approval link)
// @route   POST /api/v1/customize-config/approve/:id
// @access  Public
router.post('/approve/:id', async (req, res) => {
  try {
    const approval = await CardApproval.findById(req.params.id);
    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found.' });
    }

    if (approval.status === 'approved') {
      return res.status(400).json({ success: false, error: 'This card design has already been approved.' });
    }

    approval.status = 'approved';
    approval.approvedAt = Date.now();
    await approval.save();

    // Send confirmation email to the user without causing the approval request to wait
    sendApprovalConfirmationEmail(approval.userEmail, approval._id, approval.designType)
      .catch((emailErr) => {
        console.error('Failed to send design approval confirmation email:', emailErr);
      });

    res.json({
      success: true,
      message: 'Design has been approved and submitted to the Super Admin.',
      data: approval
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Create an approval request and send the approval email to a specified user (Admin -> User)
// @route   POST /api/v1/customize-config/send-approval-to-user
// @access  Private (super_user, it_administrator)
router.post('/send-approval-to-user', protect, restrictTo('super_user', 'it_administrator'), async (req, res) => {
  try {
    const { userId, userEmail, designDetails, designType } = req.body;
    if (!userId || !userEmail || !designDetails) {
      return res.status(400).json({ success: false, error: 'userId, userEmail and designDetails are required.' });
    }

    const approval = await CardApproval.create({
      user: userId,
      userEmail,
      designDetails,
      designType: designType || 'business_card'
    });

    const approvalUrl = await sendApprovalEmail(userEmail, approval._id, designDetails);

    // Notify super users in background
    Notification.create({
      title: 'Design Approval Sent',
      message: `Approval request sent to ${userEmail} for review.`,
      type: 'design_approval',
      user: req.user._id,
      targetRole: 'super_user'
    }).catch((notifErr) => console.error('Failed to create notification:', notifErr));

    res.status(201).json({ success: true, message: 'Approval email sent to user.', data: approval, approvalUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

