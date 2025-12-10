// routes/gigRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Gig = require('../models/gigModel');
const Proposal = require('../models/proposalModel');
const Review = require('../models/reviewModel');
const Notification = require('../models/notificationModel');
const auth = require('../middleware/authMiddleware');

// ===========================
// DASHBOARD STATS ROUTES
// ===========================

// Client: Get dashboard stats
router.get('/client/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const completed = await Gig.countDocuments({
      postedBy: userId,
      status: { $in: ['completed', 'paid', 'paidout'] },
    });

    const inProgress = await Gig.countDocuments({
      postedBy: userId,
      status: 'in progress',
    });

    const active = await Gig.countDocuments({
      postedBy: userId,
      status: 'open',
    });

    res.json({ completed, inProgress, active });
  } catch (err) {
    console.error('Client Stats Error:', err.message);
    res.status(500).send('Server Error fetching client stats.');
  }
});

// Freelancer: Get dashboard stats
router.get('/freelancer/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const completed = await Gig.countDocuments({
      hiredFreelancer: userId,
      status: { $in: ['completed', 'paid', 'paidout'] },
    });

    const inProgress = await Gig.countDocuments({
      hiredFreelancer: userId,
      status: 'in progress',
    });

    const earningsResult = await Gig.aggregate([
      {
        $match: {
          hiredFreelancer: new mongoose.Types.ObjectId(userId),
          status: { $in: ['paid', 'paidout'] },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$finalAmount' },
        },
      },
    ]);

    const earnings = earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;

    res.json({ completed, inProgress, earnings });
  } catch (err) {
    console.error('Freelancer Stats Error:', err.message);
    res.status(500).send('Server Error fetching freelancer stats.');
  }
});

// ===========================
// GIG ROUTES
// ===========================

// Browse all gigs (for freelancers)
router.get('/all', async (req, res) => {
  try {
    const { skills, location, budget } = req.query;
    let filter = { status: 'open' };

    if (skills) filter.skills = { $in: skills.split(',') };
    if (location) filter.location = { $regex: new RegExp(location, 'i') };
    if (budget) filter.budget = { $lte: parseInt(budget) };

    const gigs = await Gig.find(filter).sort({ postedAt: -1 });
    res.json(gigs);
  } catch (err) {
    console.error('Browse Gigs Error:', err.message);
    res.status(500).send('Server Error fetching gigs.');
  }
});

// ===========================
// POST NEW GIG (CLIENT)
// ===========================

router.post('/', auth, async (req, res) => {
  const { title, description, budget, duration, skills, location } = req.body;

  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can post gigs.' });
    }

    const newGig = new Gig({
      title,
      description,
      budget,
      duration,
      skills,
      location,
      postedBy: req.user.id,
    });

    const gig = await newGig.save();
    res.status(201).json(gig);
  } catch (err) {
    console.error('Gig Posting Error:', err.message);
    res.status(500).send('Server Error posting gig.');
  }
});

// ===========================
// MY GIGS (CLIENT) with review status
// ===========================

router.get('/mygigs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can view their posted gigs.' });
    }

    const gigs = await Gig.find({ postedBy: req.user.id })
      .sort({ postedAt: -1 })
      .populate('hiredFreelancer', 'username profilePicture')
      .lean();

    const gigIds = gigs.map((g) => g._id);

    const userReviews = await Review.find({
      gig: { $in: gigIds },
      reviewer: req.user.id,
    })
      .select('gig')
      .lean();

    const reviewedGigIds = new Set(userReviews.map((review) => review.gig.toString()));

    const gigsWithReviewStatus = gigs.map((gig) => ({
      ...gig,
      hasBeenReviewed: reviewedGigIds.has(gig._id.toString()),
    }));

    res.json(gigsWithReviewStatus);
  } catch (err) {
    console.error('My Gigs Error:', err.message);
    res.status(500).send('Server Error fetching gigs.');
  }
});

// ===========================
// FREELANCER: APPLIED GIGS
// ===========================

router.get('/applied', auth, async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user.id })
      .populate({
        path: 'gig',
        populate: { path: 'postedBy', select: 'username profilePicture' },
      })
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error('Applied Gigs Error:', err.message);
    res.status(500).send('Server Error fetching applied gigs.');
  }
});

// ===========================
// FREELANCER: CHECK IF APPLIED
// ===========================

router.get('/proposals/check/:gigId', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findOne({
      gig: req.params.gigId,
      freelancer: req.user.id,
    });

    res.json({ hasApplied: !!proposal });
  } catch (err) {
    console.error('Proposal Check Error:', err.message);
    res.status(500).send('Server Error checking proposal status.');
  }
});

// ===========================
// CLIENT: HIRED FREELANCERS (for "in progress" gigs)
// ===========================

router.get('/hired-freelancers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can view hired freelancers.' });
    }

    const gigs = await Gig.find({
      postedBy: req.user.id,
      status: 'in progress',
    }).populate('hiredFreelancer', 'username profilePicture');

    res.json(gigs);
  } catch (err) {
    console.error('Hired Freelancers Error:', err.message);
    res.status(500).send('Server Error fetching hired freelancers.');
  }
});

// ===========================
// GET ALL PROPOSALS FOR GIG (CLIENT)
// ===========================

router.get('/:id/proposals', auth, async (req, res) => {
  try {
    const gigId = req.params.id;
    const userId = req.user.id;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    if (gig.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view these proposals.' });
    }

    const proposals = await Proposal.find({ gig: gigId })
      .select('freelancer bidAmount message status')
      .populate('freelancer', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error('Fetch Proposals Error:', err.message);
    res.status(500).send('Server Error fetching proposals.');
  }
});

// ===========================
// FREELANCER: SUBMIT PROPOSAL
// ===========================

router.post('/:id/proposals', auth, async (req, res) => {
  const { bidAmount, message } = req.body;
  const gigId = req.params.id;
  const io = req.app.get('io');

  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can submit proposals.' });
    }

    const existingProposal = await Proposal.findOne({
      gig: gigId,
      freelancer: req.user.id,
    });

    if (existingProposal) {
      return res
        .status(400)
        .json({ message: 'You have already submitted a proposal for this gig.' });
    }

    const newProposal = new Proposal({
      gig: gigId,
      freelancer: req.user.id,
      bidAmount: parseInt(bidAmount, 10),
      message,
    });

    await newProposal.save();

    const gig = await Gig.findById(gigId);

    if (gig) {
      const notification = new Notification({
        user: gig.postedBy,
        message: `GigConnect: You have received a proposal for your gig '${gig.title}'.`,
        type: 'proposal',
      });
      await notification.save();

      if (io) {
        io.to(gig.postedBy.toString()).emit('newNotification', notification);
      }
    }

    res.status(201).json(newProposal);
  } catch (err) {
    console.error('Proposal Submission Error:', err.message);
    res.status(500).send('Server Error submitting proposal.');
  }
});

// ===========================
// ACCEPT / REJECT PROPOSALS
// ===========================

// Accept proposal
router.put('/:gigId/proposals/:proposalId/accept', auth, async (req, res) => {
  const { gigId, proposalId } = req.params;
  const io = req.app.get('io');

  try {
    const gig = await Gig.findById(gigId);
    if (!gig || gig.postedBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to accept proposals for this gig.' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({ message: 'Gig is not open for proposals.' });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal || proposal.gig.toString() !== gigId) {
      return res.status(404).json({ message: 'Proposal not found.' });
    }

    gig.status = 'in progress';
    gig.hiredFreelancer = proposal.freelancer;
    gig.finalAmount = proposal.bidAmount;
    await gig.save();

    proposal.status = 'accepted';
    await proposal.save();

    const notification = new Notification({
      user: proposal.freelancer,
      message: `GigConnect: Your proposal for gig '${gig.title}' was accepted.`,
      type: 'proposal',
    });
    await notification.save();

    if (io) {
      io.to(proposal.freelancer.toString()).emit('newNotification', notification);
    }

    res.status(200).json({ message: 'Proposal accepted successfully.' });
  } catch (err) {
    console.error('Proposal Acceptance Error:', err.message);
    res.status(500).send('Server Error accepting proposal.');
  }
});

// Reject proposal
router.put('/:gigId/proposals/:proposalId/reject', auth, async (req, res) => {
  const { gigId, proposalId } = req.params;
  const io = req.app.get('io');

  try {
    const gig = await Gig.findById(gigId);
    if (!gig || gig.postedBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to reject proposals for this gig.' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({ message: 'Gig is not open for proposals.' });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal || proposal.gig.toString() !== gigId) {
      return res.status(404).json({ message: 'Proposal not found.' });
    }

    proposal.status = 'rejected';
    await proposal.save();

    const notification = new Notification({
      user: proposal.freelancer,
      message: `GigConnect: Your proposal for gig '${gig.title}' was rejected.`,
      type: 'proposal',
    });
    await notification.save();

    if (io) {
      io.to(proposal.freelancer.toString()).emit('newNotification', notification);
    }

    res.status(200).json({ message: 'Proposal rejected successfully.' });
  } catch (err) {
    console.error('Proposal Rejection Error:', err.message);
    res.status(500).send('Server Error rejecting proposal.');
  }
});

// ===========================
// GIG STATUS UPDATES & ACTIONS
// ===========================

// Mark gig as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig || gig.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to complete this gig.' });
    }

    if (gig.status !== 'in progress') {
      return res.status(400).json({ message: 'Gig is not in progress.' });
    }

    gig.status = 'completed';
    await gig.save();

    res.status(200).json({ message: 'Gig marked as completed.' });
  } catch (err) {
    console.error('Gig Completion Error:', err.message);
    res.status(500).send('Server Error completing gig.');
  }
});

// Mark gig as paid (client)
router.put('/:id/paid', auth, async (req, res) => {
  const io = req.app.get('io');

  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig || gig.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark this gig as paid.' });
    }

    if (gig.status !== 'completed') {
      return res.status(400).json({ message: 'Gig is not completed yet.' });
    }

    gig.status = 'paid';
    await gig.save();

    if (gig.hiredFreelancer) {
      const notification = new Notification({
        user: gig.hiredFreelancer,
        message: `GigConnect: Your payment of ₹${gig.finalAmount} for gig '${gig.title}' has been processed.`,
        type: 'payment',
      });
      await notification.save();

      if (io) {
        io.to(gig.hiredFreelancer.toString()).emit('newNotification', notification);
      }
    }

    res.status(200).json({ message: 'Gig marked as paid.' });
  } catch (err) {
    console.error('Gig Paid Error:', err.message);
    res.status(500).send('Server Error marking gig as paid.');
  }
});

// ===========================
// CHECKOUT DETAILS (for Razorpay)
// ===========================

router.get('/:id/checkout-details', auth, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('hiredFreelancer', 'username');

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    // Only client can access checkout info
    if (req.user.id !== gig.postedBy.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these details.' });
    }

    res.json({
      gigDetails: gig,
      freelancerName: gig.hiredFreelancer ? gig.hiredFreelancer.username : 'N/A',
      bidAmount: gig.finalAmount || gig.budget || 0,
    });
  } catch (err) {
    console.error('Checkout Details Error:', err.message);
    res.status(500).send('Server Error fetching checkout details.');
  }
});

// ===========================
// POST a review for a completed gig
// ===========================

router.post('/:id/review', auth, async (req, res) => {
  const { rating, comment } = req.body;
  const gigId = req.params.id;
  const reviewerId = req.user.id;

  try {
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ message: 'Gig not found.' });

    if (!['completed', 'paid', 'paidout'].includes(gig.status)) {
      return res.status(400).json({ message: 'You can only review completed or paid gigs.' });
    }

    if (!gig.postedBy || !gig.hiredFreelancer) {
      return res
        .status(400)
        .json({ message: 'Cannot review a gig without a client and a hired freelancer.' });
    }

    if (
      gig.postedBy.toString() !== reviewerId &&
      gig.hiredFreelancer.toString() !== reviewerId
    ) {
      return res.status(403).json({ message: 'You are not authorized to review this gig.' });
    }

    const existingReview = await Review.findOne({ gig: gigId, reviewer: reviewerId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already submitted a review for this gig.' });
    }

    const newReview = new Review({
      gig: gigId,
      client: gig.postedBy,
      freelancer: gig.hiredFreelancer,
      reviewer: reviewerId,
      rating: Number(rating),
      comment,
    });

    await newReview.save();
    res.status(201).json({ message: 'Review submitted successfully.' });
  } catch (err) {
    console.error('Review Submission Error:', err.message);
    res.status(500).send('Server Error submitting review.');
  }
});

// ===========================
// GET all reviews for a specific freelancer
// ===========================

router.get('/freelancer/:id/reviews', async (req, res) => {
  try {
    const freelancerId = req.params.id;

    const reviews = await Review.find({ freelancer: freelancerId })
      .populate('client', 'username')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('Fetch Freelancer Reviews Error:', err.message);
    res.status(500).send('Server Error fetching reviews.');
  }
});

// ===========================
// DELETE a gig (client)
// ===========================

router.delete('/:id', auth, async (req, res) => {
  try {
    const gigId = req.params.id;
    const userId = req.user.id;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    if (gig.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this gig.' });
    }

    if (gig.status !== 'open') {
      return res
        .status(400)
        .json({ message: 'Cannot delete a gig that is in progress or has been completed.' });
    }

    await Gig.findByIdAndDelete(gigId);
    await Proposal.deleteMany({ gig: gigId });

    res.json({ message: 'Gig and all associated proposals deleted successfully.' });
  } catch (err) {
    console.error('Gig Deletion Error:', err.message);
    res.status(500).send('Server Error deleting gig.');
  }
});

// ===========================
// FINAL: GIG DETAILS ROUTE
// ===========================

router.get('/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('postedBy', 'username profilePicture')
      .populate('hiredFreelancer', 'username profilePicture');

    if (!gig) return res.status(404).json({ message: 'Gig not found.' });

    res.json(gig);
  } catch (err) {
    console.error('Gig Details Error:', err.message);
    res.status(500).send('Server Error fetching gig details.');
  }
});

module.exports = router;
