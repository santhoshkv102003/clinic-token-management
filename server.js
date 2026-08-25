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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kit27cse48_db_user:mxKLZeyc0DNsBUHL@cluster0.tivhoe5.mongodb.net/clinic-token-system?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET  = process.env.JWT_SECRET  || 'clinic_jwt_secret_key_2025';

// ─── Initial Seed Data ────────────────────────────────────────────────────────

const INITIAL_CLINICS = [
  { clinicId:'C001', clinicName:'Thiru Hospital Clinic',       doctorName:'Dr. Kumar',     phone:'044-24567890', address:'12 Cross Street, Chennai', status:'Open', featured:true,  currentToken:0 },
  { clinicId:'C002', clinicName:'Nalam Hospital Clinic',        doctorName:'Dr. Priya',     phone:'044-24567891', address:'45 Main Road, Chennai', status:'Open', featured:true,  currentToken:0 },
  { clinicId:'C003', clinicName:'Dr. Karthik Clinic',           doctorName:'Dr. Karthik',   phone:'044-24567892', address:'78 Gandhi Road, Chennai', status:'Open', featured:true,  currentToken:0 },
  { clinicId:'C004', clinicName:'Sri Lakshmi Hospital Clinic',  doctorName:'Dr. Lakshmi',   phone:'044-24567893', address:'90 Nehru Street, Chennai', status:'Open', featured:false, currentToken:0 },
  { clinicId:'C005', clinicName:'Annai Hospital Clinic',        doctorName:'Dr. Annamalai', phone:'044-24567894', address:'14 West Avenue, Chennai', status:'Open', featured:false, currentToken:0 },
  { clinicId:'C006', clinicName:'Surya Multispeciality Clinic', doctorName:'Dr. Surya',     phone:'044-24567895', address:'22 North Road, Chennai', status:'Open', featured:false, currentToken:0 },
  { clinicId:'C007', clinicName:'Arogya Care Clinic',           doctorName:'Dr. Arogya',    phone:'044-24567896', address:'33 South Street, Chennai', status:'Open', featured:false, currentToken:0 },
  { clinicId:'C008', clinicName:'Vasanth Hospital Clinic',      doctorName:'Dr. Vasanth',   phone:'044-24567897', address:'55 East Road, Chennai', status:'Open', featured:false, currentToken:0 },
  { clinicId:'C009', clinicName:'Sree Ram Clinic',              doctorName:'Dr. Ram',       phone:'044-24567898', address:'66 Lake View, Chennai', status:'Open', featured:false, currentToken:0 },
  { clinicId:'C010', clinicName:'Shree Medical Clinic',         doctorName:'Dr. Shree',     phone:'044-24567899', address:'88 Beach Road, Chennai', status:'Open', featured:false, currentToken:0 },
];

let inMemoryClinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
let inMemoryTokens  = [];
let inMemoryUsers   = [
  { _id: 'u1', name:'Super Admin',  email:'superadmin@clinic.com', passwordHash: bcrypt.hashSync('super123',10),  role:'SUPER_ADMIN', clinicId: null },
  { _id: 'u2', name:'Kumar',        email:'kumar@c001.com',        passwordHash: bcrypt.hashSync('admin123',10), role:'CLINIC_ADMIN', clinicId:'C001' },
  { _id: 'u3', name:'Priya',        email:'priya@c002.com',        passwordHash: bcrypt.hashSync('admin123',10), role:'CLINIC_ADMIN', clinicId:'C002' },
  { _id: 'u4', name:'Dr. Karthik',  email:'karthik@c003.com',      passwordHash: bcrypt.hashSync('admin123',10), role:'CLINIC_ADMIN', clinicId:'C003' },
];

let isMongoConnected = false;

// ─── Mongoose Schemas & Models ────────────────────────────────────────────────

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

// Connect to MongoDB with timeout handling
mongoose.set('bufferCommands', false); // Do not buffer queries indefinitely if MongoDB is offline

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 4000 })
  .then(async () => {
    isMongoConnected = true;
    console.log('✅ MongoDB connected to Atlas');
    await seedMongoData();
  })
  .catch(err => {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB Atlas connection notice:', err.message);
    console.log('⚡ Running with robust in-memory database store (Full functionality active!)');
  });

async function seedMongoData() {
  try {
    const clinicCount = await Clinic.countDocuments();
    if (clinicCount === 0) {
      await Clinic.insertMany(INITIAL_CLINICS);
      console.log('🏥 Seeded 10 clinics in MongoDB Atlas');
    }
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
      console.log('👤 Seeded users in MongoDB Atlas');
    }
  } catch (e) {
    console.error('Seed error:', e.message);
  }
}

// ─── Resilient Data Access Helpers ───────────────────────────────────────────

async function dbGetClinics(query = {}) {
  if (isMongoConnected) {
    try {
      return await Clinic.find(query).sort({ clinicName: 1 });
    } catch (e) { isMongoConnected = false; }
  }
  let list = inMemoryClinics;
  if (query.clinicId) list = list.filter(c => c.clinicId === query.clinicId);
  if (query.featured !== undefined) list = list.filter(c => c.featured === query.featured);
  if (query.status) list = list.filter(c => c.status === query.status);
  return list.sort((a, b) => a.clinicName.localeCompare(b.clinicName));
}

async function dbGetClinic(clinicId) {
  const cid = (clinicId || '').toUpperCase();
  if (isMongoConnected) {
    try {
      const c = await Clinic.findOne({ clinicId: cid });
      if (c) return c;
    } catch (e) { isMongoConnected = false; }
  }
  return inMemoryClinics.find(c => c.clinicId === cid) || null;
}

async function dbGetTokens(clinicId) {
  const cid = (clinicId || '').toUpperCase();
  if (isMongoConnected) {
    try {
      return await Token.find({ clinicId: cid }).sort({ tokenNumber: 1 });
    } catch (e) { isMongoConnected = false; }
  }
  return inMemoryTokens.filter(t => t.clinicId === cid).sort((a, b) => a.tokenNumber - b.tokenNumber);
}

async function dbCreateToken(data) {
  const cid = data.clinicId.toUpperCase();
  if (isMongoConnected) {
    try {
      const last = await Token.findOne({ clinicId: cid }).sort({ tokenNumber: -1 });
      const number = last ? last.tokenNumber + 1 : 1;
      return await Token.create({ ...data, clinicId: cid, tokenNumber: number });
    } catch (e) { isMongoConnected = false; }
  }
  const clinicTokens = inMemoryTokens.filter(t => t.clinicId === cid);
  const number = clinicTokens.length > 0 ? Math.max(...clinicTokens.map(t => t.tokenNumber)) + 1 : 1;
  const newToken = {
    _id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    ...data,
    clinicId: cid,
    tokenNumber: number,
    status: 'Waiting',
    bookedAt: new Date()
  };
  inMemoryTokens.push(newToken);
  return newToken;
}

async function dbFindUserByEmail(email) {
  const em = (email || '').toLowerCase().trim();
  if (isMongoConnected) {
    try {
      const u = await User.findOne({ email: em });
      if (u) return { ...u.toObject(), passwordHash: u.password };
    } catch (e) { isMongoConnected = false; }
  }
  return inMemoryUsers.find(u => u.email.toLowerCase() === em) || null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

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

function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'SUPER_ADMIN')
    return res.status(403).json({ error: 'Super Admin access required' });
  next();
}

function requireClinicAccess(req, res, next) {
  const clinicId = (req.params.clinicId || req.body.clinicId || '').toUpperCase();
  if (req.user?.role === 'SUPER_ADMIN') return next();
  if (req.user?.role === 'CLINIC_ADMIN' && req.user.clinicId === clinicId) return next();
  return res.status(403).json({ error: 'Forbidden: You can only access your own clinic' });
}

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', socket => {
  socket.on('join-clinic',  cid => socket.join(`clinic:${(cid || '').toUpperCase()}`));
  socket.on('leave-clinic', cid => socket.leave(`clinic:${(cid || '').toUpperCase()}`));
});

async function emitClinicUpdate(clinicId) {
  const cid = (clinicId || '').toUpperCase();
  const clinic = await dbGetClinic(cid);
  const tokens = await dbGetTokens(cid);
  io.to(`clinic:${cid}`).emit('queue:update', { clinic, tokens });
}

async function enrichClinic(c) {
  const obj = c.toObject ? c.toObject() : c;
  const tokens = await dbGetTokens(obj.clinicId);
  const waiting = tokens.filter(t => t.status === 'Waiting').length;
  const serving = tokens.filter(t => t.status === 'Serving').length;
  const completed = tokens.filter(t => t.status === 'Completed').length;
  return {
    ...obj,
    waitingCount: waiting,
    servingCount: serving,
    completedCount: completed,
    estimatedWait: waiting * 5
  };
}

// ─── AUTH APIs ────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await dbFindUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash || user.password || '');
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role, clinicId: user.clinicId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    let clinic = null;
    if (user.role === 'CLINIC_ADMIN' && user.clinicId) {
      clinic = await dbGetClinic(user.clinicId);
    }

    res.json({
      token,
      user: { name: user.name, email: user.email, role: user.role, clinicId: user.clinicId },
      clinic
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    let clinic = null;
    if (user.role === 'CLINIC_ADMIN' && user.clinicId) {
      clinic = await dbGetClinic(user.clinicId);
    }
    res.json({ user, clinic });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUBLIC Clinic APIs ───────────────────────────────────────────────────────

// Summary counters
app.get('/api/clinics/summary', async (req, res) => {
  try {
    const clinics = await dbGetClinics();
    const totalClinics = clinics.length;
    const openClinics = clinics.filter(c => c.status === 'Open').length;
    const closedClinics = clinics.filter(c => c.status === 'Closed').length;
    res.json({ totalClinics, openClinics, closedClinics });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Top 3 clinics
app.get('/api/clinics/top3', async (req, res) => {
  try {
    const all = await dbGetClinics();
    const enriched = await Promise.all(all.map(enrichClinic));
    enriched.sort((a, b) => (b.waitingCount + b.servingCount) - (a.waitingCount + a.servingCount));
    res.json(enriched.slice(0, 3));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Search clinics (alphabetical order)
app.get('/api/clinics/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const all = await dbGetClinics();
    let filtered = all;
    if (q) {
      filtered = all.filter(c =>
        c.clinicName.toLowerCase().includes(q) ||
        c.doctorName.toLowerCase().includes(q) ||
        c.clinicId.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => a.clinicName.localeCompare(b.clinicName));
    const enriched = await Promise.all(filtered.map(enrichClinic));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single clinic
app.get('/api/clinics/:clinicId', async (req, res) => {
  try {
    const clinic = await dbGetClinic(req.params.clinicId);
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    res.json(await enrichClinic(clinic));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get clinic queue
app.get('/api/clinics/:clinicId/queue', async (req, res) => {
  try {
    const cid = req.params.clinicId.toUpperCase();
    const clinic = await dbGetClinic(cid);
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    const tokens = await dbGetTokens(cid);
    res.json({ clinic, tokens });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Book token
app.post('/api/tokens', async (req, res) => {
  try {
    const { clinicId, name, phone, age, department } = req.body;
    if (!clinicId || !name || !phone)
      return res.status(400).json({ error: 'clinicId, name and phone required' });
    const cid = clinicId.toUpperCase();
    const clinic = await dbGetClinic(cid);
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
    if (clinic.status === 'Closed') return res.status(400).json({ error: 'Clinic is closed' });

    const token = await dbCreateToken({ clinicId: cid, name, phone, age, department });
    await emitClinicUpdate(cid);
    res.status(201).json(token);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PROTECTED Admin APIs ─────────────────────────────────────────────────────

// Get all clinics
app.get('/api/clinics', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const clinics = await dbGetClinics();
    const result = await Promise.all(clinics.map(enrichClinic));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create new clinic
app.post('/api/clinics', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { clinicName, doctorName, phone, address, status, featured } = req.body;
    let { adminName, adminEmail, adminPassword } = req.body;

    if (!clinicName || !doctorName)
      return res.status(400).json({ error: 'clinicName and doctorName are required' });

    const all = await dbGetClinics();
    let nextNum = all.length + 1;
    const clinicId = 'C' + String(nextNum).padStart(3, '0');

    if (!adminName) adminName = doctorName;
    if (!adminEmail) adminEmail = `admin.${clinicId.toLowerCase()}@clinic.com`;
    if (!adminPassword) adminPassword = 'admin123';

    const newClinic = {
      clinicId,
      clinicName: clinicName.trim(),
      doctorName: doctorName.trim(),
      phone: phone || '',
      address: address || '',
      status: status || 'Open',
      featured: featured || false,
      currentToken: 0,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      try {
        const hash = await bcrypt.hash(adminPassword, 10);
        await Clinic.create(newClinic);
        await User.create({ name: adminName, email: adminEmail.toLowerCase(), password: hash, role: 'CLINIC_ADMIN', clinicId });
      } catch (e) { isMongoConnected = false; }
    }

    inMemoryClinics.push(newClinic);
    inMemoryUsers.push({
      _id: 'u_' + Date.now(),
      name: adminName,
      email: adminEmail.toLowerCase(),
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      role: 'CLINIC_ADMIN',
      clinicId
    });

    res.status(201).json({ clinic: newClinic, message: `Clinic ${clinicId} created with admin ${adminEmail}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update clinic
app.put('/api/clinics/:clinicId', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const cid = req.params.clinicId.toUpperCase();
    const { clinicName, doctorName, phone, address, status, featured } = req.body;

    if (isMongoConnected) {
      try {
        await Clinic.findOneAndUpdate(
          { clinicId: cid },
          { clinicName, doctorName, phone, address, status, featured },
          { new: true }
        );
      } catch (e) { isMongoConnected = false; }
    }

    const c = inMemoryClinics.find(x => x.clinicId === cid);
    if (c) {
      if (clinicName) c.clinicName = clinicName;
      if (doctorName) c.doctorName = doctorName;
      if (phone !== undefined) c.phone = phone;
      if (address !== undefined) c.address = address;
      if (status) c.status = status;
      if (featured !== undefined) c.featured = featured;
    }

    await emitClinicUpdate(cid);
    res.json(c || { clinicId: cid, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Call next patient
app.post('/api/clinics/:clinicId/next', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const cid = req.params.clinicId.toUpperCase();
    const clinic = await dbGetClinic(cid);
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });

    if (isMongoConnected) {
      try {
        await Token.findOneAndUpdate({ clinicId: cid, status: 'Serving' }, { $set: { status: 'Completed', completedAt: new Date() } });
        const next = await Token.findOneAndUpdate({ clinicId: cid, status: 'Waiting' }, { $set: { status: 'Serving' } }, { sort: { tokenNumber: 1 }, new: true });
        clinic.currentToken = next ? next.tokenNumber : 0;
        await clinic.save();
        await emitClinicUpdate(cid);
        return res.json({ currentToken: clinic.currentToken, next: next || null });
      } catch (e) { isMongoConnected = false; }
    }

    // In-memory update
    const servingToken = inMemoryTokens.find(t => t.clinicId === cid && t.status === 'Serving');
    if (servingToken) {
      servingToken.status = 'Completed';
      servingToken.completedAt = new Date();
    }

    const nextToken = inMemoryTokens.find(t => t.clinicId === cid && t.status === 'Waiting');
    if (nextToken) {
      nextToken.status = 'Serving';
      clinic.currentToken = nextToken.tokenNumber;
    } else {
      clinic.currentToken = 0;
    }

    await emitClinicUpdate(cid);
    res.json({ currentToken: clinic.currentToken, next: nextToken || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset queue
app.post('/api/clinics/:clinicId/reset', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const cid = req.params.clinicId.toUpperCase();
    if (isMongoConnected) {
      try {
        await Token.deleteMany({ clinicId: cid });
        await Clinic.findOneAndUpdate({ clinicId: cid }, { currentToken: 0 });
      } catch (e) { isMongoConnected = false; }
    }
    inMemoryTokens = inMemoryTokens.filter(t => t.clinicId !== cid);
    const c = inMemoryClinics.find(x => x.clinicId === cid);
    if (c) c.currentToken = 0;
    await emitClinicUpdate(cid);
    res.json({ message: 'Queue reset' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin summary
app.get('/api/admin/summary', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const clinics = await dbGetClinics();
    const totalClinics  = clinics.length;
    const openClinics   = clinics.filter(c => c.status === 'Open').length;
    const closedClinics = clinics.filter(c => c.status === 'Closed').length;
    const featuredCount = clinics.filter(c => c.featured).length;
    res.json({ totalClinics, openClinics, closedClinics, featuredCount, totalWaiting: 0, totalCompleted: 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Serve React Static Files ─────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
