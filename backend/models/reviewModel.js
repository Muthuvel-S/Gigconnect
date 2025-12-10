const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ⭐ IMPORTANT ⭐

  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
