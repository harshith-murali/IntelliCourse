/**
 * Database Reset Script
 * Clears all documents from every collection while preserving schemas and indexes.
 * Run with: node reset-db.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const COLLECTIONS = [
  'users',
  'courses',
  'lectures',
  'mediaassets',
  'courseprogresses',
  'coursepurchases',
];

async function resetDatabase() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[ERROR] MONGO_URI not set in .env');
    process.exit(1);
  }

  console.log('\n🔄  Connecting to MongoDB...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.warn(`⚠️ Could not connect to Atlas: ${err.message}. Falling back to local MongoDB...`);
    uri = "mongodb://127.0.0.1:27017/lms";
    await mongoose.connect(uri);
  }
  console.log('✅  Connected.\n');

  const db = mongoose.connection.db;

  for (const col of COLLECTIONS) {
    try {
      const result = await db.collection(col).deleteMany({});
      console.log(`🗑️   ${col}: deleted ${result.deletedCount} document(s)`);
    } catch (err) {
      console.warn(`⚠️   ${col}: ${err.message}`);
    }
  }

  console.log('\n✅  Database reset complete. All records removed, schemas preserved.');
  await mongoose.disconnect();
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
