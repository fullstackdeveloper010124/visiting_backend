import mongoose from 'mongoose';

const userDesignDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    designType: {
      type: String,
      required: true,
      enum: ['business_card', 'letterhead', 'envelope', 'notepad', 'folder', 'slip'],
    },
    designDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one draft per user per design type
userDesignDraftSchema.index({ user: 1, designType: 1 }, { unique: true });

const UserDesignDraft = mongoose.model('UserDesignDraft', userDesignDraftSchema);
export default UserDesignDraft;
