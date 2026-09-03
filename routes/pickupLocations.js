import express from 'express';
import PickupLocation from '../models/PickupLocation.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all active pickup locations
// @route   GET /api/v1/pickup-locations
// @access  Public / Private
router.get('/', protect, async (req, res) => {
  try {
    const locations = await PickupLocation.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Create a new pickup location
// @route   POST /api/v1/pickup-locations
// @access  Private (Super Admin / IT Administrator)
router.post('/', protect, restrictTo('super_user', 'it_administrator'), async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'Name and Address are required.' });
    }

    const location = await PickupLocation.create({
      name,
      address,
      phone: phone || ''
    });

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Delete a pickup location
// @route   DELETE /api/v1/pickup-locations/:id
// @access  Private (Super Admin / IT Administrator)
router.delete('/:id', protect, restrictTo('super_user', 'it_administrator'), async (req, res) => {
  try {
    const location = await PickupLocation.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, error: 'Pickup location not found.' });
    }
    res.json({
      success: true,
      message: 'Pickup location deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
