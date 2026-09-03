import express from 'express';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      // Use case-insensitive regex search when text index is not available.
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Check if the user is authenticated as an admin to see inactive products
    let isAdmin = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretprintflowtoken');
        const user = await User.findById(decoded.id);
        if (user && ['super_user', 'procurement', 'inventory_admin'].includes(user.role)) {
          isAdmin = true;
        }
      } catch (err) {
        // Ignore token errors and treat user as non-admin
      }
    }

    if (!isAdmin) {
      query.status = 'active';
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skipIndex = (pageNum - 1) * limitNum;

    // Run data fetch and count in parallel to reduce overall latency.
    const [productsRaw, total] = await Promise.all([
      Product.find(query)
        .populate('inventory')
        .limit(limitNum)
        .skip(skipIndex)
        .sort({ displayOrder: 1, createdAt: -1 })
        .exec(),
      Product.countDocuments(query).exec(),
    ]);

    const products = productsRaw.map(product => {
      const prodObj = product.toObject();
      prodObj.stock = product.inventory ? product.inventory.quantityAvailable : 0;
      return prodObj;
    });

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      limit: limitNum,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const productRaw = await Product.findById(req.params.id).populate('inventory');

    if (!productRaw) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const product = productRaw.toObject();
    product.stock = productRaw.inventory ? productRaw.inventory.quantityAvailable : 0;

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Create a new product
// @route   POST /api/v1/products
// @access  Private (super_user, procurement)
router.post(
  '/',
  protect,
  restrictTo('super_user', 'procurement'),
  async (req, res) => {
    try {
      const { sku, name, description, category, basePrice, imageUrl, status, displayOrder, tierPricing } = req.body;

      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(400).json({ success: false, error: 'Product with this SKU already exists.' });
      }

      const product = await Product.create({
        sku,
        name,
        description,
        category,
        basePrice,
        imageUrl,
        status: status || 'active',
        displayOrder: displayOrder || 0,
        tierPricing: tierPricing || [],
      });

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// @desc    Update a product
// @route   PUT /api/v1/products/:id
// @access  Private (super_user, procurement, inventory_admin)
router.put(
  '/:id',
  protect,
  restrictTo('super_user', 'procurement', 'inventory_admin'),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// @desc    Delete a product
// @route   DELETE /api/v1/products/:id
// @access  Private (super_user, procurement)
router.delete(
  '/:id',
  protect,
  restrictTo('super_user', 'procurement'),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully.',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
