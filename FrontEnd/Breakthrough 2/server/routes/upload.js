// server/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter to control what types of files are allowed
const fileFilter = (req, file, cb) => {
  // Accept images, documents, and PDFs
  const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and Microsoft Word documents are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Handle file uploads
router.post('/file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      message: 'No file uploaded or file type not allowed' 
    });
  }
  
  console.log('File uploaded:', req.file.originalname);
  
  // In a real application, you might:
  // 1. Process the file (e.g., OCR for text extraction)
  // 2. Store metadata in a database
  // 3. Perform analysis on the content
  
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    },
    message: 'File uploaded successfully'
  });
});

module.exports = router;