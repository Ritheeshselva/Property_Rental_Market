// Staff submits inspection/problem report for an assignment

const express = require('express');
const StaffReport = require('../models/StaffReport');
const User = require('../models/User');
const StaffAssignment = require('../models/StaffAssignment');
const Property = require('../models/Property');
const auth = require('../middleware/auth');
const router = express.Router();

// Get the base URL for constructing full image URLs
const getBaseUrl = (req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

// Helper function to convert image paths to full URLs
const convertImagePathsToUrls = (images, baseUrl) => {
  if (!images || !Array.isArray(images)) return [];
  return images.map(imgPath => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http')) return imgPath; // Already a full URL
    
    // Make sure path starts with /uploads if it doesn't already
    let normalizedPath = imgPath;
    if (!normalizedPath.startsWith('/uploads')) {
      if (normalizedPath.startsWith('uploads')) {
        normalizedPath = '/' + normalizedPath;
      } else {
        normalizedPath = '/uploads/' + normalizedPath;
      }
    }
    
    console.log(`Converting image path: ${imgPath} -> ${baseUrl}${normalizedPath}`);
    return `${baseUrl}${normalizedPath}`;
  }).filter(url => url !== null);
};

// Staff submits monthly inspection report for a property
router.post('/assignments/:assignmentId/report', auth('staff'), async (req, res) => {
  try {
    const { reportText, propertyCondition, maintenanceRecommended, maintenanceDetails, images } = req.body;
    
    if (!reportText || !propertyCondition) {
      return res.status(400).json({ message: 'Report text and property condition are required' });
    }
    
    const assignment = await StaffAssignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignment.staff.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Create the report
    const report = await StaffReport.create({
      assignment: assignment._id,
      staff: req.user.id,
      property: assignment.property,
      inspectionDate: new Date(),
      propertyCondition,
      reportText,
      maintenanceRecommended: maintenanceRecommended || false,
      maintenanceDetails,
      images: images || []
    });
    
    // Update the assignment status and last inspection date
    assignment.status = 'report_submitted';
    assignment.lastInspectionDate = new Date();
    
    // Calculate the next inspection date based on frequency
    const nextInspection = new Date();
    switch (assignment.inspectionFrequency) {
      case 'monthly':
        nextInspection.setMonth(nextInspection.getMonth() + 1);
        break;
      case 'quarterly':
        nextInspection.setMonth(nextInspection.getMonth() + 3);
        break;
      case 'biannual':
        nextInspection.setMonth(nextInspection.getMonth() + 6);
        break;
      case 'annual':
        nextInspection.setFullYear(nextInspection.getFullYear() + 1);
        break;
    }
    
    assignment.nextInspectionDate = nextInspection;
    await assignment.save();
    
    res.json(report);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// Get reports for a staff member
router.get('/:staffId/reports', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.staffId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const reports = await StaffReport.find({ staff: req.params.staffId }).populate('assignment property');
    res.json(reports);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get all staff reports (admin only)
router.get('/reports', auth('admin'), async (req, res) => {
  try {
    const reports = await StaffReport.find()
      .populate('assignment property staff', 'name email title address')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin reviews a report
router.put('/reports/:reportId/review', auth('admin'), async (req, res) => {
  try {
    const report = await StaffReport.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    report.status = 'reviewed';
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    await report.save();
    
    res.json(report);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin forwards a report to owner
router.put('/reports/:reportId/forward', auth('admin'), async (req, res) => {
  try {
    const report = await StaffReport.findById(req.params.reportId)
      .populate('property');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (!report.property || !report.property.owner) {
      return res.status(400).json({ message: 'Property has no owner assigned' });
    }
    
    report.status = 'forwarded';
    report.forwardedTo = report.property.owner;
    report.forwardedAt = new Date();
    await report.save();
    
    res.json(report);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
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
    res.status(201).json(staff);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Assign staff to property for monthly inspections (admin only)
router.post('/:staffId/assign', auth('admin'), async (req, res) => {
  try {
    const { propertyId, inspectionFrequency, description, instructions } = req.body;
    
    console.log('Assigning staff to property:', {
      staffId: req.params.staffId,
      propertyId,
      inspectionFrequency,
      adminId: req.user.id
    });
    
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    // Check if staff exists - search by both _id and staffId
    const staff = await User.findOne({
      $or: [
        { _id: req.params.staffId },
        { staffId: req.params.staffId }
      ],
      role: 'staff'
    });
    
    if (!staff) {
      console.log('Staff not found or not a staff role:', req.params.staffId);
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    console.log('Found staff member:', {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      assignedProperties: staff.assignedProperties || []
    });

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      console.log('Property not found:', propertyId);
      return res.status(404).json({ message: 'Property not found' });
    }
    
    console.log('Found property:', {
      id: property._id,
      title: property.title,
      address: property.address
    });

    // Check if property has subscription
    if (!property.hasSubscription) {
      return res.status(400).json({ message: 'Property must have an active subscription for staff assignment' });
    }

    // Check if property is already assigned to another staff
    const existingAssignment = await StaffAssignment.findOne({ property: propertyId, status: { $ne: 'completed' } });
    if (existingAssignment && existingAssignment.staff.toString() !== req.params.staffId) {
      return res.status(400).json({ message: 'This property is already assigned to another staff member' });
    }

    // Calculate next inspection date (default to one month from now)
    const now = new Date();
    let nextInspectionDate = new Date(now);
    nextInspectionDate.setMonth(now.getMonth() + 1); // Default to one month

    // If frequency is provided, adjust accordingly
    if (inspectionFrequency) {
      switch (inspectionFrequency) {
        case 'quarterly':
          nextInspectionDate.setMonth(now.getMonth() + 3);
          break;
        case 'biannual':
          nextInspectionDate.setMonth(now.getMonth() + 6);
          break;
        case 'annual':
          nextInspectionDate.setFullYear(now.getFullYear() + 1);
          break;
      }
    }

    // Create assignment
    const assignment = await StaffAssignment.create({
      staff: staff._id, // Use the actual staff _id from the database
      property: propertyId,
      assignedBy: req.user.id,
      assignmentType: 'monthly_inspection',
      nextInspectionDate,
      inspectionFrequency: inspectionFrequency || 'monthly',
      description,
      instructions
    });
    
    console.log('Created staff assignment:', {
      id: assignment._id,
      staffId: staff._id,
      propertyId: propertyId,
      status: assignment.status
    });

    // Update staff assigned properties
    if (!staff.assignedProperties) {
      staff.assignedProperties = [];
    }
    
    // Check if property is not already in assignedProperties
    const propertyAlreadyAssigned = staff.assignedProperties.some(
      p => p.toString() === propertyId.toString()
    );
    
    if (!propertyAlreadyAssigned) {
      staff.assignedProperties.push(propertyId);
      await staff.save();
      console.log('Updated staff assignedProperties:', staff.assignedProperties);
    }

    // Update property assigned staff
    property.assignedStaff = req.params.staffId;
    await property.save();
    console.log('Updated property assignedStaff:', property.assignedStaff);

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

    console.log('GET staff assignments - staffId:', req.params.staffId, 'User ID from token:', req.user.id);
    
    // Find the staff user first to ensure we have the correct ObjectId
    const staffUser = await User.findOne({ 
      $or: [
        { _id: req.params.staffId },
        { staffId: req.params.staffId }
      ]
    });
    
    // Make sure we're using the correct staff ID (either _id or staffId)
    const staffId = staffUser ? staffUser._id : req.params.staffId;
    
    if (!staffUser) {
      console.log(`Warning: Staff user with ID ${req.params.staffId} not found`);
      // Continue with the original ID as a fallback
    }
    
    // Log the query we're about to execute
    console.log('Querying StaffAssignment with filter:', { staff: staffId });
    
    // Count all assignments first
    const totalAssignments = await StaffAssignment.countDocuments({ staff: staffId });
    console.log(`Total assignments found: ${totalAssignments}`);
    
    // Find all assignments, not just active ones
    const assignments = await StaffAssignment.find({ staff: staffId })
      .populate('property', 'title address images propertyType rooms totalAreaSqFt facing pricePerMonth description amenities')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    // Log detailed results
    console.log(`Found ${assignments.length} assignments for staff ${staffId}`);
    
    // Log the first assignment if available (for debugging)
    if (assignments.length > 0) {
      console.log('Sample assignment:', JSON.stringify({
        id: assignments[0]._id,
        propertyId: assignments[0].property?._id,
        propertyTitle: assignments[0].property?.title,
        status: assignments[0].status
      }, null, 2));
    }
    
    // Convert image paths to full URLs for each assignment
    const baseUrl = getBaseUrl(req);
    const assignmentsWithFullUrls = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      if (assignmentObj.property && assignmentObj.property.images) {
        assignmentObj.property.images = convertImagePathsToUrls(assignmentObj.property.images, baseUrl);
      }
      return assignmentObj;
    });
    
    res.json(assignmentsWithFullUrls);
  } catch (e) {
    console.error('Error fetching staff assignments:', e);
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
