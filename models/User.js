import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    jobTitle: {
      type: String,
      default: '',
    },
    linkedin: {
      type: String,
      default: '',
    },
    instagram: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: [
        'super_user',
        'inventory_admin',
        'order_processor',
        'delivery_person',
        'accounting',
        'salesperson',
        'finance_contracts',
        'procurement',
        'it_administrator',
        'user'
      ],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending',
    }
  },
  {
    timestamps: true,
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save middleware to hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', userSchema);
export default User;
