const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup (user/owner)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'user', phone, address } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    
    // Validate role
    const allowedRoles = ['user', 'owner'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Allowed roles: user, owner' });
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
      role: user.role, 
      name: user.name, 
      email: user.email,
      phone: user.phone,
      address: user.address,
      subscriptionStatus: user.subscriptionStatus,
      staffId: user.staffId,
      specialization: user.specialization
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;


