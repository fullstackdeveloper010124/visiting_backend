import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { initializeDefaultUsers } from './utils/initDb.js';

// Route imports
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import userRoutes from './routes/users.js';
import customizeConfigRoutes from './routes/customizeConfig.js';
import notificationRoutes from './routes/notifications.js';
import draftRoutes from './routes/drafts.js';
import pickupLocationRoutes from './routes/pickupLocations.js';


dotenv.config();

// Connect to MongoDB Database
connectDB().then(() => {
  initializeDefaultUsers();
});

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
// Enable gzip compression to reduce response sizes
app.use(compression());

// API Base Root Status check
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'PrintFlow API is running successfully',
    timestamp: new Date(),
  });
});

// Configure API Routing
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customize-config', customizeConfigRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/drafts', draftRoutes);
app.use('/api/v1/pickup-locations', pickupLocationRoutes);


// Handle 404 Route Errors
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Endpoint not found on this server.' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
  console.log(`Connection Endpoint: https://visiting-backend.onrender.com/api/status`);
});
