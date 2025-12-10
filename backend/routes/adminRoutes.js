const express = require('express');
const router = express.Router();

const User = require('../models/userModel');
const Gig = require('../models/gigModel');

const auth = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminMiddleware');


// ===============================
// PLATFORM STATS (ADMIN ONLY)
// ===============================
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalGigs: await Gig.countDocuments(),
      openGigs: await Gig.countDocuments({ status: 'open' }),
      inProgressGigs: await Gig.countDocuments({ status: 'in progress' })
    };

    res.json(stats);
  } catch (err) {
    console.error('Admin Stats Error:', err.message);
    res.status(500).send('Server Error fetching platform stats.');
  }
});


// ===============================
// GET GIGS READY FOR PAYOUT
// ===============================
// Shows gigs where:
// - status = "paid"
// - payoutProcessed = false
router.get('/payouts', auth, adminAuth, async (req, res) => {
  try {
    const gigs = await Gig.find({
      status: 'paid',
      payoutProcessed: false
    })
      .populate('hiredFreelancer', 'username upiId')
      .populate('postedBy', 'username');

    res.json(gigs);
  } catch (err) {
    console.error('Fetch Payouts Error:', err.message);
    res.status(500).send('Server Error fetching payouts.');
  }
});


// ===============================
// PROCESS PAYOUT (MARK AS PAID OUT)
// ===============================
router.put('/payouts/:id', auth, adminAuth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    if (gig.status !== 'paid') {
      return res.status(400).json({
        message: `Gig is not ready for payout. Current status: ${gig.status}`
      });
    }

    // FINAL FIX — Proper payout update
    gig.status = 'paidout';
    gig.payoutProcessed = true;

    await gig.save();

    res.status(200).json({
      message: 'Payout processed successfully. Gig now marked as Paid Out.',
      updatedGig: gig
    });
  } catch (err) {
    console.error('Payout Processing Error:', err.message);
    res.status(500).send('Server Error processing payout.');
  }
});


// ===============================
// ADMIN — GET ALL USERS
// ===============================
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Fetch Users Error:', err.message);
    res.status(500).send('Server Error fetching users.');
  }
});


// ===============================
// ADMIN — GET ALL GIGS
// ===============================
router.get('/gigs', auth, adminAuth, async (req, res) => {
  try {
    const gigs = await Gig.find()
      .populate('postedBy', 'username _id')
      .populate('hiredFreelancer', 'username _id');

    res.json(gigs);
  } catch (err) {
    console.error('Fetch Gigs Error:', err.message);
    res.status(500).send('Server Error fetching gigs.');
  }
});


// ===============================
// DELETE USER (ADMIN)
// ===============================
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete User Error:', err.message);
    res.status(500).send('Server Error deleting user.');
  }
});


// ===============================
// DELETE GIG (ADMIN)
// ===============================
router.delete('/gigs/:id', auth, adminAuth, async (req, res) => {
  try {
    const deleted = await Gig.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    res.json({ message: 'Gig deleted successfully.' });
  } catch (err) {
    console.error('Delete Gig Error:', err.message);
    res.status(500).send('Server Error deleting gig.');
  }
});


module.exports = router;
