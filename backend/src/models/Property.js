const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    address: { type: String, required: true },
    pricePerMonth: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    totalAreaSqFt: { type: Number, required: true },
    facing: { type: String, enum: ['East', 'West', 'North', 'South'], required: true },
    rooms: { type: Number, required: true },
    description: { type: String },
    images: [{ type: String }], // stored URLs /paths
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);


