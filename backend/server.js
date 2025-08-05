// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');

// Enable environment variables support
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not installed. Using default environment variables.');
}

const app = express();

// Use middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON request bodies

// Serve static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import API routes
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const driverRoutes = require('./routes/drivers');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const invoiceRoutes = require('./routes/invoices');
const authRoutes = require('./routes/auth');
const backupRoutes = require('./routes/backup');

// --- API ENDPOINTS ---

// A simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Pure Water Control API!' });
});

// Use API routes
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/backup', backupRoutes);

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
  console.log(`📁 Static files served at http://localhost:${PORT}/uploads`);
}); 