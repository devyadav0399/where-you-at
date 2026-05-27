const router = require('express').Router();
const User = require('../models/User');
const Status = require('../models/Status');
const authMiddleware = require('../middleware/auth');
const { emit } = require('../lib/socket');

// GET /api/users — all users with their current base location from Status
router.get('/', authMiddleware, async (req, res) => {
  const users = await User.find().select('-passwordHash').lean();
  const statuses = await Status.find({ userId: { $in: users.map((u) => u._id) } }).lean();
  const statusMap = Object.fromEntries(statuses.map((s) => [s.userId.toString(), s.location]));

  const fullStatusMap = Object.fromEntries(statuses.map((s) => [s.userId.toString(), s]));
  const result = users.map((u) => {
    const status = fullStatusMap[u._id.toString()];
    return {
      ...u,
      baseLocation: status?.location ?? u.baseLocation,
      lat: status?.lat ?? null,
      lng: status?.lng ?? null,
    };
  });
  res.json({ users: result });
});

// PUT /api/users/me/location
router.put('/me/location', authMiddleware, async (req, res) => {
  const { location, lat, lng } = req.body;
  if (!location) return res.status(400).json({ error: 'location required' });

  await Status.findOneAndUpdate(
    { userId: req.user._id },
    { location, lat: lat ?? null, lng: lng ?? null },
    { upsert: true, new: true },
  );

  emit('location:updated', { userId: req.user._id.toString(), location, lat: lat ?? null, lng: lng ?? null });
  res.json({ ok: true, location, lat: lat ?? null, lng: lng ?? null });
});

module.exports = router;
