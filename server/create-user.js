// Usage: node create-user.js "Full Name" email password
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const AVATAR_COLORS = [
  '#FF6B47','#D97706','#2563EB','#EC4899','#7C3AED',
  '#0891B2','#16A34A','#DB2777','#0D9488','#CA8A04',
];

function deriveInitials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

const [,, name, email, password] = process.argv;
if (!name || !email || !password) {
  console.error('Usage: node create-user.js "Full Name" email@example.com password');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  if (await User.findOne({ email: email.toLowerCase() })) {
    console.error(`Error: ${email} is already registered`);
    process.exit(1);
  }
  const count = await User.countDocuments();
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    initials: deriveInitials(name),
    color: AVATAR_COLORS[count % AVATAR_COLORS.length],
    baseLocation: '',
  });
  console.log(`Created: ${user.name} (${user.email}) — color ${user.color}`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
