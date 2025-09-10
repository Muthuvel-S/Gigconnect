// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');
const auth = require('../middleware/authMiddleware');
const User = require('../models/userModel');

// GET notifications for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    // Fetch notifications for this user
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('sender', 'username'); // populate sender's username

    // Map to include sender username in response
    const formatted = notifications.map(n => ({
      _id: n._id,
      message: n.message,
      isRead: n.isRead,
      sender: n.sender ? n.sender.username : 'System',
      type: n.type,
      createdAt: n.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch Notifications Error:', err.message);
    res.status(500).send('Server Error fetching notifications');
  }
});

// PUT mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark Notification Read Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
