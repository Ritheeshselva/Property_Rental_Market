const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'owner', 'staff'], default: 'user' },
    phone: { type: String },
    address: { type: String },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String },
    // For property owners
    subscriptionStatus: { type: String, enum: ['inactive', 'active', 'expired', 'cancelled'], default: 'inactive' },
    subscriptionExpiry: { type: Date },
    // For staff
    staffId: { type: String, unique: true, sparse: true },
    assignedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    specialization: { type: String }, // e.g., 'maintenance', 'inspection', 'cleaning'
    availability: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


