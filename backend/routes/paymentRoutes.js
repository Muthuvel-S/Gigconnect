// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Gig = require('../models/gigModel');
const Proposal = require('../models/proposalModel');
const auth = require('../middleware/authMiddleware');
const shortid = require('shortid');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
router.post('/order', auth, async (req, res) => {
  const { gigId } = req.body;

  try {
    const gig = await Gig.findById(gigId).populate('hiredFreelancer');

    if (!gig) return res.status(404).json({ message: 'Gig not found.' });

    // Only client who posted the gig can pay
    if (gig.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to pay for this gig.' });
    }

    // Only allow payment if gig is completed
    if (gig.status !== 'completed') {
      return res.status(400).json({ message: 'Gig is not ready for payment.' });
    }

    // Get accepted proposal
    const acceptedProposal = await Proposal.findOne({ gig: gigId, status: 'accepted' });
    if (!acceptedProposal) return res.status(404).json({ message: 'No accepted proposal found.' });

    const amount = acceptedProposal.bidAmount * 100; // in paisa
    const currency = 'INR';

    const options = {
      amount,
      currency,
      receipt: shortid.generate(),
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (err) {
    console.error('Razorpay Order Error:', err.message);
    res.status(500).send('Server Error creating Razorpay order.');
  }
});

// Verify Payment
router.post('/verify', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gigId } = req.body;

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      await Gig.findByIdAndUpdate(gigId, { status: 'paid' });
      res.status(200).json({ message: 'Payment successful!' });
    } else {
      res.status(400).json({ message: 'Payment verification failed.' });
    }
  } catch (err) {
    console.error('Payment Verification Error:', err.message);
    res.status(500).json({ message: 'Server error during payment verification.' });
  }
});

module.exports = router;
