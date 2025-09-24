const mongoose = require('mongoose');

const staffReportSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffAssignment', required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    reportText: { type: String, required: true },
    status: { type: String, enum: ['submitted', 'verified', 'forwarded'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
    verifiedAt: { type: Date },
    forwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Owner
    forwardedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffReport', staffReportSchema);
