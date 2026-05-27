const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  initials:     { type: String, required: true },
  color:        { type: String, required: true },
  baseLocation: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
