import mongoose from 'mongoose';

const cardApprovalSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    userEmail: { 
      type: String, 
      required: true 
    },
    designDetails: { 
      type: Object, 
      required: true 
    },
    designType: { 
      type: String, 
      enum: ['business_card', 'letterhead', 'envelope', 'notepad', 'folder', 'slip'], 
      default: 'business_card' 
    },
    status: { 
      type: String, 
      enum: ['pending_user_approval', 'approved'], 
      default: 'pending_user_approval' 
    },
    approvedAt: { 
      type: Date 
    }
  },
  {
    timestamps: true
  }
);

const CardApproval = mongoose.model('CardApproval', cardApprovalSchema);
export default CardApproval;
