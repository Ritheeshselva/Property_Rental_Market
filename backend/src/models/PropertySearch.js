const mongoose = require('mongoose');

const propertySearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    searchQuery: {
      location: { type: String },
      minPrice: { type: Number },
      maxPrice: { type: Number },
      propertyType: { type: String },
      rooms: { type: Number },
      amenities: [{ type: String }],
      facing: { type: String }
    },
    resultsCount: { type: Number },
    searchDate: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PropertySearch', propertySearchSchema);
