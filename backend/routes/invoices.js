const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { keysToCamel } = require('../utils/caseConverter');

// GET all invoices
// This endpoint will retrieve all invoices and for each invoice, it will fetch the associated order items.
router.get('/', async (req, res) => {
  try {
    const [invoices] = await db.query('SELECT * FROM invoices ORDER BY issue_date DESC');
    
    // For each invoice, get the associated order items
    for (const invoice of invoices) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [invoice.order_id]);
      invoice.items = items;
    }

    res.json(keysToCamel(invoices));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// PUT /api/invoices/:id/paid - Mark an invoice as paid
router.put('/:id/paid', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('UPDATE invoices SET is_paid = true WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const [[invoice]] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [invoice.order_id]);
    invoice.items = items;

    res.json(keysToCamel(invoice));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating invoice status' });
  }
});

module.exports = router; 