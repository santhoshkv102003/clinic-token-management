import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] }
});

const PORT        = process.env.PORT        || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-token-system';
const JWT_SECRET  = process.env.JWT_SECRET  || 'clinic_jwt_secret_key_2025';

// ─── Mongoose Models ──────────────────────────────────────────────────────────

const clinicSchema = new mongoose.Schema({
  clinicId:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  clinicName:  { type: String, required: true, trim: true },
  doctorName:  { type: String, required: true, trim: true },
  phone:       { type: String, default: '' },
  address:     { type: String, default: '' },
  status:      { type: String, enum: ['Open','Closed'], default: 'Open' },
  featured:    { type: Boolean, default: false },
  currentToken:{ type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['SUPER_ADMIN','CLINIC_ADMIN'], required: true },
  clinicId: { type: String, default: null }
});

const tokenSchema = new mongoose.Schema({
  clinicId:    { type: String, required: true, uppercase: true, trim: true },
  tokenNumber: { type: Number, required: true },
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  age:         { type: Number },
  department:  { type: String, trim: true },
  status:      { type: String, enum: ['Waiting','Serving','Completed'], default: 'Waiting' },
  bookedAt:    { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const Clinic = mongoose.model('Clinic', clinicSchema);
const User   = mongoose.model('User',   userSchema);
const Token  = mongoose.model('Token',  tokenSchema);

// ─── MongoDB Connection ───────────────────────────────────────────────────────

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected:', MONGODB_URI);
    await seedData();
  })
  .catch(err => console.error('❌ MongoDB error:', err));

async function seedData() {
  // Seed clinics if none exist
  const clinicCount = await Clinic.countDocuments();
  if (clinicCount === 0) {
    const clinics = [
      { clinicId:'C001', clinicName:'Thiru Hospital Clinic',       doctorName:'Dr. Kumar',     featured:true  },
      { clinicId:'C002', clinicName:'Nalam Hospital Clinic',        doctorName:'Dr. Priya',     featured:true  },
      { clinicId:'C003', clinicName:'Dr. Karthik Clinic',           doctorName:'Dr. Karthik',   featured:true  },
      { clinicId:'C004', clinicName:'Sri Lakshmi Hospital Clinic',  doctorName:'Dr. Lakshmi',   featured:false },
      { clinicId:'C005', clinicName:'Annai Hospital Clinic',        doctorName:'Dr. Annamalai', featured:false },
      { clinicId:'C006', clinicName:'Surya Multispeciality Clinic', doctorName:'Dr. Surya',     featured:false },
      { clinicId:'C007', clinicName:'Arogya Care Clinic',           doctorName:'Dr. Arogya',    featured:false },
      { clinicId:'C008', clinicName:'Vasanth Hospital Clinic',      doctorName:'Dr. Vasanth',   featured:false },
      { clinicId:'C009', clinicName:'Sree Ram Clinic',              doctorName:'Dr. Ram',       featured:false },
      { clinicId:'C010', clinicName:'Shree Medical Clinic',         doctorName:'Dr. Shree',     featured:false },
    ];
    await Clinic.insertMany(clinics);
    console.log('🏥 Seeded 10 clinics');
  }

  // Seed users if none exist
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    const users = [
      { name:'Super Admin',  email:'superadmin@clinic.com', password: await bcrypt.hash('super123',10),  role:'SUPER_ADMIN', clinicId: null },
      { name:'Kumar',        email:'kumar@c001.com',        password: hash, role:'CLINIC_ADMIN', clinicId:'C001' },
      { name:'Priya',        email:'priya@c002.com',        password: hash, role:'CLINIC_ADMIN', clinicId:'C002' },
      { name:'Dr. Karthik',  email:'karthik@c003.com',      password: hash, role:'CLINIC_ADMIN', clinicId:'C003' },
    ];
    await User.insertMany(users);
    console.log('👤 Seeded users:');
    console.log('   superadmin@clinic.com / super123 (SUPER_ADMIN)');
    console.log('   kumar@c001.com / admin123 (C001)');
    console.log('   priya@c002.com / admin123 (C002)');
    console.log('   karthik@c003.com / admin123 (C003)');
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// JWT auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Only Super Admin
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'SUPER_ADMIN')
    return res.status(403).json({ error: 'Super Admin access required' });
  next();
}

// Clinic Admin can only access their own clinic; Super Admin can access all
function requireClinicAccess(req, res, next) {
  const clinicId = (req.params.clinicId || req.body.clinicId || '').toUpperCase();
  if (req.user?.role === 'SUPER_ADMIN') return next();
  if (req.user?.role === 'CLINIC_ADMIN' && req.user.clinicId === clinicId) return next();
  return res.status(403).json({ error: 'Forbidden: You can only access your own clinic' });
}

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', socket => {
  socket.on('join-clinic',  cid => socket.join(`clinic:${cid}`));
  socket.on('leave-clinic', cid => socket.leave(`clinic:${cid}`));
});

async function emitClinicUpdate(clinicId) {
  const clinic = await Clinic.findOne({ clinicId });
  const tokens = await Token.find({ clinicId }).sort({ tokenNumber: 1 });
  io.to(`clinic:${clinicId}`).emit('queue:update', { clinic, tokens });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role, clinicId: user.clinicId },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // If clinic admin, also fetch clinic info
    let clinic = null;
    if (user.role === 'CLINIC_ADMIN' && user.clinicId) {
      clinic = await Clinic.findOne({ clinicId: user.clinicId });
    }

    res.json({
      token,
      user: { name: user.name, email: user.email, role: user.role, clinicId: user.clinicId },
      clinic
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET current user info (validate token)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    let clinic = null;
    if (user.role === 'CLINIC_ADMIN' && user.clinicId)
      clinic = await Clinic.findOne({ clinicId: user.clinicId });
    res.json({ user, clinic });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUBLIC Clinic APIs (no auth needed) ─────────────────────────────────────

// GET public homepage summary (total / open / closed counts)
app.get('/api/clinics/summary', async (req, res) => {
  try {
    const totalClinics  = await Clinic.countDocuments();
    const openClinics   = await Clinic.countDocuments({ status: 'Open' });
    const closedClinics = await Clinic.countDocuments({ status: 'Closed' });
    res.json({ totalClinics, openClinics, closedClinics });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET top 3 busiest clinics (by waiting + serving token count)
// Falls back to featured clinics if no activity
app.get('/api/clinics/top3', async (req, res) => {
  try {
    // Aggregate: count active tokens per clinic
    const activity = await Token.aggregate([
      { $match: { status: { $in: ['Waiting', 'Serving'] } } },
      { $group: { _id: '$clinicId', activeCount: { $sum: 1 } } },
      { $sort: { activeCount: -1 } },
      { $limit: 3 }
    ]);

    let clinics = [];
    if (activity.length > 0) {
      // Fetch clinics in activity order
      const ids = activity.map(a => a._id);
      const found = await Clinic.find({ clinicId: { $in: ids } });
      // Sort by activity order
      clinics = ids.map(id => found.find(c => c.clinicId === id)).filter(Boolean);
    }

    // Pad to 3 using featured clinics if needed
    if (clinics.length < 3) {
      const existingIds = clinics.map(c => c.clinicId);
      const extras = await Clinic.find({
        featured: true,
        clinicId: { $nin: existingIds }
      }).limit(3 - clinics.length);
      clinics = [...clinics, ...extras];
    }

    // Still pad with any open clinics
    if (clinics.length < 3) {
      const existingIds = clinics.map(c => c.clinicId);
      const extras = await Clinic.find({
        status: 'Open',
        clinicId: { $nin: existingIds }
      }).limit(3 - clinics.length);
      clinics = [...clinics, ...extras];
    }

    const result = await Promise.all(clinics.map(enrichClinic));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET featured clinics (used by super admin / legacy)
app.get('/api/clinics/featured', async (req, res) => {
  try {
    const clinics = await Clinic.find({ featured: true }).sort({ clinicId: 1 }).limit(3);
    const result  = await Promise.all(clinics.map(enrichClinic));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET search clinics (returns all clinics in alphabetical order if q is empty, or filtered A-Z)
app.get('/api/clinics/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let query = {};
    if (q) {
      query = {
        $or: [
          { clinicName: { $regex: q, $options: 'i' } },
          { doctorName: { $regex: q, $options: 'i' } },
          { clinicId:   { $regex: q, $options: 'i' } },
        ]
      };
    }
    const clinics = await Clinic.find(query).sort({ clinicName: 1 });
    const result = await Promise.all(clinics.map(enrichClinic));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET one clinic (public)
app.get('/api/clinics/:clinicId', async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ clinicId: req.params.clinicId.toUpperCase() });
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    res.json(await enrichClinic(clinic));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET clinic queue (public — for live display)
app.get('/api/clinics/:clinicId/queue', async (req, res) => {
  try {
    const clinicId = req.params.clinicId.toUpperCase();
    const clinic   = await Clinic.findOne({ clinicId });
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    const tokens   = await Token.find({ clinicId }).sort({ tokenNumber: 1 });
    res.json({ clinic, tokens });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST book token (public — patients book)
app.post('/api/tokens', async (req, res) => {
  try {
    const { clinicId, name, phone, age, department } = req.body;
    if (!clinicId || !name || !phone)
      return res.status(400).json({ error: 'clinicId, name and phone required' });
    const cid    = clinicId.toUpperCase();
    const clinic = await Clinic.findOne({ clinicId: cid });
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    if (clinic.status === 'Closed') return res.status(400).json({ error: 'Clinic is closed' });
    const last   = await Token.findOne({ clinicId: cid }).sort({ tokenNumber: -1 });
    const number = last ? last.tokenNumber + 1 : 1;
    const token  = await Token.create({ clinicId: cid, tokenNumber: number, name, phone, age, department });
    await emitClinicUpdate(cid);
    res.status(201).json(token);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PROTECTED Clinic APIs (auth + clinic access) ────────────────────────────

// GET all clinics — Super Admin only
app.get('/api/clinics', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const clinics = await Clinic.find().sort({ clinicName: 1 });
    const result  = await Promise.all(clinics.map(enrichClinic));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create clinic — Super Admin only
app.post('/api/clinics', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { clinicName, doctorName, phone, address, status, featured } = req.body;
    let { adminName, adminEmail, adminPassword } = req.body;

    if (!clinicName || !doctorName)
      return res.status(400).json({ error: 'clinicName and doctorName are required' });

    // Auto-generate clinicId
    const last = await Clinic.findOne().sort({ clinicId: -1 });
    let nextNum = 1;
    if (last && last.clinicId) {
      const num = parseInt(last.clinicId.replace('C', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const clinicId = 'C' + String(nextNum).padStart(3, '0');

    // Auto-fill admin details if not supplied
    if (!adminName) adminName = doctorName;
    if (!adminEmail) adminEmail = `admin.${clinicId.toLowerCase()}@clinic.com`;
    if (!adminPassword) adminPassword = 'admin123';

    // Check email not taken
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) return res.status(409).json({ error: 'Admin email already exists' });

    const clinic = await Clinic.create({ clinicId, clinicName, doctorName, phone: phone||'', address: address||'', status: status||'Open', featured: featured||false });
    const hash   = await bcrypt.hash(adminPassword, 10);
    await User.create({ name: adminName, email: adminEmail.toLowerCase(), password: hash, role: 'CLINIC_ADMIN', clinicId });

    res.status(201).json({ clinic, message: `Clinic ${clinicId} created with admin ${adminEmail}` });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Duplicate entry' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update clinic
app.put('/api/clinics/:clinicId', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const { clinicName, doctorName, phone, address, status, featured } = req.body;
    const clinic = await Clinic.findOneAndUpdate(
      { clinicId: req.params.clinicId.toUpperCase() },
      { clinicName, doctorName, phone, address, status, featured },
      { new: true, runValidators: true }
    );
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    await emitClinicUpdate(clinic.clinicId);
    res.json(clinic);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE clinic — Super Admin only
app.delete('/api/clinics/:clinicId', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const id = req.params.clinicId.toUpperCase();
    await Clinic.findOneAndDelete({ clinicId: id });
    await Token.deleteMany({ clinicId: id });
    await User.deleteMany({ clinicId: id, role: 'CLINIC_ADMIN' });
    res.json({ message: 'Clinic and related data deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET clinic stats (protected)
app.get('/api/clinics/:clinicId/stats', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const clinicId  = req.params.clinicId.toUpperCase();
    const waiting   = await Token.countDocuments({ clinicId, status: 'Waiting' });
    const serving   = await Token.countDocuments({ clinicId, status: 'Serving' });
    const completed = await Token.countDocuments({ clinicId, status: 'Completed' });
    res.json({ clinicId, waiting, serving, completed, estimatedWait: waiting * 5 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST call next patient (protected) — atomic to prevent race conditions
app.post('/api/clinics/:clinicId/next', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.params.clinicId.toUpperCase();
    const clinic   = await Clinic.findOne({ clinicId });
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });

    // Atomically complete current serving token
    await Token.findOneAndUpdate(
      { clinicId, status: 'Serving' },
      { $set: { status: 'Completed', completedAt: new Date() } }
    );

    // Atomically grab the next waiting token — prevents double-assignment
    const next = await Token.findOneAndUpdate(
      { clinicId, status: 'Waiting' },
      { $set: { status: 'Serving' } },
      { sort: { tokenNumber: 1 }, new: true }
    );

    clinic.currentToken = next ? next.tokenNumber : 0;
    await clinic.save();
    await emitClinicUpdate(clinicId);
    res.json({ currentToken: clinic.currentToken, next: next || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST reset queue (protected)
app.post('/api/clinics/:clinicId/reset', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const clinicId = req.params.clinicId.toUpperCase();
    await Token.deleteMany({ clinicId });
    await Clinic.findOneAndUpdate({ clinicId }, { currentToken: 0 });
    await emitClinicUpdate(clinicId);
    res.json({ message: 'Queue reset' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update token status (protected)
app.put('/api/tokens/:tokenId', authMiddleware, async (req, res) => {
  try {
    const token = await Token.findById(req.params.tokenId);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    // Clinic admin can only update tokens in their clinic
    if (req.user.role === 'CLINIC_ADMIN' && req.user.clinicId !== token.clinicId)
      return res.status(403).json({ error: 'Forbidden' });
    if (req.body.status === 'Completed') req.body.completedAt = new Date();
    Object.assign(token, req.body);
    await token.save();
    await emitClinicUpdate(token.clinicId);
    res.json(token);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN Summary (Super Admin only) ────────────────────────────────────────

app.get('/api/admin/summary', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const totalClinics   = await Clinic.countDocuments();
    const openClinics    = await Clinic.countDocuments({ status:'Open' });
    const closedClinics  = await Clinic.countDocuments({ status:'Closed' });
    const featuredCount  = await Clinic.countDocuments({ featured:true });
    const totalWaiting   = await Token.countDocuments({ status:'Waiting' });
    const totalCompleted = await Token.countDocuments({ status:'Completed' });
    res.json({ totalClinics, openClinics, closedClinics, featuredCount, totalWaiting, totalCompleted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET clinic admins (Super Admin)
app.get('/api/admin/users', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'CLINIC_ADMIN' }).select('-password');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update featured status (Super Admin)
app.put('/api/clinics/:clinicId/featured', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { featured } = req.body;
    if (featured) {
      const currentFeatured = await Clinic.countDocuments({ featured: true });
      const thisCLinic = await Clinic.findOne({ clinicId: req.params.clinicId.toUpperCase() });
      if (currentFeatured >= 3 && !thisCLinic?.featured)
        return res.status(400).json({ error: 'Only 3 clinics can be featured. Unfeature another first.' });
    }
    const clinic = await Clinic.findOneAndUpdate(
      { clinicId: req.params.clinicId.toUpperCase() },
      { featured },
      { new: true }
    );
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    res.json(clinic);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function enrichClinic(c) {
  const obj       = c.toObject ? c.toObject() : c;
  const waiting   = await Token.countDocuments({ clinicId: obj.clinicId, status: 'Waiting' });
  const serving   = await Token.countDocuments({ clinicId: obj.clinicId, status: 'Serving' });
  const completed = await Token.countDocuments({ clinicId: obj.clinicId, status: 'Completed' });
  return { ...obj, waitingCount: waiting, servingCount: serving, completedCount: completed, estimatedWait: waiting * 5 };
}

// ─── Legacy routes (backward compat) ─────────────────────────────────────────

app.get('/api/queue', async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ clinicId: 'C001' });
    const tokens = await Token.find({ clinicId: 'C001' }).sort({ tokenNumber: 1 });
    res.json({ currentNumber: clinic ? clinic.currentToken + 1 : 1, tokens });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/book-token', async (req, res) => {
  try {
    const { name, phone, age, department } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    const last   = await Token.findOne({ clinicId: 'C001' }).sort({ tokenNumber: -1 });
    const number = last ? last.tokenNumber + 1 : 1;
    const token  = await Token.create({ clinicId: 'C001', tokenNumber: number, name, phone, age, department });
    await emitClinicUpdate('C001');
    res.json(token);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Serve React ──────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

httpServer.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
