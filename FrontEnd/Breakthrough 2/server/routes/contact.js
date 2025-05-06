// server/routes/contact.js
const express = require('express');
const router = express.Router();

// Handle contact form submissions
router.post('/submit', (req, res) => {
  const contactData = req.body;
  
  // Log the received data
  console.log('Contact form submission received:');
  console.log('Name:', contactData.name);
  console.log('Email:', contactData.email);
  console.log('Phone:', contactData.phone);
  console.log('Message:', contactData.message);
  
  // In a real application, you would:
  // 1. Validate the data
  // 2. Store it in a database
  // 3. Send notification emails
  // 4. Etc.
  
  // For now, just send a success response
  res.json({ 
    success: true, 
    message: 'Contact form submitted successfully' 
  });
});

module.exports = router;