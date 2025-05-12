// authroutes/contact.js
const express = require('express');
const router = express.Router();
const { connect } = require('./db');  // make sure path is correct

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received contact data:', req.body);

    // Connect to the DB
    const db = await connect();
    console.log('✅ DB connection OK');

    // Use (or create) the "contacts" collection
    const contactsCollection = db.collection('contacts');

    // Prepare the document
    const newContact = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
      timestamp: new Date()
    };

    // Insert into Mongo
    const result = await contactsCollection.insertOne(newContact);
    console.log('✅ Inserted contact _id:', result.insertedId);

    // Respond success
    res.status(200).json({ success: true, message: 'Message saved!' });
  } catch (error) {
    console.error('❌ Error in /api/contact:', error);
    res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
  }
});

module.exports = router;
