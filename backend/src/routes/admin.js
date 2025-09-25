const express = require('express');
const Property = require('../models/Property');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to convert image paths to full URLs
const convertImagePathsToUrls = (images, baseUrl) => {
  if (!images || !Array.isArray(images)) return [];
  return images.map(imgPath => {
    if (imgPath.startsWith('http')) return imgPath; // Already a full URL
    return `${baseUrl}${imgPath}`;
  });
};

// Get the base URL for constructing full image URLs
const getBaseUrl = (req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

// List pending properties (admin)
router.get('/pending', auth('admin'), async (req, res) => {
  try {
    const list = await Property.find({ status: 'pending' })
      .populate('owner', 'name email phone address')
      .sort({ createdAt: -1 });
    
    // Convert image paths to full URLs for all properties
    const listWithFullUrls = list.map(property => {
      const propertyObj = property.toObject();
      propertyObj.images = convertImagePathsToUrls(property.images, getBaseUrl(req));
      return propertyObj;
    });
    
    res.json(listWithFullUrls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Approve property
router.post('/:id/approve', auth('admin'), async (req, res) => {
  try {
    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    
    // Convert image paths to full URLs
    const propertyWithFullUrls = updated.toObject();
    propertyWithFullUrls.images = convertImagePathsToUrls(updated.images, getBaseUrl(req));
    
    res.json(propertyWithFullUrls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Reject property
router.post('/:id/reject', auth('admin'), async (req, res) => {
  try {
    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    
    // Convert image paths to full URLs
    const propertyWithFullUrls = updated.toObject();
    propertyWithFullUrls.images = convertImagePathsToUrls(updated.images, getBaseUrl(req));
    
    res.json(propertyWithFullUrls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
// Assign property to admin (self-assign)
router.post('/:id/assign-to-admin', auth('admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    // Assign the property to the current admin
    property.owner = req.user.id;
    await property.save();
    res.json({ message: 'Property assigned to admin', property });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

// Delete property (admin)
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Not found' });

    // Attempt to remove image files if they are stored locally
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '..', '..', (process.env.UPLOAD_DIR || 'uploads'));

    (property.images || []).forEach((imgPath) => {
      try {
        if (imgPath && !imgPath.startsWith('http')) {
          const filename = path.basename(imgPath);
          const fullPath = path.join(uploadsDir, filename);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
      } catch (_) {}
    });

    await property.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


