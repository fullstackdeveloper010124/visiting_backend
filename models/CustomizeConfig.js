import mongoose from 'mongoose';

const socialLinkSchema = new mongoose.Schema({
  id: String, // 'linkedin', 'instagram', 'facebook', 'twitter', 'tiktok'
  name: String,
  visible: { type: Boolean, default: true },
  placeholder: String
});

const customizeConfigSchema = new mongoose.Schema(
  {
    // Front Side Details defaults
    personName: { type: String, default: 'John Doe' },
    jobTitle: { type: String, default: 'Chief Creative Officer' },
    phone: { type: String, default: '+1 (555) 123-4567' },
    email: { type: String, default: 'john.doe@acme.com' },
    website: { type: String, default: 'www.acmecorp.com' },
    address1: { type: String, default: '123 Innovation Drive' },
    address2: { type: String, default: 'Suite 100' },
    address3: { type: String, default: 'Silicon Valley, CA 94025' },

    // Back Side Identity defaults
    companyName: { type: String, default: 'Acme Corporation' },
    tagline: { type: String, default: 'Innovation Delivered' },

    // Product Configuration defaults
    finishedSize: { type: String, default: '3.5" x 2"' },
    colorOptions: { type: String, default: 'Full Color Front & Back' },
    printConfig: { type: String, default: 'Standard' },
    sheetSize: { type: String, default: '8.5" x 11"' },
    cardsPerSheet: { type: String, default: '10' },

    // Social links visibility & order
    socialLinks: {
      type: [socialLinkSchema],
      default: [
        { id: 'linkedin', name: 'LinkedIn', visible: true, placeholder: 'linkedin.com/in/johndoe' },
        { id: 'instagram', name: 'Instagram', visible: true, placeholder: '@acmecorp' },
        { id: 'facebook', name: 'Facebook', visible: true, placeholder: 'facebook.com/acmecorp' },
        { id: 'twitter', name: 'X (Twitter)', visible: true, placeholder: '@acmecorp' },
        { id: 'tiktok', name: 'TikTok', visible: true, placeholder: '@acmecorp' }
      ]
    },

    // Checkout Configuration defaults
    checkoutSettings: {
      paymentMethods: {
        type: [String],
        default: ['paypal', 'credit_card', 'cod', 'bank_transfer']
      },
      deliveryOptions: {
        type: [String],
        default: ['shipping', 'pickup']
      }
    }
  },
  {
    timestamps: true
  }
);

const CustomizeConfig = mongoose.model('CustomizeConfig', customizeConfigSchema);
export default CustomizeConfig;
