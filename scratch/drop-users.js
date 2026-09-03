import mongoose from 'mongoose';
import User from '../models/User.js';
mongoose.connect('mongodb://127.0.0.1:27017/printflow').then(async () => {
  await User.deleteMany({});
  console.log('Users collection dropped');
  process.exit(0);
});
