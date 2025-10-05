const express = require('express');
const StaffReport = require('../models/StaffReport');
const Property = require('../models/Property');
const auth = require('../middleware/auth');

const router = express.Router();

// Get reports forwarded to the owner (owner only)
router.get('/owner/reports', auth('owner'), async (req, res) => {
  try {
    // Find all properties owned by this user
    const properties = await Property.find({ owner: req.user.id });
    const propertyIds = properties.map(p => p._id);
    
    // Find all reports for these properties that have been forwarded
    const reports = await StaffReport.find({ 
      property: { $in: propertyIds },
      status: 'forwarded',
      forwardedTo: req.user.id
    })
    .populate('property', 'title address images')
    .populate('staff', 'name email phone')
    .sort({ forwardedAt: -1 });
    
    res.json(reports);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Owner acknowledges a report
router.put('/owner/reports/:reportId/acknowledge', auth('owner'), async (req, res) => {
  try {
    const report = await StaffReport.findById(req.params.reportId)
      .populate('property');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Verify that this report is for a property owned by the user
    if (!report.property || report.property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    report.ownerAcknowledged = true;
    report.acknowledgedAt = new Date();
    await report.save();
    
    res.json(report);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;