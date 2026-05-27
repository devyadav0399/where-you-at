const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const AVATAR_COLORS = [
  '#FF6B47','#D97706','#2563EB','#EC4899','#7C3AED',
  '#0891B2','#16A34A','#DB2777','#0D9488','#CA8A04',
];

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function deriveInitials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user._id);
  const { passwordHash: _, ...userOut } = user.toObject();
  res.json({ token, user: userOut });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password required' });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const count = await User.countDocuments();
  const color = AVATAR_COLORS[count % AVATAR_COLORS.length];
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash,
    initials: deriveInitials(name),
    color,
    baseLocation: '',
  });

  const token = signToken(user._id);
  const { passwordHash: _, ...userOut } = user.toObject();
  res.status(201).json({ token, user: userOut });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
