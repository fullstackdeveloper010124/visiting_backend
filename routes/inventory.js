import express from 'express';
import Inventory from '../models/Inventory.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all inventory items
// @route   GET /api/v1/inventory
// @access  Private (super_user, inventory_admin, procurement)
router.get(
  '/',
  protect,
  restrictTo('super_user', 'inventory_admin', 'procurement', 'user'),
  async (req, res) => {
    try {
      const inventory = await Inventory.find().populate('product', 'name sku category');
      res.json({
        success: true,
        count: inventory.length,
        data: inventory,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// @desc    Add stock or initialize product inventory
// @route   POST /api/v1/inventory/add-stock
// @access  Private (super_user, inventory_admin)
router.post(
  '/add-stock',
  protect,
  restrictTo('super_user', 'inventory_admin'),
  async (req, res) => {
    try {
      const { productId, quantity, warehouseLocation, reorderPoint = 100 } = req.body;

      if (!productId || quantity === undefined) {
        return res.status(400).json({ success: false, error: 'Product ID and quantity are required.' });
      }

      let item = await Inventory.findOne({ product: productId });

      if (item) {
        item.quantityAvailable += Number(quantity);
        item.lastStockedAt = new Date();
        if (warehouseLocation) {
          item.warehouseLocation = warehouseLocation;
        }
      } else {
        if (!warehouseLocation) {
          return res.status(400).json({ success: false, error: 'Warehouse location is required for new inventory items.' });
        }
        item = new Inventory({
          product: productId,
          warehouseLocation,
          quantityAvailable: Number(quantity),
          reorderPoint,
          lastStockedAt: new Date(),
        });
      }

      await item.save();
      const populatedItem = await item.populate('product', 'name sku');

      res.status(200).json({
        success: true,
        data: populatedItem,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// @desc    Adjust inventory level
// @route   POST /api/v1/inventory/adjust-stock
// @access  Private (super_user, inventory_admin)
router.post(
  '/adjust-stock',
  protect,
  restrictTo('super_user', 'inventory_admin'),
  async (req, res) => {
    try {
      const { inventoryId, quantity, notes } = req.body;

      const item = await Inventory.findById(inventoryId);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Inventory record not found.' });
      }

      item.quantityAvailable = Number(quantity);
      await item.save();

      const populatedItem = await item.populate('product', 'name sku');
      res.json({
        success: true,
        data: populatedItem,
        notes,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
