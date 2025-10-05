const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup (user/owner/staff)
router.post('/signup', async (req, res) => {
  try {
    // Log incoming signup payload for debugging (will include role)
    console.log('POST /api/auth/signup - body:', req.body);
    const { name, email, password, role = 'user', phone, address } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Validate role
    const allowedRoles = ['user', 'owner', 'staff'];
    if (!allowedRoles.includes(role)) {
      console.log('Signup - invalid role received:', role);
      return res.status(400).json({ message: 'Invalid role. Allowed roles: user, owner, staff' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      passwordHash, 
      role,
      phone,
      address
    });
    
    res.status(201).json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Login (user/admin/owner/staff)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ 
      id: user._id, 
      role: user.role, 
      email: user.email 
  }, process.env.JWT_SECRET || 'supersecretchangeme', { expiresIn: '30d' });
    
    res.json({ 
      token, 
      id: user._id, // Include user ID in response
      role: user.role, 
      name: user.name, 
      email: user.email,
      phone: user.phone,
      address: user.address,
      subscriptionStatus: user.subscriptionStatus,
      staffId: user.staffId || user._id, // Ensure staffId is available and defaults to _id
      specialization: user.specialization
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;


