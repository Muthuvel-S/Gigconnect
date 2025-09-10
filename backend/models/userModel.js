const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
  uid: { type: String, required: true, unique: true },
  profilePicture: { type: String, default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' },
  skills: { type: [String], default: [] },
  description: { type: String, default: '' },
  portfolio: { type: [{
    title: String,
    description: String,
    images: [String], // Store project image URLs
    link: String
  }], default: [] },
  upiId: { type: String, default: '' },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
