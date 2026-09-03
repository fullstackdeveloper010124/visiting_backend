import express from 'express';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { sendInvoiceEmail, sendOrderConfirmationEmail } from '../utils/mailer.js';
import Inventory from '../models/Inventory.js';


const router = express.Router();

// @desc    Create a new order
// @route   POST /api/v1/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, subtotal, tax, shipping, total, customization } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Please add items to your order.' });
    }

    // Generate unique order number (e.g. ORD-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // Verify and deduct stock for all items
    const inventoryUpdates = [];
    for (const item of items) {
      const inventory = await Inventory.findOne({ product: item.product }).populate('product');
      if (!inventory) {
        return res.status(400).json({ success: false, error: `Product inventory not found for ID: ${item.product}` });
      }

      let deductionQty = item.quantity;
      if (inventory.product) {
        const sku = inventory.product.sku;
        // Scale deduction based on the bulk unit representation
        if (sku === 'LH-CORP') deductionQty = item.quantity * 500;       // 500 sheets per ream
        else if (sku === 'EV-PROF') deductionQty = item.quantity * 100;  // 100 envelopes per box
        else if (sku === 'FL-PRES') deductionQty = item.quantity * 100;  // 100 folders per box
        else if (sku === 'CS-COMP') deductionQty = item.quantity * 500;  // 500 slips per box
        // BC-PREM (Business Cards) and NP-DESG (Notepads) are 1:1
      }

      if (inventory.quantityAvailable < deductionQty) {
        return res.status(400).json({ success: false, error: `Insufficient stock. Only ${inventory.quantityAvailable} available.` });
      }
      inventoryUpdates.push({ inventory, quantity: deductionQty });
    }

    // Deduct stock safely
    for (const update of inventoryUpdates) {
      update.inventory.quantityAvailable -= update.quantity;
      await update.inventory.save();
    }

    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      items,
      subtotal,
      tax,
      shipping,
      total,
      paymentStatus: req.body.paymentStatus || 'pending',
      allowedPaymentMethod: req.body.allowedPaymentMethod || 'none',
      status: 'pending',
      delivery: req.body.delivery || { status: 'pending' }
    });

    // Create Notification
    try {
      await Notification.create({
        title: 'New Order Placed',
        message: `${req.user.fullName} placed order ${orderNumber} for a total of $${total}.`,
        type: 'order_created',
        user: req.user._id,
        targetRole: 'super_user'
      });
    } catch (notifErr) {
      console.error('Failed to create order notification:', notifErr);
    }

    // Send order confirmation email asynchronously
    sendOrderConfirmationEmail(req.user.email, req.user.fullName, order).catch(err => {
      console.error('Failed to send order confirmation email:', err);
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Standard users can only view their own orders
    if (req.user.role === 'user') {
      query.customer = req.user._id;
    }

    // Delivery persons can view orders assigned to them
    if (req.user.role === 'delivery_person') {
      query['delivery.deliveryPerson'] = req.user._id;
    }

    const { status, page = 1, limit = 10 } = req.query;
    if (status) {
      query.status = status;
    }

    const skipIndex = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('customer', 'fullName email')
      .populate('items.product', 'name sku')
      .limit(Number(limit))
      .skip(skipIndex)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      limit: Number(limit),
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName email phone')
      .populate('items.product', 'name sku basePrice')
      .populate('delivery.deliveryPerson', 'fullName email phone');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Check ownership unless admin/staff
    if (
      req.user.role === 'user' &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'You do not have permission to view this order.' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update order status
// @route   PUT /api/v1/orders/:id
// @access  Private (super_user, order_processor, delivery_person, accounting)
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, paymentStatus, deliveryStatus, notes, allowedPaymentMethod, pickupAddress } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Authorization checks
    const allowedRoles = ['super_user', 'order_processor', 'delivery_person', 'accounting'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to edit orders.' });
    }

    if (req.user.role === 'delivery_person' && order.delivery.deliveryPerson?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only update deliveries assigned to you.' });
    }

    // Process updates
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (allowedPaymentMethod) order.allowedPaymentMethod = allowedPaymentMethod;

    if (deliveryStatus) {
      order.delivery.status = deliveryStatus;
      if (deliveryStatus === 'delivered') {
        order.delivery.deliveredAt = new Date();
        order.status = 'delivered';
      }
    }

    if (notes !== undefined) {
      order.delivery.notes = notes;
    }

    if (pickupAddress !== undefined) {
      order.delivery.pickupAddress = pickupAddress;
    }

    await order.save();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Assign order to delivery person
// @route   POST /api/v1/orders/:id/assign-delivery
// @access  Private (super_user, order_processor)
router.post(
  '/:id/assign-delivery',
  protect,
  restrictTo('super_user', 'order_processor'),
  async (req, res) => {
    try {
      const { deliveryPersonId, scheduledDate } = req.body;

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      order.delivery = {
        deliveryPerson: deliveryPersonId,
        status: 'assigned',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      };

      order.status = 'ready'; // Ready for dispatch

      await order.save();

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// @desc    Pay for an order
// @route   POST /api/v1/orders/:id/pay
// @access  Private (customer)
router.post('/:id/pay', protect, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Check ownership unless admin
    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'super_user') {
      return res.status(403).json({ success: false, error: 'You do not have permission to pay for this order.' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, error: 'This order is already paid.' });
    }

    order.paymentStatus = 'paid';
    order.delivery.notes = `${order.delivery.notes || ''}\n\n[PAID LATER] Paid via ${paymentMethod ? paymentMethod.toUpperCase() : 'selected method'} on ${new Date().toISOString()}`;

    await order.save();

    res.json({
      success: true,
      message: 'Payment completed successfully.',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Send invoice email to customer
// @route   POST /api/v1/orders/:id/send-invoice
// @access  Private (super_user, order_processor, accounting)
router.post('/:id/send-invoice', protect, restrictTo('super_user', 'order_processor', 'accounting'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'fullName email');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
    const issueDate = order.createdAt ? order.createdAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const dueDateObj = order.createdAt ? new Date(order.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dueDate = dueDateObj.toISOString().slice(0, 10);

    const invoiceDetails = {
      invoiceNumber,
      orderNumber: order.orderNumber,
      amount: order.total,
      status: order.paymentStatus === 'paid' ? 'paid' : 'sent',
      issueDate,
      dueDate
    };

    await sendInvoiceEmail(order.customer.email, invoiceDetails);

    res.json({
      success: true,
      message: `Invoice email successfully sent to ${order.customer.email}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

