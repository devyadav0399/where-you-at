require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Trip = require('./models/Trip');
const Status = require('./models/Status');

// Design-faithful sample data — same cast as the Claude Design prototype.
const FRIENDS_SEED = [
  { name: 'Vikram Khanna',  email: 'vikram@thegang.co',  color: '#FF6B47', base: 'Bengaluru, IN' },
  { name: 'Priya Sharma',   email: 'priya@thegang.co',   color: '#D97706', base: 'Delhi, IN' },
  { name: 'Rahul Mehta',    email: 'rahul@thegang.co',   color: '#2563EB', base: 'Bengaluru, IN' },
  { name: 'Aanya Kapoor',   email: 'aanya@thegang.co',   color: '#EC4899', base: 'Bengaluru, IN' },
  { name: 'Karan Singh',    email: 'karan@thegang.co',   color: '#7C3AED', base: 'Delhi, IN' },
  { name: 'Meera Reddy',    email: 'meera@thegang.co',   color: '#0891B2', base: 'Hyderabad, IN' },
  { name: 'Ishaan Joshi',   email: 'ishaan@thegang.co',  color: '#16A34A', base: 'Mumbai, IN' },
  { name: 'Tara Iyer',      email: 'tara@thegang.co',    color: '#DB2777', base: 'Pune, IN' },
  { name: 'Devraj Nair',    email: 'devraj@thegang.co',  color: '#0D9488', base: 'Kochi, IN' },
  { name: 'Sana Qureshi',   email: 'sana@thegang.co',    color: '#CA8A04', base: 'Mumbai, IN' },
];

function initials(name) {
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing existing data...');
  await Promise.all([User.deleteMany(), Trip.deleteMany(), Status.deleteMany()]);

  const hash = await bcrypt.hash('password123', 10);

  const users = await User.insertMany(
    FRIENDS_SEED.map((f) => ({
      name: f.name,
      email: f.email,
      passwordHash: hash,
      initials: initials(f.name),
      color: f.color,
      baseLocation: f.base,
    })),
  );

  // Seed Status records (base locations)
  await Status.insertMany(users.map((u) => ({ userId: u._id, location: u.baseLocation })));

  const byEmail = Object.fromEntries(users.map((u) => [u.email.split('@')[0], u]));
  const year = new Date().getFullYear();
  const d = (mo, day) => new Date(year, mo - 1, day);

  const trips = [
    {
      name: 'Annapurna Circuit', destination: 'Annapurna Circuit, NP',
      startDate: d(6, 9), endDate: d(6, 16),
      going: [byEmail.priya._id],
      color: byEmail.priya.color,
      notes: '7-day trek. Patchy signal above 3,500m.',
      createdBy: byEmail.priya._id,
    },
    {
      name: 'Goa Weekend', destination: 'North Goa, IN',
      startDate: d(6, 14), endDate: d(6, 16),
      going: [byEmail.karan._id, byEmail.aanya._id, byEmail.vikram._id],
      color: byEmail.karan.color,
      notes: 'Villa in Assagao. Quick break.',
      createdBy: byEmail.karan._id,
    },
    {
      name: 'Ladakh Bike Trip', destination: 'Leh → Pangong, IN',
      startDate: d(7, 5), endDate: d(7, 12),
      going: [byEmail.rahul._id, byEmail.ishaan._id, byEmail.vikram._id],
      color: byEmail.rahul.color,
      notes: 'Royal Enfields from Leh. Acclimatize day 1–2.',
      createdBy: byEmail.rahul._id,
    },
    {
      name: 'Tokyo Work Week', destination: 'Tokyo, JP',
      startDate: d(5, 24), endDate: d(5, 31),
      going: [byEmail.ishaan._id],
      color: byEmail.ishaan.color,
      notes: 'WFH from Shibuya.',
      createdBy: byEmail.ishaan._id,
    },
    {
      name: 'Lisbon Stay', destination: 'Lisbon, PT',
      startDate: d(5, 12), endDate: d(6, 28),
      going: [byEmail.sana._id],
      color: byEmail.sana.color,
      notes: 'Slow-travel month #2. Visitors welcome.',
      createdBy: byEmail.sana._id,
    },
    {
      name: 'Hampi', destination: 'Hampi, IN',
      startDate: d(8, 2), endDate: d(8, 5),
      going: [byEmail.tara._id, byEmail.devraj._id, byEmail.vikram._id],
      color: byEmail.tara.color,
      notes: 'Sunrise at Matanga Hill. Coracle ride day 2.',
      createdBy: byEmail.tara._id,
    },
  ];

  await Trip.insertMany(trips);
  console.log(`Seeded ${users.length} users and ${trips.length} trips.`);
  console.log('Login: vikram@thegang.co / password123');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
