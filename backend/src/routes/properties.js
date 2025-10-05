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
      status: 'pending',
      // Location details
      location: {
        city: req.body.city || '',
        state: req.body.state || '',
        area: req.body.area || '',
        pincode: req.body.pincode || '',
      }
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

// Get properties for current authenticated owner (includes pending/rejected)
router.get('/my', auth(), async (req, res) => {
  try {
    console.log('GET /api/properties/my - authenticated user:', req.user && req.user.id);
    const properties = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 });
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

// Create a booking (authenticated users)
router.post('/:id/book', auth(), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property || property.status !== 'approved') {
      return res.status(404).json({ message: 'Property not available' });
    }

    const { 
      name, 
      email, 
      phone, 
      startDate, 
      message, 
      termsAccepted, 
      paymentMethod, 
      paymentTransactionId 
    } = req.body || {};
    
    // Validate required fields
    if (!name || !email || !phone || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Ensure terms and conditions are accepted
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions to proceed' });
    }

    // Create booking with status based on payment
    const advanceAmount = property.advanceAmount;
    let status = 'pending_payment';
    let paymentStatus = 'not_paid';
    
    // If payment details are provided, set payment status as pending
    if (paymentMethod && paymentTransactionId) {
      paymentStatus = 'pending';
    }

    const booking = await Booking.create({
      property: property._id,
      user: req.user.id,
      name,
      email,
      phone,
      startDate: new Date(startDate),
      message,
      termsAccepted,
      status,
      paymentStatus,
      advanceAmount,
      paymentMethod,
      paymentTransactionId
    });

    res.status(201).json({ 
      id: booking._id, 
      message: 'Booking initiated. Please complete the advance payment to confirm your booking.',
      advanceAmount
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Submit a support request for a booking
router.post('/bookings/:bookingId/support', auth(), async (req, res) => {
  try {
    const { type, description } = req.body || {};
    
    if (!type || !description) {
      return res.status(400).json({ message: 'Support request type and description are required' });
    }
    
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify that the user is the one who made the booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Add the support request to the booking
    const supportRequest = {
      type,
      description,
      status: 'pending',
      createdAt: new Date()
    };
    
    booking.supportRequests = booking.supportRequests || [];
    booking.supportRequests.push(supportRequest);
    await booking.save();
    
    // If it's an emergency, also create a maintenance request
    if (type === 'emergency') {
      // You would typically create a maintenance request here
      // This would depend on your maintenance model and workflow
    }
    
    res.status(201).json({ 
      message: 'Support request submitted successfully',
      requestId: booking.supportRequests[booking.supportRequests.length - 1]._id
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Complete payment for a booking
router.post('/bookings/:bookingId/payment', auth(), async (req, res) => {
  try {
    const { paymentMethod, paymentTransactionId } = req.body || {};
    
    if (!paymentMethod || !paymentTransactionId) {
      return res.status(400).json({ message: 'Payment method and transaction ID are required' });
    }
    
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify that the user is the one who made the booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update the payment status
    booking.paymentStatus = 'completed';
    booking.status = 'payment_completed';
    booking.paymentMethod = paymentMethod;
    booking.paymentTransactionId = paymentTransactionId;
    await booking.save();
    
    res.json({ message: 'Payment recorded successfully. Your booking is now awaiting confirmation.' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;


