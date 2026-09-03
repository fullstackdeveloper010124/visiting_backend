import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  customization: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  subtotal: {
    type: Number,
    required: true,
  }
});

const deliverySchema = new mongoose.Schema({
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_transit', 'delivered', 'failed'],
    default: 'pending',
  },
  scheduledDate: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  proofImageUrl: {
    type: String,
    default: '',
  },
  signature: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  pickupAddress: {
    type: String,
    default: '',
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'processing', 'ready', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    allowedPaymentMethod: {
      type: String,
      enum: ['none', 'paypal', 'credit_card', 'cod', 'bank_transfer'],
      default: 'none',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    delivery: {
      type: deliverySchema,
      default: () => ({}),
    }
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
