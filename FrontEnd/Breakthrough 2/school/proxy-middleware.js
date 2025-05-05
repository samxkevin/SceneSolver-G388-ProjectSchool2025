const http = require('http');
const https = require('https');

/**
 * Simple proxy middleware for Express
 * This middleware forwards requests to another server
 * 
 * @param {string} target - The target URL to forward requests to
 * @returns {function} - Express middleware function
 */
function createProxyMiddleware(target) {
  return function(req, res, next) {
    // Parse the target URL
    let targetUrl = new URL(target);
    
    // Build the options for the HTTP request
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: targetUrl.pathname + req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      }
    };

    // Choose the appropriate request library based on the protocol
    const requestLib = targetUrl.protocol === 'https:' ? https : http;
    
    console.log(`[PROXY] ${req.method} ${req.url} -> ${targetUrl.protocol}//${targetUrl.host}${options.path}`);
    
    // Create the proxy request
    const proxyReq = requestLib.request(options, (proxyRes) => {
      // Copy the status code
      res.statusCode = proxyRes.statusCode;
      
      // Copy all response headers
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      // Enable CORS (important for API requests from a different origin)
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (req.headers['access-control-request-method']) {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      }
      if (req.headers['access-control-request-headers']) {
        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
      }
      
      // Pipe the response from the target server to the client
      proxyRes.pipe(res);
    });
    
    // Handle errors
    proxyReq.on('error', (err) => {
      console.error(`[PROXY ERROR] ${err.message}`);
      res.statusCode = 500;
      res.end(`Proxy error: ${err.message}`);
    });
    
    // If this is a POST/PUT/PATCH request with a body, pipe the request body to the target
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
  };
}

module.exports = { createProxyMiddleware };