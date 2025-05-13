const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // For generating secure random tokens
const { connect } = require('./db');
const nodemailer = require('nodemailer'); // For sending emails

const router = express.Router();

// Configure Nodemailer (replace with your email service details)
const transporter = nodemailer.createTransport({
    service: 'YourEmailService', // e.g., 'Gmail', 'Outlook'
    auth: {
        user: 'your-email@example.com',
        pass: 'your-email-password',
    },
});

// Route for handling the "Forgot Password" request
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const db = await connect();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email not found.' });
        }

        // Generate a unique reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Set token and expiry in the user document
        const tokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { resetToken, resetTokenExpiry: tokenExpiry } }
        );

        // Create a password reset link
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}&email=${email}`; // Adjust the frontend URL

        // Send the reset link via email
        const mailOptions = {
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You are receiving this email because you (or someone else) have requested the reset of your account password.</p>
                   <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                   <a href="${resetLink}">${resetLink}</a>
                   <p>This link will expire in 1 hour.</p>
                   <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending reset email:', error);
                return res.status(500).json({ message: 'Failed to send password reset email.' });
            }
            console.log('Password reset email sent:', info.response);
            res.json({ message: 'Password reset email sent successfully. Please check your inbox.' });
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing forgot password request.' });
    }
});

// Route for handling the password reset (after the user clicks the link)
router.post('/reset-password', async (req, res) => {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
        return res.status(400).json({ message: 'Token, email, and new password are required.' });
    }

    try {
        const db = await connect();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({
            email,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password and clear the reset token fields
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword, resetToken: null, resetTokenExpiry: null } }
        );

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password.' });
    }
});

module.exports = router;