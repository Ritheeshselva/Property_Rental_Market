const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    planType: { type: String, enum: ['basic', 'premium', 'enterprise'], required: true },
    status: { type: String, enum: ['active', 'inactive', 'expired', 'cancelled'], default: 'active' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String },
    transactionId: { type: String },
    features: {
      propertyListing: { type: Boolean, default: true },
      staffAssignment: { type: Boolean, default: false },
      maintenanceTracking: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      customReports: { type: Boolean, default: false }
    },
    autoRenew: { type: Boolean, default: true },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
