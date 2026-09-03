import express from 'express';
import UserDesignDraft from '../models/UserDesignDraft.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @desc    Get user design draft for a specific type
// @route   GET /api/v1/drafts/:type
// @access  Private
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const draft = await UserDesignDraft.findOne({
      user: req.user._id,
      designType: type
    });

    res.json({
      success: true,
      data: draft ? draft.designDetails : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Save/update user design draft for a specific type
// @route   POST /api/v1/drafts/:type
// @access  Private
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { designDetails } = req.body;

    if (!designDetails) {
      return res.status(400).json({ success: false, error: 'Design details are required.' });
    }

    const draft = await UserDesignDraft.findOneAndUpdate(
      { user: req.user._id, designType: type },
      { designDetails },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: draft.designDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
