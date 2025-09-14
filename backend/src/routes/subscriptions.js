const express = require('express');
const Subscription = require('../models/Subscription');
const Property = require('../models/Property');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = {
    basic: {
      name: 'Basic Plan',
      price: 29.99,
      features: [
        'Property listing',
        'Basic analytics',
        'Email support',
        'Up to 2 properties'
      ],
      limits: {
        properties: 2,
        staffAssignments: 0,
        maintenanceTracking: false
      }
    },
    premium: {
      name: 'Premium Plan',
      price: 59.99,
      features: [
        'Property listing',
        'Advanced analytics',
        'Staff assignment',
        'Maintenance tracking',
        'Priority support',
        'Up to 10 properties'
      ],
      limits: {
        properties: 10,
        staffAssignments: 5,
        maintenanceTracking: true
      }
    },
    enterprise: {
      name: 'Enterprise Plan',
      price: 99.99,
      features: [
        'Unlimited properties',
        'Advanced analytics',
        'Staff assignment',
        'Maintenance tracking',
        'Custom reports',
        '24/7 support',
        'API access'
      ],
      limits: {
        properties: -1, // unlimited
        staffAssignments: -1, // unlimited
        maintenanceTracking: true
      }
    }
  };
  
  res.json(plans);
});

// Create subscription
router.post('/', auth(), async (req, res) => {
  try {
    const { propertyId, planType, paymentMethod, transactionId } = req.body;
    
    if (!propertyId || !planType) {
      return res.status(400).json({ message: 'Property ID and plan type are required' });
    }

    // Check if property exists and belongs to user
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to subscribe for this property' });
    }

    // Check if property already has active subscription
    const existingSubscription = await Subscription.findOne({
      property: propertyId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'Property already has an active subscription' });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Get plan pricing
    const plans = {
      basic: 29.99,
      premium: 59.99,
      enterprise: 99.99
    };

    const subscription = await Subscription.create({
      user: req.user.id,
      property: propertyId,
      planType,
      startDate,
      endDate,
      amount: plans[planType],
      paymentMethod,
      transactionId,
      paymentStatus: 'paid' // In real app, verify payment first
    });

    // Update property with subscription info
    await Property.findByIdAndUpdate(propertyId, {
      hasSubscription: true,
      subscriptionType: planType
    });

    // Update user subscription status
    await User.findByIdAndUpdate(req.user.id, {
      subscriptionStatus: 'active',
      subscriptionExpiry: endDate
    });

    res.status(201).json(subscription);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get user's subscriptions
router.get('/my-subscriptions', auth(), async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('property', 'title address images')
      .sort({ createdAt: -1 });
    
    res.json(subscriptions);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Cancel subscription
router.post('/:id/cancel', auth(), async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Update property
    await Property.findByIdAndUpdate(subscription.property, {
      hasSubscription: false,
      subscriptionType: 'basic'
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get subscription details
router.get('/:id', auth(), async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('property', 'title address images')
      .populate('user', 'name email');
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(subscription);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
