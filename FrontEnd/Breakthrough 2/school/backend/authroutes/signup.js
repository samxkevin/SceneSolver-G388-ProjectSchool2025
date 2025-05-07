const express = require('express');
const bcrypt = require('bcrypt');
const { connect } = require('./db'); // Adjust the path to your db.js file

const router = express.Router();

router.post('/', async (req, res) => { // Keep the path relative to the mounted route in server.js
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Username, password, and email are required.' });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
  }

  try {
    const db = await connect();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      password: hashedPassword,
      email,
      registrationDate: new Date(),
    };

    await usersCollection.insertOne(newUser);

    res.status(201).json({ message: 'Account created successfully! You can now log in.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating account.' });
  }
});

module.exports = router;