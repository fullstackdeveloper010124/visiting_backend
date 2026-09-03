import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },
    warehouseLocation: {
      type: String,
      required: true,
      trim: true,
    },
    quantityAvailable: {
      type: Number,
      default: 0,
    },
    quantityReserved: {
      type: Number,
      default: 0,
    },
    reorderPoint: {
      type: Number,
      required: true,
    },
    lastStockedAt: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
