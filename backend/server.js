const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Env
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/property_rental';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Middlewares
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Static uploads
const uploadsPath = path.join(__dirname, UPLOAD_DIR);
app.use('/uploads', express.static(uploadsPath));

// DB connect
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // Seed default admin if env provided
    const User = require('./src/models/User');
    async function ensureAdmin() {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminEmail || !adminPassword) {
        console.log('ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin seed');
        return;
      }
      const bcrypt = require('bcryptjs');
      const existing = await User.findOne({ email: adminEmail });
      if (!existing) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await User.create({
          name: process.env.ADMIN_NAME || 'Admin',
          email: adminEmail,
          passwordHash,
          role: 'admin'
        });
        console.log('Default admin created');
      } else {
        console.log('Admin already exists');
      }
    }
    await ensureAdmin();
  })
  .catch((err) => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });

// Routes
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/properties', require('./src/routes/properties'));
app.use('/api/admin', require('./src/routes/admin'));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


