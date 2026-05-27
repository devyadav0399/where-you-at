const mongoose = require('mongoose');

// One record per user — upserted on location update.
// Represents the user's manually-set base location.
const statusSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  location: { type: String, default: '' },
  lat:      { type: Number, default: null },
  lng:      { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Status', statusSchema);
