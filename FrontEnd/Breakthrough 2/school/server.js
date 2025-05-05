const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('./proxy-middleware');

// Create an Express application instance
const app = express();
const port = process.env.PORT || 3000;

// Enable parsing of JSON bodies
app.use(express.json());

// Enable parsing of URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Forward all /api/* requests to the Flask backend
app.use('/api', createProxyMiddleware('http://localhost:5000'));

// Simple route to test the server
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Express server is running',
    timestamp: new Date().toISOString()
  });
});

// For any other routes, serve the React app (if using a React frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- API proxy: forwarding /api/* requests to http://localhost:5000`);
});