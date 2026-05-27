const router = require('express').Router();
const Trip = require('../models/Trip');
const authMiddleware = require('../middleware/auth');
const { emit } = require('../lib/socket');

const POPULATE = [{ path: 'going', select: '-passwordHash' }, { path: 'createdBy', select: '-passwordHash' }];

// GET /api/trips
router.get('/', authMiddleware, async (req, res) => {
  const trips = await Trip.find().populate(POPULATE).sort({ startDate: 1 });
  res.json({ trips });
});

// POST /api/trips
router.post('/', authMiddleware, async (req, res) => {
  const { name, destination, startDate, endDate, going, notes } = req.body;
  if (!name || !destination || !startDate || !endDate) {
    return res.status(400).json({ error: 'name, destination, startDate, endDate required' });
  }

  const goingIds = Array.isArray(going) ? going : [];
  if (!goingIds.includes(req.user._id.toString())) {
    goingIds.unshift(req.user._id.toString());
  }

  const { destLat, destLng } = req.body;
  const trip = await Trip.create({
    name,
    destination,
    destLat: destLat ?? null,
    destLng: destLng ?? null,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    going: goingIds,
    notes: notes || '',
    createdBy: req.user._id,
    color: req.user.color,
  });

  const populated = await trip.populate(POPULATE);
  emit('trip:created', { trip: populated });
  res.status(201).json({ trip: populated });
});

// PUT /api/trips/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not your trip' });
  }

  const { name, destination, startDate, endDate, going, notes, destLat, destLng } = req.body;
  if (name)        trip.name = name;
  if (destination) { trip.destination = destination; trip.destLat = destLat ?? null; trip.destLng = destLng ?? null; }
  if (startDate)   trip.startDate = new Date(startDate);
  if (endDate)     trip.endDate = new Date(endDate);
  if (notes !== undefined) trip.notes = notes;
  if (Array.isArray(going)) {
    const goingIds = going.includes(req.user._id.toString())
      ? going
      : [req.user._id.toString(), ...going];
    trip.going = goingIds;
  }

  await trip.save();
  const populated = await trip.populate(POPULATE);
  emit('trip:updated', { trip: populated });
  res.json({ trip: populated });
});

// DELETE /api/trips/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not your trip' });
  }

  await trip.deleteOne();
  emit('trip:deleted', { tripId: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
