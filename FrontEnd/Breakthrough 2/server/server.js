const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically — move this up
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is connected!' });
});

// Import routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const uploadRoutes = require('./routes/upload');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);

// Start the server — fixed backticks
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});