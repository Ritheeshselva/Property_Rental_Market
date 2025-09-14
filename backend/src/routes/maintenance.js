const express = require('express');
const Maintenance = require('../models/Maintenance');
const Property = require('../models/Property');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create maintenance request (property owner)
router.post('/', auth(), async (req, res) => {
  try {
    const { 
      propertyId, 
      type, 
      priority, 
      title, 
      description, 
      scheduledDate, 
      estimatedCost, 
      location 
    } = req.body;
    
    if (!propertyId || !type || !title || !description) {
      return res.status(400).json({ message: 'Property ID, type, title, and description are required' });
    }

    // Check if property exists and belongs to user
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create maintenance for this property' });
    }

    // Check if property has subscription for maintenance tracking
    if (!property.hasSubscription) {
      return res.status(400).json({ message: 'Property must have an active subscription for maintenance tracking' });
    }

    const maintenance = await Maintenance.create({
      property: propertyId,
      owner: req.user.id,
      type,
      priority: priority || 'medium',
      title,
      description,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      estimatedCost,
      location,
      status: 'pending'
    });

    // Update property maintenance status if urgent
    if (priority === 'urgent') {
      await Property.findByIdAndUpdate(propertyId, {
        maintenanceStatus: 'urgent'
      });
    }

    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('property', 'title address')
      .populate('owner', 'name email');

    res.status(201).json(populatedMaintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get maintenance requests for property owner
router.get('/my-maintenance', auth(), async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    
    const filter = { owner: req.user.id };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const maintenance = await Maintenance.find(filter)
      .populate('property', 'title address images')
      .populate('assignedStaff', 'name email phone specialization')
      .sort({ createdAt: -1 });

    res.json(maintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get maintenance requests for staff
router.get('/staff-assignments', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Only staff members can access this endpoint' });
    }

    const { status, type, priority } = req.query;
    
    const filter = { assignedStaff: req.user.id };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const maintenance = await Maintenance.find(filter)
      .populate('property', 'title address images')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(maintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get all maintenance requests (admin only)
router.get('/all', auth('admin'), async (req, res) => {
  try {
    const { status, type, priority, propertyId } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (propertyId) filter.property = propertyId;

    const maintenance = await Maintenance.find(filter)
      .populate('property', 'title address images')
      .populate('owner', 'name email phone')
      .populate('assignedStaff', 'name email phone specialization')
      .sort({ createdAt: -1 });

    res.json(maintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Assign staff to maintenance (admin only)
router.post('/:id/assign-staff', auth('admin'), async (req, res) => {
  try {
    const { staffId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if staff exists
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    maintenance.assignedStaff = staffId;
    maintenance.status = 'in_progress';
    await maintenance.save();

    const updatedMaintenance = await Maintenance.findById(req.params.id)
      .populate('property', 'title address')
      .populate('owner', 'name email')
      .populate('assignedStaff', 'name email phone specialization');

    res.json(updatedMaintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update maintenance status (staff only)
router.put('/:id/status', auth(), async (req, res) => {
  try {
    const { status, staffNotes, actualCost, rating } = req.body;
    
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check authorization
    const isOwner = maintenance.owner.toString() === req.user.id;
    const isAssignedStaff = maintenance.assignedStaff && maintenance.assignedStaff.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedStaff && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this maintenance request' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (staffNotes) updateData.staffNotes = staffNotes;
    if (actualCost) updateData.actualCost = actualCost;
    if (rating) updateData.rating = rating;

    if (status === 'completed') {
      updateData.completedDate = new Date();
      
      // Update property maintenance status
      await Property.findByIdAndUpdate(maintenance.property, {
        maintenanceStatus: 'good',
        lastInspection: new Date()
      });
    }

    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('property', 'title address')
     .populate('owner', 'name email')
     .populate('assignedStaff', 'name email phone');

    res.json(updatedMaintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Add maintenance images (staff only)
router.post('/:id/images', auth(), async (req, res) => {
  try {
    const { images } = req.body;
    
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user is assigned staff or admin
    const isAssignedStaff = maintenance.assignedStaff && maintenance.assignedStaff.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedStaff && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to add images to this maintenance request' });
    }

    if (images && Array.isArray(images)) {
      maintenance.images = [...(maintenance.images || []), ...images];
      await maintenance.save();
    }

    res.json({ message: 'Images added successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get maintenance details
router.get('/:id', auth(), async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('property', 'title address images')
      .populate('owner', 'name email phone')
      .populate('assignedStaff', 'name email phone specialization');

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check authorization
    const isOwner = maintenance.owner._id.toString() === req.user.id;
    const isAssignedStaff = maintenance.assignedStaff && maintenance.assignedStaff._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedStaff && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this maintenance request' });
    }

    res.json(maintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Add owner feedback
router.post('/:id/feedback', auth(), async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user is the property owner
    if (maintenance.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to provide feedback for this maintenance request' });
    }

    const updateData = {};
    if (feedback) updateData.ownerFeedback = feedback;
    if (rating) updateData.rating = rating;

    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('property', 'title address')
     .populate('owner', 'name email')
     .populate('assignedStaff', 'name email phone');

    res.json(updatedMaintenance);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
