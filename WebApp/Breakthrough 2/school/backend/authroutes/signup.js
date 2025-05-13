// signup.js
const express = require('express');
const bcrypt = require('bcrypt');
const { connect } = require('./db'); // Assuming db.js is in the same directory

const router = express.Router();

router.post('/', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Please provide username, password, and email.' });
    }

    try {
        const db = await connect();
        const users = db.collection('users');

        // Check if the username or email already exists
        const existingUser = await users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document
        const newUser = {
            username,
            password: hashedPassword,
            email,
            registrationDate: new Date(),
        };

        // Insert the new user into the database
        const result = await users.insertOne(newUser);

        if (result.insertedId) {
            return res.status(201).json({ message: 'Signup successful! You can now log in.' });
        } else {
            return res.status(500).json({ message: 'Failed to create user. Please try again.' });
        }

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Failed to connect to the database.' });
    }
});

module.exports = router;