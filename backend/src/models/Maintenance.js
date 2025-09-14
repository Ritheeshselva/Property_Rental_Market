const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['inspection', 'repair', 'cleaning', 'renovation', 'emergency', 'routine'], 
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    estimatedCost: { type: Number },
    actualCost: { type: Number },
    location: { type: String }, // Specific area in the property
    images: [{ type: String }], // Before/after photos
    notes: { type: String },
    staffNotes: { type: String },
    ownerFeedback: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    // For tracking maintenance history
    previousMaintenance: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance' },
    nextScheduled: { type: Date },
    // Equipment/tools used
    equipmentUsed: [{ type: String }],
    materialsUsed: [{ 
      name: String, 
      quantity: Number, 
      cost: Number 
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
