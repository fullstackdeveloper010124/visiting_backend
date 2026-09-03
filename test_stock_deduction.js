import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Inventory from './models/Inventory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printflow';

async function test() {
  await mongoose.connect(MONGODB_URI);
  
  // 1. Get letterhead product
  const letterhead = await Product.findOne({ sku: 'LH-CORP' });
  
  // 2. Get current inventory
  const initialInventory = await Inventory.findOne({ product: letterhead._id });
  console.log(`Initial stock for Letterheads: ${initialInventory.quantityAvailable}`);
  
  // 3. Login
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@company.com', password: 'user123' })
  });
  const loginData = await loginRes.json();
  console.log(loginData);
  const token = loginData.data.token;
  
  // 4. Place order for 10 reams
  console.log('Placing order for 10 reams of letterheads...');
  const orderRes = await fetch('http://localhost:5000/api/v1/orders', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [
        {
          product: letterhead._id,
          quantity: 10, // 10 reams
          unitPrice: 250,
          subtotal: 2500,
          customization: {}
        }
      ],
      subtotal: 2500,
      tax: 0,
      shipping: 0,
      total: 2500,
      paymentStatus: 'paid',
      delivery: { status: 'pending' }
    })
  });
  const orderData = await orderRes.json();
  
  if (orderData.success) {
    console.log('Order created successfully!');
  } else {
    console.error('Failed to create order:', orderData);
  }
  
  // 5. Get final inventory
  const finalInventory = await Inventory.findOne({ product: letterhead._id });
  console.log(`Final stock for Letterheads: ${finalInventory.quantityAvailable}`);
  
  console.log(`Deducted: ${initialInventory.quantityAvailable - finalInventory.quantityAvailable}`);
  console.log(`Expected Deduction: 5000 (10 reams * 500)`);
  
  process.exit(0);
}

test();
