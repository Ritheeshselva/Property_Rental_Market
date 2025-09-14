const mongoose = require('mongoose');

const staffAssignmentSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who assigned
    assignmentType: { 
      type: String, 
      enum: ['maintenance', 'inspection', 'cleaning', 'emergency', 'general'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['assigned', 'accepted', 'in_progress', 'completed', 'cancelled'], 
      default: 'assigned' 
    },
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    completedDate: { type: Date },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    },
    description: { type: String },
    instructions: { type: String },
    notes: { type: String },
    staffNotes: { type: String },
    // Location details for staff
    meetingPoint: { type: String },
    contactPerson: { type: String },
    contactPhone: { type: String },
    // Performance tracking
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    // Recurring assignments
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] 
    },
    nextAssignment: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffAssignment', staffAssignmentSchema);
