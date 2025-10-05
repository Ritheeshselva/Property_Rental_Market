const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    startDate: { type: Date, required: true },
    message: { type: String },
    status: { type: String, enum: ['requested', 'pending_payment', 'payment_completed', 'confirmed', 'cancelled'], default: 'requested' },
    termsAccepted: { type: Boolean, required: true, default: false },
    paymentStatus: { type: String, enum: ['not_paid', 'pending', 'completed'], default: 'not_paid' },
    advanceAmount: { type: Number },
    paymentMethod: { type: String },
    paymentTransactionId: { type: String },
    supportRequests: [{
      type: { type: String, enum: ['maintenance', 'emergency', 'general'] },
      description: { type: String },
      status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
      createdAt: { type: Date, default: Date.now },
      resolvedAt: { type: Date }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);


