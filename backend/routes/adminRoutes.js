const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Gig = require('../models/gigModel');
const auth = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminMiddleware');

// Platform stats
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGigs = await Gig.countDocuments();
    const openGigs = await Gig.countDocuments({ status: 'open' });
    const inProgressGigs = await Gig.countDocuments({ status: 'in progress' });

    res.json({ totalUsers, totalGigs, openGigs, inProgressGigs });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching platform stats.');
  }
});

// Get gigs ready for payout
router.get('/payouts', auth, adminAuth, async (req, res) => {
  try {
    const gigs = await Gig.find({ status: 'paid', payoutProcessed: false })
      .populate('hiredFreelancer', 'username upiId');
    res.json(gigs);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching payouts.');
  }
});

// Process payout
router.put('/payouts/:id', auth, adminAuth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig || gig.status !== 'paid') {
      return res.status(400).json({ message: 'Gig is not ready for payout.' });
    }

    await Gig.findByIdAndUpdate(req.params.id, { payoutProcessed: true });
    res.status(200).json({ message: 'Payout processed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error processing payout.');
  }
});

// Admin user and gig management routes
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching users.');
  }
});

router.get('/gigs', auth, adminAuth, async (req, res) => {
  try {
    const gigs = await Gig.find().populate('hiredFreelancer', 'username');
    res.json(gigs);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching gigs.');
  }
});

router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error deleting user.');
  }
});

router.delete('/gigs/:id', auth, adminAuth, async (req, res) => {
  try {
    const gig = await Gig.findByIdAndDelete(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found.' });
    res.json({ message: 'Gig deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error deleting gig.');
  }
});

module.exports = router;
