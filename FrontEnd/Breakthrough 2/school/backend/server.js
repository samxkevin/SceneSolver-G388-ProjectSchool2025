const express = require('express');
const app = express();
const cors = require('cors');
const signupRoutes = require('./authroutes/signup'); // Corrected path
const loginRoutes = require('./authroutes/login');   // Corrected path
const forgotPasswordRoutes = require('./authroutes/forgotpassword'); // Import forgot password routes

app.use(cors());
app.use(express.json());

app.use('/api/signup', signupRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/forgotpassword', forgotPasswordRoutes); // Mount forgot password routes
app.use('/api/reset-password', forgotPasswordRoutes); // Mount reset password routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});