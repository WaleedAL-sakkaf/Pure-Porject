const express = require('express');
const db = require('../db');
const { keysToCamel } = require('../utils/caseConverter');

const router = express.Router();

// GET /api/dashboard/stats - Get dashboard summary statistics
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ pendingOrders }]] = await db.query("SELECT COUNT(*) as pendingOrders FROM orders WHERE status = 'قيد الانتظar'");
    const [[{ totalSales }]] = await db.query('SELECT SUM(total_amount) as totalSales FROM orders WHERE status = "تم التوصيل"');
    const [[{ totalCustomers }]] = await db.query('SELECT COUNT(*) as totalCustomers FROM customers');

    const stats = {
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalSales: totalSales || 0,
      totalCustomers: totalCustomers || 0,
    };
    
    res.json(keysToCamel(stats));

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// GET /api/dashboard/sales-report - Get data for sales report chart
router.get('/sales-report', async (req, res) => {
  try {
    // This query groups sales by date for the last 30 days.
    const [rows] = await db.query(`
      SELECT 
        CAST(order_date AS DATE) as date, 
        SUM(total_amount) as sales
      FROM orders 
      WHERE status = 'تم التوصيل' AND order_date >= CURDATE() - INTERVAL 30 DAY
      GROUP BY CAST(order_date AS DATE)
      ORDER BY date ASC
    `);
    res.json(keysToCamel(rows));
  } catch (error) {
    console.error('Failed to fetch sales report data:', error);
    res.status(500).json({ message: 'Error fetching sales report data' });
  }
});


module.exports = router; 