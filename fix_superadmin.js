import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printflow';

if (MONGODB_URI.startsWith('mongodb+srv')) {
  dns.setServers(['8.8.8.8']);
}

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Normalize email to match Mongoose lowercase rules
    const email = 'superuser@company.com';
    let superadmin = await User.findOne({ email });

    if (superadmin) {
      console.log('Superadmin found. Resetting password, role, and status...');
      superadmin.passwordHash = 'admin123'; // Mongoose pre-save middleware will automatically hash this
      superadmin.status = 'active';
      superadmin.role = 'super_user';
      await superadmin.save();
      console.log('Superadmin user updated successfully.');
    } else {
      console.log('Superadmin not found. Creating a new superadmin user...');
      superadmin = await User.create({
        email,
        passwordHash: 'admin123', // Mongoose pre-save middleware will automatically hash this
        fullName: 'Super User (Admin)',
        phone: '+1 (555) 019-9999',
        role: 'super_user',
        status: 'active',
      });
      console.log('Superadmin user created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error executing script:', err);
    process.exit(1);
  }
}

run();
