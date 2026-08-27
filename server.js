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

export function getClinicUsername(clinicName, clinicId) {
  let cleanName = (clinicName || '').replace(/^(Dr\.|Dr|Doctor|The)\s*/i, '').trim();
  // Remove non-alphanumeric leading chars if any
  cleanName = cleanName.replace(/^[^a-zA-Z0-9]+/, '');
  let firstChar = (cleanName.charAt(0) || 'c').toLowerCase();
  let cid = (clinicId || '').toLowerCase();
  return `${firstChar}${cid}@gmail.com`;
}

const INITIAL_CLINICS = [
  // ── 10 Doctor Clinics ──
  { clinicId:'C001', clinicName:'Dr. Santhosh Care Clinic',       doctorName:'Dr. Santhosh',    phone:'044-24567801', address:'10 Anna Salai, Chennai',               status:'Open', featured:true,  currentToken:0 },
  { clinicId:'C002', clinicName:'Dr. Karthi Prime Clinic',        doctorName:'Dr. Karthi',      phone:'044-24567802', address:'15 MG Road, Coimbatore',               status:'Open', featured:true,  currentToken:0 },
  { clinicId:'C003', clinicName:'Dr. Rithika Health Clinic',      doctorName:'Dr. Rithika',     phone:'044-24567803', address:'22 Gandhi Nagar, Madurai',             status:'Open', featured:true,  currentToken:0 },
  { clinicId:'C004', clinicName:'Dr. Dev LifeCare Clinic',        doctorName:'Dr. Dev',         phone:'044-24567804', address:'88 South Cross Road, Tiruchirappalli', status:'Open', featured:false, currentToken:0 },
  { clinicId:'C005', clinicName:'Dr. Maha Wellness Clinic',       doctorName:'Dr. Maha',        phone:'044-24567805', address:'45 West Street, Salem',                status:'Open', featured:false, currentToken:0 },
  { clinicId:'C006', clinicName:'Dr. Vels Family Clinic',         doctorName:'Dr. Vels',        phone:'044-24567806', address:'12 North Avenue, Tirunelveli',          status:'Open', featured:false, currentToken:0 },
  { clinicId:'C007', clinicName:'Dr. JM Medical Care',            doctorName:'Dr. JM',          phone:'044-24567807', address:'34 Periyar Road, Erode',               status:'Open', featured:false, currentToken:0 },
  { clinicId:'C008', clinicName:'Dr. Maambalam Health Centre',    doctorName:'Dr. Maambalam',   phone:'044-24567808', address:'50 Station Road, Chennai',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C009', clinicName:'Dr. SR Prime Care',              doctorName:'Dr. SR',          phone:'044-24567809', address:'67 Hospital Road, Vellore',             status:'Open', featured:false, currentToken:0 },
  { clinicId:'C010', clinicName:'Dr. KP Multicare Clinic',        doctorName:'Dr. KP',          phone:'044-24567810', address:'19 Kamaraj Salai, Thoothukudi',         status:'Open', featured:false, currentToken:0 },

  // ── 30 Unique Clinics across different locations (district names removed from clinic names) ──
  { clinicId:'C011', clinicName:'Medanta Care Polyclinic',        doctorName:'Dr. Rajesh',      phone:'044-24567811', address:'Anna Nagar, Chennai',                  status:'Open', featured:false, currentToken:0 },
  { clinicId:'C012', clinicName:'Aura Health MultiSpeciality',    doctorName:'Dr. Suresh',      phone:'0422-24567812',address:'Gandhipuram, Coimbatore',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C013', clinicName:'Meenakshi Life Care Clinic',     doctorName:'Dr. Meenakshi',   phone:'0452-24567813',address:'KK Nagar, Madurai',                     status:'Open', featured:false, currentToken:0 },
  { clinicId:'C014', clinicName:'Care & Cure Medical Point',      doctorName:'Dr. Ramesh',      phone:'0431-24567814',address:'Thillai Nagar, Tiruchirappalli',       status:'Open', featured:false, currentToken:0 },
  { clinicId:'C015', clinicName:'Shanthi Family Clinic',          doctorName:'Dr. Vijay',       phone:'0427-24567815',address:'Fairlands, Salem',                     status:'Open', featured:false, currentToken:0 },
  { clinicId:'C016', clinicName:'Grace Medical Centre',           doctorName:'Dr. Murugan',     phone:'0462-24567816',address:'Palayamkottai, Tirunelveli',           status:'Open', featured:false, currentToken:0 },
  { clinicId:'C017', clinicName:'Surya Multispeciality Hub',      doctorName:'Dr. Senthil',     phone:'0424-24567817',address:'Collectorate Road, Erode',             status:'Open', featured:false, currentToken:0 },
  { clinicId:'C018', clinicName:'Anugraha LifeCare Clinic',       doctorName:'Dr. Anand',       phone:'0416-24567818',address:'Katpadi, Vellore',                      status:'Open', featured:false, currentToken:0 },
  { clinicId:'C019', clinicName:'Pearl City Health Hub',          doctorName:'Dr. Antony',      phone:'0461-24567819',address:'Beach Road, Thoothukudi',               status:'Open', featured:false, currentToken:0 },
  { clinicId:'C020', clinicName:'RockFort Wellness Clinic',       doctorName:'Dr. Balaji',      phone:'0451-24567820',address:'Main Bazaar, Dindigul',                 status:'Open', featured:false, currentToken:0 },
  { clinicId:'C021', clinicName:'Temple City Health Point',       doctorName:'Dr. Chidambaram', phone:'04362-2456721',address:'Medical College Road, Thanjavur',       status:'Open', featured:false, currentToken:0 },
  { clinicId:'C022', clinicName:'Silk City Family Clinic',        doctorName:'Dr. Devaraj',     phone:'044-24567822', address:'Gandhi Road, Kanchipuram',             status:'Open', featured:false, currentToken:0 },
  { clinicId:'C023', clinicName:'Knit City Health Care',          doctorName:'Dr. Ezhil',       phone:'0421-24567823',address:'Avinashi Road, Tiruppur',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C024', clinicName:'Cauvery Riverview Clinic',       doctorName:'Dr. Gokul',       phone:'04324-2456724',address:'Kovai Road, Karur',                     status:'Open', featured:false, currentToken:0 },
  { clinicId:'C025', clinicName:'Poultry Prime Health Centre',    doctorName:'Dr. Hari',        phone:'04286-2456725',address:'Paramathi Road, Namakkal',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C026', clinicName:'Silver Beach Medical Point',     doctorName:'Dr. Ilango',      phone:'04142-2456726',address:'Imperial Road, Cuddalore',             status:'Open', featured:false, currentToken:0 },
  { clinicId:'C027', clinicName:'Apex Family Care Centre',        doctorName:'Dr. Jayakumar',   phone:'04146-2456727',address:'East Pondy Road, Villupuram',          status:'Open', featured:false, currentToken:0 },
  { clinicId:'C028', clinicName:'Chettinad Prime Clinic',         doctorName:'Dr. Kannan',      phone:'04575-2456728',address:'Madurai Road, Sivaganga',               status:'Open', featured:false, currentToken:0 },
  { clinicId:'C029', clinicName:'Sethu Wellness Hub',             doctorName:'Dr. Lakshman',    phone:'04567-2456729',address:'NH Road, Ramanathapuram',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C030', clinicName:'Sri Andal Health Care',          doctorName:'Dr. Manikandan',  phone:'04562-2456730',address:'Katchery Road, Virudhunagar',          status:'Open', featured:false, currentToken:0 },
  { clinicId:'C031', clinicName:'Rose Valley Health Point',       doctorName:'Dr. Naveen',      phone:'04343-2456731',address:'Bangalore Road, Krishnagiri',           status:'Open', featured:false, currentToken:0 },
  { clinicId:'C032', clinicName:'Hogenakkal Prime Clinic',        doctorName:'Dr. Parthiban',   phone:'04342-2456732',address:'Pennagaram Road, Dharmapuri',          status:'Open', featured:false, currentToken:0 },
  { clinicId:'C033', clinicName:'Gemstone Wellness Clinic',       doctorName:'Dr. Raghav',      phone:'04329-2456733',address:'Bus Stand Road, Ariyalur',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C034', clinicName:'Sugar City Health Centre',       doctorName:'Dr. Shanmugam',   phone:'04328-2456734',address:'Collectorate Complex, Perambalur',      status:'Open', featured:false, currentToken:0 },
  { clinicId:'C035', clinicName:'Coastline Care Clinic',          doctorName:'Dr. Thiru',       phone:'04365-2456735',address:'Public Office Road, Nagapattinam',      status:'Open', featured:false, currentToken:0 },
  { clinicId:'C036', clinicName:'Mayil Health Point',             doctorName:'Dr. Udhaya',      phone:'04364-2456736',address:'Kutchery Road, Mayiladuthurai',        status:'Open', featured:false, currentToken:0 },
  { clinicId:'C037', clinicName:'Courtallam Family Clinic',       doctorName:'Dr. Vignesh',     phone:'04633-2456737',address:'Main Falls Road, Tenkasi',               status:'Open', featured:false, currentToken:0 },
  { clinicId:'C038', clinicName:'Royal Palace Health Care',       doctorName:'Dr. Walter',      phone:'04322-2456738',address:'Town Hall Road, Pudukkottai',           status:'Open', featured:false, currentToken:0 },
  { clinicId:'C039', clinicName:'Blue Mountain Wellness Centre',  doctorName:'Dr. Xavier',      phone:'0423-2456739', address:'Commercial Road, Ooty',                 status:'Open', featured:false, currentToken:0 },
  { clinicId:'C040', clinicName:'Green Meadows Health Care',      doctorName:'Dr. Yuvaraj',     phone:'04366-2456740',address:'South Street, Thiruvarur',              status:'Open', featured:false, currentToken:0 },

  // ── 10 Brand / Multispeciality Clinics ──
  { clinicId:'C041', clinicName:'Lotus LifeCare Clinic',          doctorName:'Dr. Leela',       phone:'044-24567841', address:'100 Grand Mall Road, Chennai',         status:'Open', featured:false, currentToken:0 },
  { clinicId:'C042', clinicName:'GreenLeaf Medical Centre',       doctorName:'Dr. Gowri',       phone:'044-24567842', address:'54 Eco Park Road, Chennai',            status:'Open', featured:false, currentToken:0 },
  { clinicId:'C043', clinicName:'BlueCross Family Clinic',        doctorName:'Dr. Bhaskar',     phone:'044-24567843', address:'77 Cross Road, Chennai',               status:'Open', featured:false, currentToken:0 },
  { clinicId:'C044', clinicName:'Sunrise Health Hub',             doctorName:'Dr. Saravanan',   phone:'044-24567844', address:'29 Beach View Road, Chennai',          status:'Open', featured:false, currentToken:0 },
  { clinicId:'C045', clinicName:'Aster Prime Clinic',             doctorName:'Dr. Arvind',      phone:'044-24567845', address:'18 Central Avenue, Chennai',           status:'Open', featured:false, currentToken:0 },
  { clinicId:'C046', clinicName:'GoldenCare Medical Centre',      doctorName:'Dr. Gayathri',    phone:'044-24567846', address:'33 Golden Avenue, Chennai',            status:'Open', featured:false, currentToken:0 },
  { clinicId:'C047', clinicName:'Nova Wellness Clinic',           doctorName:'Dr. Nithya',      phone:'044-24567847', address:'62 Tech Park Road, Chennai',           status:'Open', featured:false, currentToken:0 },
  { clinicId:'C048', clinicName:'Unity Family Health',            doctorName:'Dr. Uma',         phone:'044-24567848', address:'81 Unity Plaza, Chennai',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C049', clinicName:'RoyalCare Clinic',               doctorName:'Dr. Raghu',       phone:'044-24567849', address:'95 Palace Road, Chennai',              status:'Open', featured:false, currentToken:0 },
  { clinicId:'C050', clinicName:'BrightLife Health Centre',       doctorName:'Dr. Balan',       phone:'044-24567850', address:'14 Sunrise Avenue, Chennai',           status:'Open', featured:false, currentToken:0 },
];

const DEFAULT_PASSWORD = 'sr1011';
const defaultHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const INITIAL_USERS = [
  { _id: 'u_super1', name:'Santhosh',    email:'santhosh@gmail.com',     passwordHash: defaultHash, role:'SUPER_ADMIN', clinicId: null },
  { _id: 'u_super2', name:'Super Admin', email:'superadmin@clinic.com',  passwordHash: defaultHash, role:'SUPER_ADMIN', clinicId: null },
  ...INITIAL_CLINICS.map((c, i) => ({
    _id: `u_${c.clinicId}`,
    name: c.doctorName,
    email: getClinicUsername(c.clinicName, c.clinicId),
    passwordHash: defaultHash,
    role: 'CLINIC_ADMIN',
    clinicId: c.clinicId
  }))
];

let inMemoryClinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
let inMemoryTokens  = [];
let inMemoryUsers   = JSON.parse(JSON.stringify(INITIAL_USERS));

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
    // Seed/Upsert all 50 clinics
    for (const clinic of INITIAL_CLINICS) {
      await Clinic.findOneAndUpdate(
        { clinicId: clinic.clinicId },
        { $set: clinic },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`🏥 Verified/Seeded ${INITIAL_CLINICS.length} clinics in MongoDB Atlas`);

    // Seed/Upsert users
    const hash = await bcrypt.hash('sr1011', 10);
    
    // Super Admins
    await User.findOneAndUpdate(
      { email: 'santhosh@gmail.com' },
      { $set: { name: 'Santhosh', email: 'santhosh@gmail.com', password: hash, role: 'SUPER_ADMIN', clinicId: null } },
      { upsert: true, returnDocument: 'after' }
    );
    await User.findOneAndUpdate(
      { email: 'superadmin@clinic.com' },
      { $set: { name: 'Super Admin', email: 'superadmin@clinic.com', password: hash, role: 'SUPER_ADMIN', clinicId: null } },
      { upsert: true, returnDocument: 'after' }
    );

    // Clinic Admins
    for (const clinic of INITIAL_CLINICS) {
      const email = getClinicUsername(clinic.clinicName, clinic.clinicId);
      await User.findOneAndUpdate(
        { clinicId: clinic.clinicId },
        { $set: { name: clinic.doctorName, email, password: hash, role: 'CLINIC_ADMIN', clinicId: clinic.clinicId } },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log('👤 Verified/Seeded admin users in MongoDB Atlas');
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
    if (!adminEmail) adminEmail = getClinicUsername(clinicName, clinicId);
    if (!adminPassword) adminPassword = 'sr1011';

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

// Delete clinic & reassign / resequence all clinic numbers
app.delete('/api/clinics/:clinicId', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const targetCid = req.params.clinicId.toUpperCase();
    const existing = await dbGetClinic(targetCid);
    if (!existing) return res.status(404).json({ error: 'Clinic not found' });

    // 1. Delete target clinic, associated tokens, and admin user
    if (isMongoConnected) {
      try {
        await Clinic.deleteOne({ clinicId: targetCid });
        await Token.deleteMany({ clinicId: targetCid });
        await User.deleteMany({ clinicId: targetCid });
      } catch (e) { isMongoConnected = false; }
    }

    inMemoryClinics = inMemoryClinics.filter(c => c.clinicId !== targetCid);
    inMemoryTokens  = inMemoryTokens.filter(t => t.clinicId !== targetCid);
    inMemoryUsers   = inMemoryUsers.filter(u => u.clinicId !== targetCid);

    // 2. Fetch all remaining clinics and sort by previous numeric order
    let allRemaining = [];
    if (isMongoConnected) {
      try {
        allRemaining = await Clinic.find({});
      } catch (e) {
        isMongoConnected = false;
        allRemaining = inMemoryClinics;
      }
    } else {
      allRemaining = inMemoryClinics;
    }

    allRemaining.sort((a, b) => {
      const numA = parseInt(String(a.clinicId || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.clinicId || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    // 3. Resequence remaining clinics sequentially C001, C002...
    for (let i = 0; i < allRemaining.length; i++) {
      const newNum = i + 1;
      const newCid = 'C' + String(newNum).padStart(3, '0');
      const oldCid = allRemaining[i].clinicId;

      if (oldCid !== newCid) {
        const clinicDoc = allRemaining[i];
        const newEmail = getClinicUsername(clinicDoc.clinicName, newCid);

        if (isMongoConnected) {
          try {
            await Clinic.updateOne({ _id: clinicDoc._id }, { $set: { clinicId: newCid } });
            await Token.updateMany({ clinicId: oldCid }, { $set: { clinicId: newCid } });
            await User.updateOne({ clinicId: oldCid }, { $set: { clinicId: newCid, email: newEmail } });
          } catch (e) { isMongoConnected = false; }
        }

        const memClinic = inMemoryClinics.find(c => c.clinicId === oldCid);
        if (memClinic) memClinic.clinicId = newCid;

        inMemoryTokens.forEach(t => {
          if (t.clinicId === oldCid) t.clinicId = newCid;
        });

        const memUser = inMemoryUsers.find(u => u.clinicId === oldCid);
        if (memUser) {
          memUser.clinicId = newCid;
          memUser.email = newEmail;
        }
      }
    }

    io.emit('clinics:refresh');
    res.json({ message: `Clinic ${targetCid} deleted and remaining clinics resequenced successfully` });
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

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production' || process.env.PORT) {
  httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

export default app;
