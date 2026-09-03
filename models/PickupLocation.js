import mongoose from 'mongoose';

const pickupLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

const PickupLocation = mongoose.model('PickupLocation', pickupLocationSchema);
export default PickupLocation;
