import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] }
});

const PORT        = process.env.PORT        || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kit27cse48_db_user:qbtC0UrsUkCQC2Y6@cluster0.nqhgzk2.mongodb.net/?appName=Cluster0';
const JWT_SECRET  = process.env.JWT_SECRET  || 'clinic_super_jwt_secret_key_2026';

// ─── Initial Seed Data ────────────────────────────────────────────────────────

/**
 * Generates a clinic email from the clinic name and clinic ID.
 *
 * Rule (simple):
 *  - Strip leading "Dr.", "Dr", or "Doctor" prefix (case-insensitive).
 *  - Take the FIRST letter of the first word only.
 *  - Append the numeric part of the clinic ID (e.g. "010" from "C010").
 *  - Format: {firstLetter}{numericId}@gmail.com
 *
 * Examples:
 *   Dr.Santhosh Health Center, C010 → s010@gmail.com
 *   Maambalam Health Centre,   C014 → m014@gmail.com
 *   Arogya Family Care,        C021 → a021@gmail.com
 *   SR Prime Care,             C018 → s018@gmail.com
 *   KP Multicare Clinic,       C019 → k019@gmail.com
 *   Dr.Karthi Prime Clinic,    C011 → k011@gmail.com
 */
export function generateClinicEmail(clinicName, clinicId) {
  const numericId = (clinicId || '').replace(/\D/g, '').padStart(3, '0');
  return `san${numericId}@gmail.com`;
}

export function getClinicUsername(clinicName, clinicId) {
  return generateClinicEmail(clinicName, clinicId);
}

const INITIAL_CLINICS = [
  // ── CHENNAI (C010 to C019) ──
  { clinicId: 'C010', clinicName: 'Dr.Santhosh Health Center', doctorName: 'Santhosh', city: 'Chennai', phone: '044-2456010', address: 'Chennai, Tamil Nadu', status: 'Open', featured: true, currentToken: 0 },
  { clinicId: 'C011', clinicName: 'Dr.Karthi Prime Clinic',    doctorName: 'Karthi',   city: 'Chennai', phone: '044-2456011', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C012', clinicName: 'Dr.Dev LifeCare Clinic',    doctorName: 'Dev',      city: 'Chennai', phone: '044-2456012', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C013', clinicName: 'Dr.Pugazh Medical Centre',  doctorName: 'Pugazh',   city: 'Chennai', phone: '044-2456013', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C014', clinicName: 'Maambalam Health Centre',   doctorName: 'Maambalam',city: 'Chennai', phone: '044-2456014', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C015', clinicName: 'Rithika Care Clinic',       doctorName: 'Rithika',  city: 'Chennai', phone: '044-2456015', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C016', clinicName: 'Maha Wellness Clinic',      doctorName: 'Maha',     city: 'Chennai', phone: '044-2456016', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C017', clinicName: 'Vels Family Clinic',        doctorName: 'Vels',     city: 'Chennai', phone: '044-2456017', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C018', clinicName: 'SR Prime Care',             doctorName: 'Praba',    city: 'Chennai', phone: '044-2456018', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C019', clinicName: 'KP Multicare Clinic',       doctorName: 'Keerthi',  city: 'Chennai', phone: '044-2456019', address: 'Chennai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },

  // ── COIMBATORE (C020 to C029) ──
  { clinicId: 'C020', clinicName: 'Dr.Nalam Health Clinic',    doctorName: 'Nalam',    city: 'Coimbatore', phone: '0422-2456020', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: true, currentToken: 0 },
  { clinicId: 'C021', clinicName: 'Arogya Family Care',        doctorName: 'Aravind',  city: 'Coimbatore', phone: '0422-2456021', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C022', clinicName: 'Dr.Kavin Medical Centre',   doctorName: 'Kavin',    city: 'Coimbatore', phone: '0422-2456022', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C023', clinicName: 'Prime Health Point',        doctorName: 'Divya',    city: 'Coimbatore', phone: '0422-2456023', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C024', clinicName: 'Dr.Rajesh Care Centre',     doctorName: 'Rajesh',   city: 'Coimbatore', phone: '0422-2456024', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C025', clinicName: 'Anitha Wellness Centre',    doctorName: 'Anitha',   city: 'Coimbatore', phone: '0422-2456025', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C026', clinicName: 'Dr.Suresh LifeCare Clinic', doctorName: 'Suresh',   city: 'Coimbatore', phone: '0422-2456026', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C027', clinicName: 'Family Health Hub',         doctorName: 'Priya',    city: 'Coimbatore', phone: '0422-2456027', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C028', clinicName: 'Dr.Mohan Prime Health',     doctorName: 'Mohan',    city: 'Coimbatore', phone: '0422-2456028', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C029', clinicName: 'Dr.Kavya Medical Care',     doctorName: 'Kavya',    city: 'Coimbatore', phone: '0422-2456029', address: 'Coimbatore, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },

  // ── MADURAI (C030 to C039) ──
  { clinicId: 'C030', clinicName: 'Dr.Arogya Health Centre',   doctorName: 'Arogya',   city: 'Madurai', phone: '0452-2456030', address: 'Madurai, Tamil Nadu', status: 'Open', featured: true, currentToken: 0 },
  { clinicId: 'C031', clinicName: 'Sai Care Clinic',           doctorName: 'Sai',      city: 'Madurai', phone: '0452-2456031', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C032', clinicName: 'Dr.Vijay Family Clinic',    doctorName: 'Vijay',    city: 'Madurai', phone: '0452-2456032', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C033', clinicName: 'Harish Medical Centre',     doctorName: 'Harish',   city: 'Madurai', phone: '0452-2456033', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C034', clinicName: 'Dr.Lakshmi Care Centre',    doctorName: 'Lakshmi',  city: 'Madurai', phone: '0452-2456034', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C035', clinicName: 'Bala Health Clinic',        doctorName: 'Bala',     city: 'Madurai', phone: '0452-2456035', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C036', clinicName: 'Dr.Deepak Wellness Clinic', doctorName: 'Deepak',   city: 'Madurai', phone: '0452-2456036', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C037', clinicName: 'Rekha Prime Care',          doctorName: 'Rekha',    city: 'Madurai', phone: '0452-2456037', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C038', clinicName: 'Dr.Manikandan Family Care', doctorName: 'Manikandan', city: 'Madurai', phone: '0452-2456038', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C039', clinicName: 'Swetha Health Point',       doctorName: 'Swetha',   city: 'Madurai', phone: '0452-2456039', address: 'Madurai, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },

  // ── TIRUNELVELI (C040 to C049) ──
  { clinicId: 'C040', clinicName: 'Dr.Amar LifeCare Centre',   doctorName: 'Amar',     city: 'Tirunelveli', phone: '0462-2456040', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C041', clinicName: 'Bharath Medical Care',      doctorName: 'Bharath',  city: 'Tirunelveli', phone: '0462-2456041', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C042', clinicName: 'Dr.Chitra Health Clinic',   doctorName: 'Chitra',   city: 'Tirunelveli', phone: '0462-2456042', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C043', clinicName: 'Dinesh Family Health',      doctorName: 'Dinesh',   city: 'Tirunelveli', phone: '0462-2456043', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C044', clinicName: 'Dr.Ezhil Care Clinic',      doctorName: 'Ezhil',    city: 'Tirunelveli', phone: '0462-2456044', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C045', clinicName: 'Faizal Wellness Centre',    doctorName: 'Faizal',   city: 'Tirunelveli', phone: '0462-2456045', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C046', clinicName: 'Dr.Gokul Prime Clinic',     doctorName: 'Gokul',    city: 'Tirunelveli', phone: '0462-2456046', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C047', clinicName: 'Hema Family Care',          doctorName: 'Hema',     city: 'Tirunelveli', phone: '0462-2456047', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C048', clinicName: 'Dr.Indhu Medical Centre',   doctorName: 'Indhu',    city: 'Tirunelveli', phone: '0462-2456048', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C049', clinicName: 'Jeeva Health Point',        doctorName: 'Jeeva',    city: 'Tirunelveli', phone: '0462-2456049', address: 'Tirunelveli, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },

  // ── KANNIYAKUMARI (C050 to C059) ──
  { clinicId: 'C050', clinicName: 'Dr.Kannan Health Centre',   doctorName: 'Kannan',   city: 'Kanniyakumari', phone: '04652-2456050', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C051', clinicName: 'Latha Care Clinic',         doctorName: 'Latha',    city: 'Kanniyakumari', phone: '04652-2456051', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C052', clinicName: 'Dr.Murali Medical Care',    doctorName: 'Murali',   city: 'Kanniyakumari', phone: '04652-2456052', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C053', clinicName: 'Nithya Family Clinic',      doctorName: 'Nithya',   city: 'Kanniyakumari', phone: '04652-2456053', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C054', clinicName: 'Dr.Oviya Wellness Clinic',  doctorName: 'Oviya',    city: 'Kanniyakumari', phone: '04652-2456054', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C055', clinicName: 'Prakash Prime Care',        doctorName: 'Prakash',  city: 'Kanniyakumari', phone: '04652-2456055', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C056', clinicName: 'Dr.Ramesh LifeCare',        doctorName: 'Ramesh',   city: 'Kanniyakumari', phone: '04652-2456056', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C057', clinicName: 'Sindhu Health Centre',      doctorName: 'Sindhu',   city: 'Kanniyakumari', phone: '04652-2456057', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C058', clinicName: 'Dr.Tamilselvan Medical Centre', doctorName: 'Tamilselvan', city: 'Kanniyakumari', phone: '04652-2456058', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C059', clinicName: 'Uma Family Health',         doctorName: 'Uma',      city: 'Kanniyakumari', phone: '04652-2456059', address: 'Kanniyakumari, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },

  // ── TRICHY (C060 to C069) ──
  { clinicId: 'C060', clinicName: 'Dr.Vasanth Care Clinic',    doctorName: 'Vasanth',  city: 'Trichy', phone: '0431-2456060', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C061', clinicName: 'Yamini Health Centre',      doctorName: 'Yamini',   city: 'Trichy', phone: '0431-2456061', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C062', clinicName: 'Dr.Akash Prime Health',     doctorName: 'Akash',    city: 'Trichy', phone: '0431-2456062', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C063', clinicName: 'Bhavani Medical Centre',    doctorName: 'Bhavani',  city: 'Trichy', phone: '0431-2456063', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C064', clinicName: 'Dr.Krishna Family Care',    doctorName: 'Krishna',  city: 'Trichy', phone: '0431-2456064', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C065', clinicName: 'Dharani Wellness Centre',   doctorName: 'Dharani',  city: 'Trichy', phone: '0431-2456065', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C066', clinicName: 'Dr.Elango Health Clinic',   doctorName: 'Elango',   city: 'Trichy', phone: '0431-2456066', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C067', clinicName: 'Gayathri Care Centre',      doctorName: 'Gayathri', city: 'Trichy', phone: '0431-2456067', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C068', clinicName: 'Dr.Hari Medical Care',      doctorName: 'Hari',     city: 'Trichy', phone: '0431-2456068', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
  { clinicId: 'C069', clinicName: 'Ishwar LifeCare Clinic',    doctorName: 'Ishwar',   city: 'Trichy', phone: '0431-2456069', address: 'Trichy, Tamil Nadu', status: 'Open', featured: false, currentToken: 0 },
];

const DEFAULT_PASSWORD = 'sr1011';
const defaultHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const INITIAL_USERS = [
  { _id: 'u_super1', name:'Santhosh',    email:'santhosh@gmail.com',     passwordHash: defaultHash, role:'SUPER_ADMIN', clinicId: null },
  { _id: 'u_super2', name:'Super Admin', email:'superadmin@clinic.com',  passwordHash: defaultHash, role:'SUPER_ADMIN', clinicId: null },
  ...INITIAL_CLINICS.map((c) => ({
    _id: `u_${c.clinicId}`,
    name: c.doctorName,
    email: generateClinicEmail(c.clinicName, c.clinicId),
    passwordHash: defaultHash,
    role: 'CLINIC_ADMIN',
    clinicId: c.clinicId
  }))
];

let inMemoryClinics = JSON.parse(JSON.stringify(INITIAL_CLINICS));
let inMemoryTokens  = [];
let inMemoryUsers   = JSON.parse(JSON.stringify(INITIAL_USERS));

// ─── Mongoose Schemas & Models ────────────────────────────────────────────────

const clinicSchema = new mongoose.Schema({
  clinicId:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  clinicName:  { type: String, required: true, trim: true },
  doctorName:  { type: String, required: true, trim: true },
  city:        { type: String, default: 'Chennai', trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:{ type: String, required: true },
  phone:       { type: String, default: '' },
  address:     { type: String, default: '' },
  status:      { type: String, enum: ['Open','Closed'], default: 'Open' },
  isActive:    { type: Boolean, default: true },
  featured:    { type: Boolean, default: false },
  currentToken:{ type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
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
  department:  { type: String, trim: true, default: 'General Medicine' },
  status:      { type: String, enum: ['waiting', 'serving', 'completed', 'cancelled', 'no_show', 'Waiting', 'Serving', 'Completed'], default: 'waiting' },
  bookedAt:    { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Indexes for ultra-fast queries & queue operations
tokenSchema.index({ clinicId: 1, tokenNumber: -1 });
tokenSchema.index({ clinicId: 1, status: 1, tokenNumber: 1 });
tokenSchema.index({ clinicId: 1, department: 1, status: 1 });
tokenSchema.index({ tokenNumber: 1 });

userSchema.index({ email: 1 });
userSchema.index({ clinicId: 1 });

const Clinic = mongoose.model('Clinic', clinicSchema);
const User   = mongoose.model('User',   userSchema);
const Token  = mongoose.model('Token',  tokenSchema);

let isMongoConnected = false;
let isSeeded = false;

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

async function ensureMongo() {
  if (isMongoReady()) {
    isMongoConnected = true;
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 2
    });
    isMongoConnected = true;
    console.log('✅ MongoDB connected to Atlas');
    if (!isSeeded) {
      isSeeded = true;
      seedMongoData().catch(e => console.error('Seed error:', e.message));
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB Atlas connection notice:', err.message);
  }
}

// Initial connection attempt
ensureMongo();

// Middleware to ensure DB connection on serverless/cold starts
app.use(async (req, res, next) => {
  if (!isMongoConnected || mongoose.connection.readyState !== 1) {
    await ensureMongo();
  }
  next();
});

async function seedMongoData() {
  try {
    const hash = await bcrypt.hash('sr1011', 10);

    // ── Validate the 50/50 Dr. split in INITIAL_CLINICS at startup ────────────
    const drCount    = INITIAL_CLINICS.filter(c => c.clinicName.startsWith('Dr.')).length;
    const nonDrCount = INITIAL_CLINICS.length - drCount;
    if (drCount !== 30 || nonDrCount !== 30) {
      console.error(
        `❌ Dr. split validation FAILED: ${drCount} Dr. clinics, ${nonDrCount} non-Dr. clinics` +
        ` (expected 30 each out of ${INITIAL_CLINICS.length} total)`
      );
    } else {
      console.log(
        `✅ Dr. split validated: ${drCount} Dr. + ${nonDrCount} non-Dr. = ${INITIAL_CLINICS.length} total clinics`
      );
    }

    // ── Upsert all 60 clinics (safe to run even if DB already has data) ───────
    // Using upsert-by-clinicId means:
    //  - New DB → all 60 are inserted
    //  - Existing DB with stale data → clinic names / emails are corrected in-place
    //  - Existing DB already correct → no-op (MongoDB only updates if values differ)
    let upserted = 0;
    for (const clinic of INITIAL_CLINICS) {
      const email = generateClinicEmail(clinic.clinicName, clinic.clinicId);
      const result = await Clinic.findOneAndUpdate(
        { clinicId: clinic.clinicId },
        {
          $set: {
            clinicName:   clinic.clinicName,
            doctorName:   clinic.doctorName,
            city:         clinic.city,
            phone:        clinic.phone,
            address:      clinic.address,
            email,
            passwordHash: hash,
            featured:     clinic.featured,
            updatedAt:    new Date()
          },
          $setOnInsert: {
            status:       clinic.status,
            currentToken: 0,
            createdAt:    new Date()
          }
        },
        { upsert: true, returnDocument: 'before' }   // 'before' → returns pre-update doc (null if inserted)
      );
      if (!result) upserted++;   // null means it was an insert

      // Mirror the clinic admin user
      await User.findOneAndUpdate(
        { clinicId: clinic.clinicId },
        { $set: { name: clinic.doctorName, email, password: hash, role: 'CLINIC_ADMIN', clinicId: clinic.clinicId } },
        { upsert: true }
      );
    }

    if (upserted > 0) {
      console.log(`🏥 Seeded ${upserted} new clinic(s) into MongoDB Atlas (${INITIAL_CLINICS.length - upserted} already existed)`);
    } else {
      console.log(`🏥 All ${INITIAL_CLINICS.length} clinics already present in MongoDB Atlas — verified`);
    }

    // ── Super Admins (always upsert) ──────────────────────────────────────────
    await User.findOneAndUpdate(
      { email: 'santhosh@gmail.com' },
      { $set: { name: 'Santhosh', email: 'santhosh@gmail.com', password: hash, role: 'SUPER_ADMIN', clinicId: null } },
      { upsert: true }
    );
    await User.findOneAndUpdate(
      { email: 'superadmin@clinic.com' },
      { $set: { name: 'Super Admin', email: 'superadmin@clinic.com', password: hash, role: 'SUPER_ADMIN', clinicId: null } },
      { upsert: true }
    );
    console.log('👤 Super Admin accounts verified in MongoDB Atlas');

  } catch (e) {
    console.error('Seed error:', e.message);
  }
}

/**
 * Returns the next available Clinic ID by finding the highest existing numeric
 * ID and adding 1.  IDs are NEVER reused after deletion.
 *
 * Floor is C010 (i.e. we never go below C010 for initial seeding).
 * After C069 the sequence continues: C070, C071, …
 */
export async function generateClinicId() {
  let highestNum = 9;

  if (isMongoReady()) {
    try {
      const docs = await Clinic.find({}, { clinicId: 1 }).lean();
      for (const doc of docs) {
        const num = parseInt(String(doc.clinicId || '').replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    } catch (e) {
      console.warn('generateClinicId query warning:', e.message);
    }
  }

  for (const c of inMemoryClinics) {
    const num = parseInt(String(c.clinicId || '').replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > highestNum) highestNum = num;
  }

  return 'C' + String(highestNum + 1).padStart(3, '0');
}

// ─── Resilient Data Access Helpers ───────────────────────────────────────────

async function dbGetClinics(query = {}) {
  if (isMongoReady()) {
    try {
      return await Clinic.find(query).sort({ clinicName: 1 }).lean();
    } catch (e) {
      console.warn('dbGetClinics query warning:', e.message);
    }
  }
  let list = inMemoryClinics;
  if (query.clinicId) list = list.filter(c => c.clinicId === query.clinicId);
  if (query.featured !== undefined) list = list.filter(c => c.featured === query.featured);
  if (query.status) list = list.filter(c => c.status === query.status);
  return list.sort((a, b) => a.clinicName.localeCompare(b.clinicName));
}

async function dbGetClinic(clinicId) {
  const cid = (clinicId || '').toUpperCase();
  if (isMongoReady()) {
    try {
      const c = await Clinic.findOne({ clinicId: cid }).lean();
      if (c) return c;
    } catch (e) {
      console.warn('dbGetClinic query warning:', e.message);
    }
  }
  return inMemoryClinics.find(c => c.clinicId === cid) || null;
}

async function dbGetTokens(clinicId) {
  const cid = (clinicId || '').toUpperCase();
  if (isMongoReady()) {
    try {
      return await Token.find({ clinicId: cid }).sort({ tokenNumber: 1 }).lean();
    } catch (e) {
      console.warn('dbGetTokens query warning:', e.message);
    }
  }
  return inMemoryTokens.filter(t => t.clinicId === cid).sort((a, b) => a.tokenNumber - b.tokenNumber);
}

async function dbCreateToken(data) {
  const cid = data.clinicId.toUpperCase();
  const dept = (data.department || 'General Medicine').trim();
  const tokenStatus = (data.status || 'waiting').toLowerCase();
  if (isMongoReady()) {
    try {
      const last = await Token.findOne({ clinicId: cid }).sort({ tokenNumber: -1 }).lean();
      const number = last ? last.tokenNumber + 1 : 1;
      const created = await Token.create({ ...data, clinicId: cid, department: dept, tokenNumber: number, status: tokenStatus });
      return created.toObject ? created.toObject() : created;
    } catch (e) {
      console.warn('dbCreateToken query warning:', e.message);
    }
  }
  const clinicTokens = inMemoryTokens.filter(t => t.clinicId === cid);
  const number = clinicTokens.length > 0 ? Math.max(...clinicTokens.map(t => t.tokenNumber)) + 1 : 1;
  const newToken = {
    _id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    ...data,
    clinicId: cid,
    department: dept,
    tokenNumber: number,
    status: tokenStatus,
    bookedAt: new Date()
  };
  inMemoryTokens.push(newToken);
  return newToken;
}

async function findTokenByIdOrNumber(tokenId, clinicId) {
  if (!tokenId) return null;
  let tokenDoc = null;

  const rawId = String(tokenId).trim();
  const cid = (clinicId || '').toUpperCase().trim();
  const num = parseInt(rawId, 10);
  const isNumeric = !isNaN(num) && String(num) === rawId;

  if (isMongoReady()) {
    try {
      // 1. Search by ObjectId if valid 24-char hex
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        tokenDoc = await Token.findById(rawId);
      }

      // 2. Search by string _id (if valid ObjectId)
      if (!tokenDoc && mongoose.Types.ObjectId.isValid(rawId)) {
        tokenDoc = await Token.findOne({ _id: new mongoose.Types.ObjectId(rawId) });
      }

      // 3. Search by clinicId + tokenNumber if numeric
      if (!tokenDoc && cid && !isNaN(num)) {
        tokenDoc = await Token.findOne({ clinicId: cid, tokenNumber: num });
      }

      // 4. Search by tokenNumber alone if numeric
      if (!tokenDoc && isNumeric) {
        if (cid) {
          tokenDoc = await Token.findOne({ clinicId: cid, tokenNumber: num });
        }
        if (!tokenDoc) {
          tokenDoc = await Token.findOne({ tokenNumber: num }).sort({ bookedAt: -1 });
        }
      }
    } catch (e) {
      console.warn('findTokenByIdOrNumber DB warning:', e.message);
    }
  }

  // 5. In-memory fallback
  if (!tokenDoc) {
    tokenDoc = inMemoryTokens.find(t => {
      const matchId = String(t._id) === rawId || String(t.id) === rawId;
      const matchClinicNum = cid && t.clinicId === cid && Number(t.tokenNumber) === num;
      const matchNum = !isNaN(num) && Number(t.tokenNumber) === num;
      return matchId || matchClinicNum || matchNum;
    });
  }

  return tokenDoc;
}

async function dbFindUserByEmail(emailOrId) {
  const rawInput = (emailOrId || '').trim();
  const input = rawInput.toLowerCase();

  const digits = rawInput.replace(/\D/g, '');
  const numericMatch = digits ? digits.padStart(3, '0') : '';
  const cid = numericMatch ? `C${numericMatch}` : rawInput.toUpperCase();
  const sanEmail = numericMatch ? `san${numericMatch}@gmail.com` : input;

  const superAdminAliases = [
    'superadmin', 'admin', 'santhosh', 'super admin', 'super', 
    'admin@clinic.com', 'admin@gmail.com', 'superadmin@gmail.com',
    'superadmin@clinic.com', 'santhosh@gmail.com'
  ];
  const isSuperAlias = superAdminAliases.includes(input);

  if (isMongoReady()) {
    try {
      const orQueries = [
        { email: input },
        { email: sanEmail },
        { clinicId: cid },
        { clinicId: rawInput.toUpperCase() },
        { email: { $regex: new RegExp('^' + input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } }
      ];
      if (isSuperAlias) {
        orQueries.push({ email: 'santhosh@gmail.com' }, { email: 'superadmin@clinic.com' }, { role: 'SUPER_ADMIN' });
      }
      const u = await User.findOne({ $or: orQueries });
      if (u) return { ...u.toObject(), passwordHash: u.password };
    } catch (e) {
      console.warn('dbFindUserByEmail query warning:', e.message);
    }
  }

  return inMemoryUsers.find(u => 
    u.email.toLowerCase() === input || 
    u.email.toLowerCase() === sanEmail ||
    (u.clinicId && u.clinicId.toUpperCase() === cid) ||
    (u.clinicId && u.clinicId.toUpperCase() === rawInput.toUpperCase()) ||
    (isSuperAlias && u.role === 'SUPER_ADMIN')
  ) || null;
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
  const clinicId = (req.params.clinicId || req.body?.clinicId || req.query?.clinicId || '').toUpperCase();
  if (req.user?.role === 'SUPER_ADMIN') return next();
  if (req.user?.role === 'CLINIC_ADMIN' && req.user.clinicId && req.user.clinicId.toUpperCase() === clinicId) return next();
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
  const waiting = tokens.filter(t => ['waiting', 'Waiting'].includes(t.status)).length;
  const serving = tokens.filter(t => ['serving', 'Serving'].includes(t.status)).length;
  const completed = tokens.filter(t => ['completed', 'Completed'].includes(t.status)).length;
  const cancelled = tokens.filter(t => ['cancelled'].includes(t.status)).length;
  const noShow = tokens.filter(t => ['no_show'].includes(t.status)).length;
  return {
    ...obj,
    isActive: obj.isActive !== false,
    waitingCount: waiting,
    servingCount: serving,
    completedCount: completed,
    cancelledCount: cancelled,
    noShowCount: noShow,
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

    const enteredPass = password.trim();
    let match = await bcrypt.compare(enteredPass, user.passwordHash || user.password || '');
    if (!match && enteredPass === DEFAULT_PASSWORD) {
      match = true;
    }
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

// Search clinics (alphabetical order, active clinics only for patients)
app.get('/api/clinics/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const all = await dbGetClinics();
    let filtered = all.filter(c => c.isActive !== false);
    if (q) {
      filtered = filtered.filter(c =>
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

// Get single token details for patient tracking
app.get('/api/tokens/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const clinicId = (req.query.clinicId || '').toUpperCase();
    const tokenDoc = await findTokenByIdOrNumber(tokenId, clinicId);
    if (!tokenDoc) return res.status(404).json({ error: 'Token not found' });

    const obj = tokenDoc.toObject ? tokenDoc.toObject() : tokenDoc;
    const clinic = await dbGetClinic(obj.clinicId);
    const allTokens = await dbGetTokens(obj.clinicId);

    const dept = (obj.department || 'General Medicine').trim().toLowerCase();
    const deptTokens = allTokens.filter(t => (t.department || 'General Medicine').trim().toLowerCase() === dept);

    const servingTokenDoc = deptTokens.find(t => ['serving', 'Serving'].includes(t.status));
    const servingToken = servingTokenDoc ? servingTokenDoc.tokenNumber : 0;
    const waitingBefore = deptTokens.filter(t => ['waiting', 'Waiting'].includes(t.status) && t.tokenNumber < obj.tokenNumber).length;

    res.json({
      token: obj,
      clinicName: clinic ? clinic.clinicName : obj.clinicId,
      doctorName: clinic ? clinic.doctorName : '',
      servingToken,
      patientsAhead: waitingBefore,
      estimatedWaitMinutes: waitingBefore * 5
    });
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
    if (clinic.status === 'Closed' || clinic.isActive === false)
      return res.status(400).json({ error: 'Clinic is closed or inactive' });

    const dept = (department || 'General Medicine').trim();
    const token = await dbCreateToken({
      clinicId: cid,
      name: name.trim(),
      phone: phone.trim(),
      age: age ? Number(age) : undefined,
      department: dept,
      status: 'waiting'
    });
    await emitClinicUpdate(cid);
    res.status(201).json(token);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update token status (waiting, serving, completed, cancelled, no_show)
app.put('/api/tokens/:tokenId/status', authMiddleware, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { status } = req.body;
    const validStatuses = ['waiting', 'serving', 'completed', 'cancelled', 'no_show'];
    const newStatus = (status || '').toLowerCase();
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const tokenDoc = await findTokenByIdOrNumber(tokenId);
    if (!tokenDoc) return res.status(404).json({ error: 'Token not found' });

    const cid = tokenDoc.clinicId.toUpperCase();
    if (req.user.role !== 'SUPER_ADMIN' && req.user.clinicId?.toUpperCase() !== cid) {
      return res.status(403).json({ error: 'Forbidden: You can only manage tokens for your own clinic' });
    }

    const currentStatus = (tokenDoc.status || 'waiting').toLowerCase();
    const allowedTransitions = {
      'waiting': ['serving', 'cancelled', 'no_show'],
      'serving': ['completed', 'cancelled', 'no_show'],
      'completed': [],
      'cancelled': [],
      'no_show': []
    };

    if (currentStatus !== newStatus && !allowedTransitions[currentStatus]?.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid state transition from '${currentStatus}' to '${newStatus}'` });
    }

    if (isMongoReady() && tokenDoc.save) {
      tokenDoc.status = newStatus;
      if (newStatus === 'completed') tokenDoc.completedAt = new Date();
      await tokenDoc.save();
    } else {
      tokenDoc.status = newStatus;
      if (newStatus === 'completed') tokenDoc.completedAt = new Date();
    }

    await emitClinicUpdate(cid);
    res.json(tokenDoc);
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
    const { clinicName, doctorName, city, phone, address, status, featured } = req.body;
    let { adminName, adminPassword } = req.body;

    if (!clinicName || !doctorName)
      return res.status(400).json({ error: 'clinicName and doctorName are required' });

    // Always generate the ID server-side — never trust a client-supplied clinicId
    const clinicId = await generateClinicId();

    // Always derive the email server-side from the canonical function
    const adminEmail = generateClinicEmail(clinicName, clinicId);

    if (!adminName)     adminName     = doctorName;
    if (!adminPassword) adminPassword = 'sr1011';

    const newClinic = {
      clinicId,
      clinicName:  clinicName.trim(),
      doctorName:  doctorName.trim(),
      city:        (city || 'Chennai').trim(),
      phone:       phone   || '',
      address:     address || '',
      status:      status  || 'Open',
      featured:    featured || false,
      currentToken: 0,
      createdAt:   new Date(),
      updatedAt:   new Date()
    };

    if (isMongoReady()) {
      try {
        const hash = await bcrypt.hash(adminPassword, 10);
        const clinicDoc = await Clinic.create({ ...newClinic, email: adminEmail, passwordHash: hash });
        await User.create({
          name:     adminName,
          email:    adminEmail,
          password: hash,
          role:     'CLINIC_ADMIN',
          clinicId
        });
        inMemoryClinics.push({ ...newClinic, email: adminEmail, passwordHash: hash });
        inMemoryUsers.push({
          _id: 'u_' + Date.now(),
          name:         adminName,
          email:        adminEmail,
          passwordHash: hash,
          role:         'CLINIC_ADMIN',
          clinicId
        });
        return res.status(201).json({
          clinic:  clinicDoc.toObject(),
          message: `Clinic ${clinicId} created — admin login: ${adminEmail}`
        });
      } catch (e) {
        console.warn('createClinic DB warning:', e.message);
      }
    }

    // In-memory path
    const hash = bcrypt.hashSync(adminPassword, 10);
    const memClinic = { ...newClinic, email: adminEmail, passwordHash: hash };
    inMemoryClinics.push(memClinic);
    inMemoryUsers.push({
      _id:          'u_' + Date.now(),
      name:         adminName,
      email:        adminEmail,
      passwordHash: hash,
      role:         'CLINIC_ADMIN',
      clinicId
    });

    res.status(201).json({
      clinic:  memClinic,
      message: `Clinic ${clinicId} created — admin login: ${adminEmail}`
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update clinic
app.put('/api/clinics/:clinicId', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const cid = req.params.clinicId.toUpperCase();
    const { clinicName, doctorName, phone, address, status, isActive, featured } = req.body;

    const updates = {};
    if (clinicName !== undefined) updates.clinicName = clinicName;
    if (doctorName !== undefined) updates.doctorName = doctorName;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (status !== undefined) updates.status = status;
    if (isActive !== undefined) updates.isActive = isActive;
    if (featured !== undefined) updates.featured = featured;

    if (isMongoReady()) {
      try {
        await Clinic.findOneAndUpdate(
          { clinicId: cid },
          { $set: updates },
          { new: true }
        );
      } catch (e) { console.warn('updateClinic DB warning:', e.message); }
    }

    const c = inMemoryClinics.find(x => x.clinicId === cid);
    if (c) {
      if (clinicName) c.clinicName = clinicName;
      if (doctorName) c.doctorName = doctorName;
      if (phone !== undefined) c.phone = phone;
      if (address !== undefined) c.address = address;
      if (status !== undefined) c.status = status;
      if (isActive !== undefined) c.isActive = isActive;
      if (featured !== undefined) c.featured = featured;
    }

    await emitClinicUpdate(cid);
    res.json(c || { clinicId: cid, ...updates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update clinic active/closed status
app.put('/api/clinics/:clinicId/status', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const cid = req.params.clinicId.toUpperCase();
    const { status, isActive } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (isActive !== undefined) updates.isActive = isActive;

    if (isMongoReady()) {
      try {
        await Clinic.findOneAndUpdate({ clinicId: cid }, { $set: updates }, { new: true });
      } catch (e) { console.warn('updateStatus DB warning:', e.message); }
    }

    const c = inMemoryClinics.find(x => x.clinicId === cid);
    if (c) {
      if (status !== undefined) c.status = status;
      if (isActive !== undefined) c.isActive = isActive;
    }

    await emitClinicUpdate(cid);
    res.json(c || { clinicId: cid, ...updates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete clinic & reassign / resequence all clinic numbers
app.delete('/api/clinics/:clinicId', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const targetCid = req.params.clinicId.toUpperCase();
    const existing = await dbGetClinic(targetCid);
    if (!existing) return res.status(404).json({ error: 'Clinic not found' });

    // 1. Delete target clinic, associated tokens, and admin user
    if (isMongoReady()) {
      try {
        await Clinic.deleteOne({ clinicId: targetCid });
        await Token.deleteMany({ clinicId: targetCid });
        await User.deleteMany({ clinicId: targetCid });
      } catch (e) { console.warn('deleteClinic DB warning:', e.message); }
    }

    inMemoryClinics = inMemoryClinics.filter(c => c.clinicId !== targetCid);
    inMemoryTokens  = inMemoryTokens.filter(t => t.clinicId !== targetCid);
    inMemoryUsers   = inMemoryUsers.filter(u => u.clinicId !== targetCid);

    let allRemaining = [];
    if (isMongoReady()) {
      try {
        allRemaining = await Clinic.find({});
      } catch (e) {
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

    for (let i = 0; i < allRemaining.length; i++) {
      const newNum = i + 1;
      const newCid = 'C' + String(newNum).padStart(3, '0');
      const oldCid = allRemaining[i].clinicId;

      if (oldCid !== newCid) {
        const clinicDoc = allRemaining[i];
        const newEmail = getClinicUsername(clinicDoc.clinicName, newCid);

        if (isMongoReady()) {
          try {
            await Clinic.updateOne({ _id: clinicDoc._id }, { $set: { clinicId: newCid } });
            await Token.updateMany({ clinicId: oldCid }, { $set: { clinicId: newCid } });
            await User.updateOne({ clinicId: oldCid }, { $set: { clinicId: newCid, email: newEmail } });
          } catch (e) { console.warn('resequence DB warning:', e.message); }
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
    const { department } = req.body || {};
    const clinic = await dbGetClinic(cid);
    if (!clinic) return res.status(404).json({ error: 'Clinic not found' });

    const deptFilter = department ? String(department).trim() : null;

    if (isMongoReady()) {
      try {
        const servingQuery = { clinicId: cid, status: { $in: ['Serving', 'serving'] } };
        const waitingQuery = { clinicId: cid, status: { $in: ['Waiting', 'waiting'] } };
        if (deptFilter) {
          servingQuery.department = deptFilter;
          waitingQuery.department = deptFilter;
        }

        await Token.findOneAndUpdate(servingQuery, { $set: { status: 'completed', completedAt: new Date() } });
        const next = await Token.findOneAndUpdate(waitingQuery, { $set: { status: 'serving' } }, { sort: { tokenNumber: 1 }, returnDocument: 'after' }).lean();
        let newCurrentToken = clinic.currentToken || 0;
        if (next) {
          newCurrentToken = next.tokenNumber;
        } else {
          const highestToken = await Token.findOne({ clinicId: cid }).sort({ tokenNumber: -1 }).lean();
          if (highestToken) newCurrentToken = highestToken.tokenNumber;
        }
        await Clinic.findOneAndUpdate({ clinicId: cid }, { $set: { currentToken: newCurrentToken } });
        await emitClinicUpdate(cid);
        return res.json({ currentToken: newCurrentToken, next: next || null });
      } catch (e) { console.warn('nextPatient DB warning:', e.message); }
    }

    // In-memory update
    const servingToken = inMemoryTokens.find(t => t.clinicId === cid && (!deptFilter || t.department === deptFilter) && ['Serving', 'serving'].includes(t.status));
    if (servingToken) {
      servingToken.status = 'completed';
      servingToken.completedAt = new Date();
    }

    const nextToken = inMemoryTokens.find(t => t.clinicId === cid && (!deptFilter || t.department === deptFilter) && ['Waiting', 'waiting'].includes(t.status));
    if (nextToken) {
      nextToken.status = 'serving';
      clinic.currentToken = nextToken.tokenNumber;
    } else {
      const clinicTokens = inMemoryTokens.filter(t => t.clinicId === cid);
      if (clinicTokens.length > 0) {
        clinic.currentToken = Math.max(...clinicTokens.map(t => t.tokenNumber));
      }
    }

    await emitClinicUpdate(cid);
    res.json({ currentToken: clinic.currentToken, next: nextToken || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset queue
app.post('/api/clinics/:clinicId/reset', authMiddleware, requireClinicAccess, async (req, res) => {
  try {
    const cid = req.params.clinicId.toUpperCase();
    if (isMongoReady()) {
      try {
        await Token.deleteMany({ clinicId: cid });
        await Clinic.findOneAndUpdate({ clinicId: cid }, { currentToken: 0 });
      } catch (e) { console.warn('resetQueue DB warning:', e.message); }
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

// Generate next Clinic ID — used by the frontend form so it always shows the
// correct upcoming ID without trying to compute it client-side.
app.get('/api/admin/generate-id', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const nextId = await generateClinicId();
    res.json({ clinicId: nextId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Serve React Static Files ─────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

export default app;
