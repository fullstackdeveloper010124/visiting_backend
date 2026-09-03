import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printflow';

if (MONGODB_URI.startsWith('mongodb+srv')) {
  dns.setServers(['8.8.8.8']);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, Name: ${u.fullName}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
