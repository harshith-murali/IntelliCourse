/**
 * Seed Script — creates demo accounts for development/testing
 * Run with: node seed.js (from the backend/ directory)
 *
 * Demo accounts created:
 *   Student:    john@example.com  / Demo@1234!
 *   Instructor: sarah@example.com / Demo@1234!
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const DEMO_PASSWORD = 'Demo@1234!'; // meets: 8+ chars, upper, lower, number, special

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  role: { type: String, default: 'student' },
  avatar: String,
  enrolledCourses: [],
  createdCourses: [],
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const demoUsers = [
  {
    name: 'John Student',
    email: 'john@example.com',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    name: 'Sarah Instructor',
    email: 'sarah@example.com',
    role: 'instructor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
];

async function seed() {
  try {
    // Try Atlas first, fall back to local MongoDB (same logic as the backend)
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB Atlas');
    } catch (atlasErr) {
      console.warn('⚠️  Atlas unreachable, falling back to local MongoDB...');
      await mongoose.connect('mongodb://127.0.0.1:27017/lms', { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to local MongoDB');
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

    for (const u of demoUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`⚠️  User ${u.email} already exists — skipping`);
        continue;
      }
      await User.create({ ...u, password: hashedPassword });
      console.log(`✅ Created: ${u.email} (${u.role})`);
    }

    console.log('\n🎉 Seed complete!');
    console.log('   Email: john@example.com    Password: Demo@1234!');
    console.log('   Email: sarah@example.com   Password: Demo@1234!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
