import mongoose from 'mongoose';

const tierPricingSchema = new mongoose.Schema({
  minQuantity: {
    type: Number,
    required: true,
  },
  maxQuantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  }
});

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    tierPricing: [tierPricingSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for inventory data
productSchema.virtual('inventory', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'product',
  justOne: true
});

// Indexes to improve query performance on searches and filters
productSchema.index({ name: 'text', sku: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
