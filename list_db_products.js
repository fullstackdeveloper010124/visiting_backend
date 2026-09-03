import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printflow');
    console.log('Connected.');

    const products = await Product.find({});
    console.log(`Found ${products.length} products in DB:`);
    products.forEach((p, idx) => {
      console.log(`${idx + 1}. [${p.status}] SKU: ${p.sku}, Name: ${p.name}, Category: ${p.category}, Order: ${p.displayOrder}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
