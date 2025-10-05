const mongoose = require('mongoose');

const staffReportSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffAssignment', required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    inspectionDate: { type: Date, default: Date.now, required: true },
    propertyCondition: { type: String, enum: ['excellent', 'good', 'average', 'needs_attention', 'urgent_issues'], required: true },
    reportText: { type: String, required: true },
    images: [{ type: String }], // Optional images of property condition
    maintenanceRecommended: { type: Boolean, default: false },
    maintenanceDetails: { type: String },
    status: { type: String, enum: ['submitted', 'reviewed', 'forwarded'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
    reviewedAt: { type: Date },
    forwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Owner
    forwardedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffReport', staffReportSchema);
