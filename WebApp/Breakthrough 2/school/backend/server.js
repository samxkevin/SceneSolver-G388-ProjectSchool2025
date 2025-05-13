// server.js
const express = require('express');
const app = express();
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

// DB
const { connect } = require('./authroutes/db');
connect()
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ DB connection failed:', err));

// Routes
const signupRoutes = require('./authroutes/signup');
const loginRoutes = require('./authroutes/login');
const forgotPasswordRoutes = require('./authroutes/forgotpassword');
const contactRoutes = require('./authroutes/contact'); // ✅ make sure this is contactRoutes

app.use('/api/signup', signupRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/forgotpassword', forgotPasswordRoutes);
app.use('/api/reset-password', forgotPasswordRoutes); // optional
app.use('/api/contact', contactRoutes); // ✅ this one matters

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
