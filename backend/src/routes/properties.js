const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const Property = require('../models/Property');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', (process.env.UPLOAD_DIR || 'uploads'));
fs.mkdirSync(uploadDir, { recursive: true });

// Get the base URL for constructing full image URLs
const getBaseUrl = (req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage, limits: { files: 5 } });

// Helper function to convert image paths to full URLs
const convertImagePathsToUrls = (images, baseUrl) => {
  if (!images || !Array.isArray(images)) return [];
  return images.map(imgPath => {
    if (imgPath.startsWith('http')) return imgPath; // Already a full URL
    return `${baseUrl}${imgPath}`;
  });
};

// Create property (user)
router.post('/', auth(), upload.array('images', 5), async (req, res) => {
  try {
    const imagePaths = (req.files || []).map((f) => `/uploads/${path.basename(f.path)}`);
    const property = await Property.create({
      title: req.body.title,
      address: req.body.address,
      pricePerMonth: Number(req.body.pricePerMonth),
      advanceAmount: Number(req.body.advanceAmount),
      totalAreaSqFt: Number(req.body.totalAreaSqFt),
      facing: req.body.facing,
      rooms: Number(req.body.rooms),
      description: req.body.description,
      images: imagePaths,
      owner: req.user.id,
      status: 'pending'
    });
    
    // Convert image paths to full URLs before sending response
    const propertyWithFullUrls = property.toObject();
    propertyWithFullUrls.images = convertImagePathsToUrls(property.images, getBaseUrl(req));
    
    res.status(201).json(propertyWithFullUrls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// List approved properties (public)
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find({ status: 'approved' }).sort({ createdAt: -1 });
    
    // Convert image paths to full URLs for all properties
    const propertiesWithFullUrls = properties.map(property => {
      const propertyObj = property.toObject();
      propertyObj.images = convertImagePathsToUrls(property.images, getBaseUrl(req));
      return propertyObj;
    });
    
    res.json(propertiesWithFullUrls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get property by id (public if approved or owner/admin)
router.get('/:id', async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    
    // Convert image paths to full URLs
    const propertyWithFullUrls = p.toObject();
    propertyWithFullUrls.images = convertImagePathsToUrls(p.images, getBaseUrl(req));
    
    res.json(propertyWithFullUrls);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create a booking (authenticated users)
router.post('/:id/book', auth(), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property || property.status !== 'approved') {
      return res.status(404).json({ message: 'Property not available' });
    }

    const { name, email, phone, startDate, message } = req.body || {};
    if (!name || !email || !phone || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const booking = await Booking.create({
      property: property._id,
      user: req.user.id,
      name,
      email,
      phone,
      startDate: new Date(startDate),
      message
    });

    res.status(201).json({ id: booking._id, message: 'Booking requested' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;


