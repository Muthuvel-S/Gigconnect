// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload profile picture
router.post('/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const dataURI = `data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'gigconnect-profiles' });
    res.status(200).json({ secure_url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
    res.status(500).send('Server Error uploading profile picture.');
  }
});

// Upload single project image
router.post('/project-image', upload.single('projectImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const dataURI = `data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'gigconnect-projects' });
    res.status(200).json({ secure_url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
    res.status(500).send('Server Error uploading project image.');
  }
});

module.exports = router;
