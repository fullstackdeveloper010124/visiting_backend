import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect('mongodb://127.0.0.1:27017/printflow').then(async () => {
  const user = await User.findOne({ email: 'superuser@company.com' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  console.log('User passwordHash:', user.passwordHash);
  const isMatch = await user.comparePassword('admin123');
  console.log('superuser@company.com / admin123 -> Match?', isMatch);
  
  process.exit(0);
});
