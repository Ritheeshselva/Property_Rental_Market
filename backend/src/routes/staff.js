const express = require('express');
const User = require('../models/User');
const StaffAssignment = require('../models/StaffAssignment');
const Property = require('../models/Property');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all staff (admin only)
router.get('/', auth('admin'), async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' })
      .select('-passwordHash')
      .populate('assignedProperties', 'title address');
    
    res.json(staff);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create staff member (admin only)
router.post('/', auth('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, specialization } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate staff ID
    const staffId = 'STF' + Date.now().toString().slice(-6);

    const staff = await User.create({
      name,
      email,
      passwordHash,
      role: 'staff',
      phone,
      specialization,
      staffId,
      availability: 'available'
    });

    res.status(201).json({
      id: staff._id,
      name: staff.name,
      email: staff.email,
      staffId: staff.staffId,
      specialization: staff.specialization
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get staff member details
router.get('/:id', auth(), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('assignedProperties', 'title address images');
    
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Get recent assignments
    const assignments = await StaffAssignment.find({ staff: req.params.id })
      .populate('property', 'title address')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      ...staff.toObject(),
      recentAssignments: assignments
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update staff member (admin only)
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const { name, phone, specialization, availability } = req.body;
    
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (specialization) updateData.specialization = specialization;
    if (availability) updateData.availability = availability;

    const updatedStaff = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-passwordHash');

    res.json(updatedStaff);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Assign staff to property (admin only)
router.post('/:staffId/assign', auth('admin'), async (req, res) => {
  try {
    const { propertyId, assignmentType, dueDate, description, instructions, priority } = req.body;
    
    if (!propertyId || !assignmentType) {
      return res.status(400).json({ message: 'Property ID and assignment type are required' });
    }

    // Check if staff exists
    const staff = await User.findById(req.params.staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if property has subscription
    if (!property.hasSubscription) {
      return res.status(400).json({ message: 'Property must have an active subscription for staff assignment' });
    }

    // Create assignment
    const assignment = await StaffAssignment.create({
      staff: req.params.staffId,
      property: propertyId,
      assignedBy: req.user.id,
      assignmentType,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      description,
      instructions,
      priority: priority || 'medium'
    });

    // Update staff assigned properties
    if (!staff.assignedProperties.includes(propertyId)) {
      staff.assignedProperties.push(propertyId);
      await staff.save();
    }

    // Update property assigned staff
    property.assignedStaff = req.params.staffId;
    await property.save();

    const populatedAssignment = await StaffAssignment.findById(assignment._id)
      .populate('staff', 'name email phone specialization')
      .populate('property', 'title address')
      .populate('assignedBy', 'name');

    res.status(201).json(populatedAssignment);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get staff assignments
router.get('/:staffId/assignments', auth(), async (req, res) => {
  try {
    // Check if user is the staff member or admin
    if (req.params.staffId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const assignments = await StaffAssignment.find({ staff: req.params.staffId })
      .populate('property', 'title address images')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update assignment status (staff only)
router.put('/assignments/:assignmentId', auth(), async (req, res) => {
  try {
    const { status, notes, rating } = req.body;
    
    const assignment = await StaffAssignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is the assigned staff member
    if (assignment.staff.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes) updateData.staffNotes = notes;
    if (rating) updateData.rating = rating;

    if (status === 'completed') {
      updateData.completedDate = new Date();
    }

    const updatedAssignment = await StaffAssignment.findByIdAndUpdate(
      req.params.assignmentId,
      updateData,
      { new: true }
    ).populate('property', 'title address')
     .populate('staff', 'name email');

    res.json(updatedAssignment);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Delete staff member (admin only)
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Remove staff from all assigned properties
    await Property.updateMany(
      { assignedStaff: req.params.id },
      { $unset: { assignedStaff: 1 } }
    );

    // Cancel all pending assignments
    await StaffAssignment.updateMany(
      { staff: req.params.id, status: { $in: ['assigned', 'accepted', 'in_progress'] } },
      { status: 'cancelled' }
    );

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
