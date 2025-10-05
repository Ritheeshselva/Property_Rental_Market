const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    address: { type: String, required: true },
    pricePerMonth: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    totalAreaSqFt: { type: Number, required: true },
    facing: { type: String, enum: ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'], required: true },
    rooms: { type: Number, required: true },
    description: { type: String },
    images: [{ type: String }], // stored URLs /paths
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Subscription and management features
    hasSubscription: { type: Boolean, default: false },
    subscriptionType: { type: String, enum: ['basic', 'premium', 'enterprise'], default: 'basic' },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Property details for search
    propertyType: { type: String, enum: ['apartment', 'house', 'villa', 'studio', 'commercial'], default: 'apartment' },
    amenities: [{ type: String }], // e.g., ['parking', 'garden', 'balcony', 'gym']
    location: {
      city: { type: String },
      state: { type: String },
      area: { type: String }, // Added area field
      pincode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    // Maintenance tracking
    lastInspection: { type: Date },
    nextInspection: { type: Date },
    maintenanceStatus: { type: String, enum: ['good', 'needs_attention', 'urgent'], default: 'good' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);


