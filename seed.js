import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';
import Product from './models/Product.js';
import Inventory from './models/Inventory.js';
import Order from './models/Order.js';
import Notification from './models/Notification.js';
import PickupLocation from './models/PickupLocation.js';


dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printflow';

if (MONGODB_URI.startsWith('mongodb+srv')) {
  dns.setServers(['8.8.8.8']);
}

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Clear existing collections
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});
    await PickupLocation.deleteMany({});
    console.log('Cleared.');


    // Create users (passwords will be hashed via Mongoose pre-save middleware)
    console.log('Creating seed users...');
    const superUser = await User.create({
      email: 'superuser@company.com',
      passwordHash: 'admin123',
      fullName: 'Super User (Admin)',
      phone: '+1 (555) 019-9999',
      role: 'super_user',
      status: 'active',
    });

    const standardUser = await User.create({
      email: 'user@company.com',
      passwordHash: 'user123',
      fullName: 'John Doe',
      phone: '+1 (555) 012-3456',
      role: 'user',
      status: 'active',
    });

    const inventoryAdmin = await User.create({
      email: 'inventory@company.com',
      passwordHash: 'inventory123',
      fullName: 'Stock Manager',
      phone: '+1 (555) 015-8888',
      role: 'inventory_admin',
      status: 'active',
    });

    const deliveryPerson = await User.create({
      email: 'delivery@company.com',
      passwordHash: 'delivery123',
      fullName: 'Courier Dave',
      phone: '+1 (555) 017-7777',
      role: 'delivery_person',
      status: 'active',
    });

    console.log(`Users seeded:
    - Super User: superuser@company.com / admin123
    - Standard User: user@company.com / user123
    - Inventory Admin: inventory@company.com / inventory123
    - Delivery Person: delivery@company.com / delivery123`);

    // Create products
    console.log('Creating seed products...');
    const p1 = await Product.create({
      sku: 'BC-PREM',
      name: 'Premium Business Cards',
      description: 'Elegant thick paper stocks with customizable branding layout details.',
      category: 'Business Cards',
      basePrice: 0.70,
      imageUrl: '/images/premium_business_cards.png',
      displayOrder: 1,
      tierPricing: [
        { minQuantity: 100, maxQuantity: 249, price: 3.50 },
        { minQuantity: 250, maxQuantity: 499, price: 1.30 },
        { minQuantity: 500, maxQuantity: 999, price: 0.50 },
        { minQuantity: 1000, maxQuantity: 10000, price: 0.225 }
      ]
    });

    const p2 = await Product.create({
      sku: 'LH-CORP',
      name: 'Corporate Letterheads',
      description: '8.5 x 11 inches watermarked letterheads for corporate correspondence.',
      category: 'Letterheads',
      basePrice: 0.50,
      imageUrl: '/images/corporate_letterheads.png',
      displayOrder: 2,
      tierPricing: [
        { minQuantity: 100, maxQuantity: 499, price: 0.50 },
        { minQuantity: 500, maxQuantity: 10000, price: 0.40 }
      ]
    });

    const p3 = await Product.create({
      sku: 'EV-PROF',
      name: 'Custom Envelopes',
      description: 'Standard No. 10 size envelopes, printed in full color.',
      category: 'Envelopes',
      basePrice: 0.45,
      imageUrl: '/images/custom_envelopes.png',
      displayOrder: 3,
      tierPricing: [
        { minQuantity: 100, maxQuantity: 499, price: 0.45 },
        { minQuantity: 500, maxQuantity: 10000, price: 0.35 }
      ]
    });

    const p4 = await Product.create({
      sku: 'NP-DESG',
      name: 'Designer Notepads',
      description: 'Custom 50-sheet designer notepads with premium binding.',
      category: 'Notepads',
      basePrice: 1.50,
      imageUrl: '/images/designer_notepads.png',
      displayOrder: 4,
      tierPricing: [
        { minQuantity: 50, maxQuantity: 199, price: 2.50 },
        { minQuantity: 200, maxQuantity: 10000, price: 1.50 }
      ]
    });

    const p5 = await Product.create({
      sku: 'FL-PRES',
      name: 'Presentation Folders',
      description: 'Premium custom presentation folders with pocket configurations.',
      category: 'Folders',
      basePrice: 2.00,
      imageUrl: '/images/presentation_folders.png',
      displayOrder: 5,
      tierPricing: [
        { minQuantity: 100, maxQuantity: 499, price: 3.00 },
        { minQuantity: 500, maxQuantity: 10000, price: 2.00 }
      ]
    });

    const p6 = await Product.create({
      sku: 'CS-COMP',
      name: 'Compliment Slips',
      description: 'Elegant slips for short notes and custom professional compliments.',
      category: 'Slips',
      basePrice: 0.30,
      imageUrl: '/images/compliment_slips.png',
      displayOrder: 6,
      tierPricing: [
        { minQuantity: 100, maxQuantity: 499, price: 0.40 },
        { minQuantity: 500, maxQuantity: 10000, price: 0.30 }
      ]
    });

    console.log('Products seeded successfully.');

    // Create inventory entries
    console.log('Creating seed inventory records...');
    await Inventory.create({
      product: p1._id,
      warehouseLocation: 'Shelf A-12',
      quantityAvailable: 25000,
      quantityReserved: 2500,
      reorderPoint: 1500,
      lastStockedAt: new Date(),
    });

    await Inventory.create({
      product: p2._id,
      warehouseLocation: 'Shelf B-04',
      quantityAvailable: 12500,
      quantityReserved: 500,
      reorderPoint: 1500,
      lastStockedAt: new Date(),
    });

    await Inventory.create({
      product: p3._id,
      warehouseLocation: 'Shelf C-01',
      quantityAvailable: 15000,
      quantityReserved: 1000,
      reorderPoint: 1000,
      lastStockedAt: new Date(),
    });

    await Inventory.create({
      product: p4._id,
      warehouseLocation: 'Shelf D-08',
      quantityAvailable: 8000,
      quantityReserved: 400,
      reorderPoint: 500,
      lastStockedAt: new Date(),
    });

    await Inventory.create({
      product: p5._id,
      warehouseLocation: 'Shelf E-15',
      quantityAvailable: 10000,
      quantityReserved: 800,
      reorderPoint: 800,
      lastStockedAt: new Date(),
    });

    await Inventory.create({
      product: p6._id,
      warehouseLocation: 'Shelf F-02',
      quantityAvailable: 18000,
      quantityReserved: 600,
      reorderPoint: 1000,
      lastStockedAt: new Date(),
    });

    console.log('Inventory seeded successfully.');

    // Create mock orders for standardUser
    console.log('Creating seed orders...');
    await Order.create({
      orderNumber: 'ORD-20260710-1001',
      customer: standardUser._id,
      status: 'delivered',
      items: [
        {
          product: p1._id,
          quantity: 500,
          unitPrice: 0.50,
          subtotal: 250.00,
          customization: {
            companyName: 'Star Technology',
            tagline: 'Innovating the Future',
            personName: 'John Doe',
            jobTitle: 'Lead Architect',
            phone: '+1 (555) 012-3456',
            email: 'user@company.com',
            primaryColor: '#10b981',
            secondaryColor: '#ffffff',
            fontFamily: 'sans',
            textColor: '#1e293b'
          },
          subtotal: 250.00
        }
      ],
      subtotal: 250.00,
      tax: 20.00,
      shipping: 0.00,
      total: 270.00,
      paymentStatus: 'paid',
      allowedPaymentMethod: 'credit_card',
      delivery: {
        status: 'delivered',
        deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        notes: `Shipping Address:
Name: John Doe
Phone: +1 (555) 012-3456
Address: 123 Designer Street, Apt 4B
City: New York, State: NY, Zip: 10001
Country: USA

Payment Method: CREDIT_CARD
Cardholder: John Doe
Card: **** **** **** 4242`
      }
    });

    await Order.create({
      orderNumber: 'ORD-20260715-1002',
      customer: standardUser._id,
      status: 'processing',
      items: [
        {
          product: p2._id,
          quantity: 200,
          unitPrice: 0.50,
          subtotal: 100.00,
          customization: {},
          subtotal: 100.00
        }
      ],
      subtotal: 100.00,
      tax: 8.00,
      shipping: 15.00,
      total: 123.00,
      paymentStatus: 'pending',
      allowedPaymentMethod: 'paypal',
      delivery: {
        status: 'pending',
        notes: `Shipping Address:
Name: John Doe
Phone: +1 (555) 012-3456
Address: 123 Designer Street, Apt 4B
City: New York, State: NY, Zip: 10001
Country: USA

Payment Method: PAYPAL (Sandbox awaiting completion)`
      }
    });
    console.log('Orders seeded successfully.');

    // Create mock notifications for super_user
    console.log('Creating seed notifications...');
    await Notification.create({
      title: 'New User Registered',
      message: 'New user John Doe (user@company.com) registered as user.',
      type: 'user_signup',
      targetRole: 'super_user',
      createdAt: new Date(Date.now() - 3600 * 1000) // 1 hour ago
    });

    await Notification.create({
      title: 'New Order Placed',
      message: 'John Doe placed order ORD-20260710-1001 for a total of $270.00.',
      type: 'order_created',
      targetRole: 'super_user',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000) // 2 hours ago
    });

    await Notification.create({
      title: 'Design Approval Requested',
      message: 'John Doe (user@company.com) submitted a design for approval.',
      type: 'design_approval',
      targetRole: 'super_user',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000) // 3 hours ago
    });
    console.log('Notifications seeded successfully.');

    // Seed pickup locations
    console.log('Seeding pickup locations...');
    await PickupLocation.create({
      name: 'Downtown Printing Hub',
      address: '456 Broadway Ave, Floor 2, New York, NY 10013',
      phone: '+1 (555) 019-8877'
    });

    await PickupLocation.create({
      name: 'Brooklyn Distribution Center',
      address: '789 Industrial Pkwy, Suite C, Brooklyn, NY 11201',
      phone: '+1 (555) 014-9922'
    });

    await PickupLocation.create({
      name: 'Queens Production Plant',
      address: '10-20 Manufacturing Rd, Long Island City, NY 11101',
      phone: '+1 (555) 016-5544'
    });
    console.log('Pickup locations seeded successfully.');

    console.log('Database seeding completed successfully!');


    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
