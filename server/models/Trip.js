const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  destination: { type: String, required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  going:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  destLat:     { type: Number, default: null },
  destLng:     { type: Number, default: null },
  notes:       { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  color:       { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
