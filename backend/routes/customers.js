const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { keysToCamel } = require('../utils/caseConverter');

const router = express.Router();

// GET /api/customers - Get all customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers');
    res.json(keysToCamel(rows));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ message: 'Error fetching customers from database' });
  }
});

// GET /api/customers/:id - Get a single customer by ID
router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(keysToCamel(rows[0]));
    } catch (error) {
      console.error(`Failed to fetch customer ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error fetching customer from database' });
    }
  });

// POST /api/customers - Add a new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, customerType, temporaryExpiryDate, balance, ownedBottles } = req.body;
    if (!name || !phone || !customerType) {
      return res.status(400).json({ message: 'Missing required fields: name, phone, customerType' });
    }

    const newCustomer = {
      id: uuidv4(),
      name,
      phone,
      address,
      customer_type: customerType,
      temporary_expiry_date: customerType === 'مؤقت' ? temporaryExpiryDate : null,
      balance: balance || 0,
      owned_bottles: ownedBottles || 0,
    };

    await db.query('INSERT INTO customers SET ?', newCustomer);
    res.status(201).json(keysToCamel(newCustomer));
  } catch (error) {
    console.error('Failed to add customer:', error);
    res.status(500).json({ message: 'Error adding customer to database' });
  }
});

// PUT /api/customers/:id - Update an existing customer
router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, address, customerType, temporaryExpiryDate, balance, ownedBottles } = req.body;
  
      const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      const updatedFields = {
        name,
        phone,
        address,
        customer_type: customerType,
        temporary_expiry_date: temporaryExpiryDate,
        balance,
        owned_bottles: ownedBottles
      };

      Object.keys(updatedFields).forEach(key => updatedFields[key] === undefined && delete updatedFields[key]);
      
      if(Object.keys(updatedFields).length === 0) {
        return res.json(keysToCamel(rows[0]));
      }

      await db.query('UPDATE customers SET ? WHERE id = ?', [updatedFields, id]);
      const [updatedCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
      res.json(keysToCamel(updatedCustomer[0]));
    } catch (error) {
      console.error(`Failed to update customer ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error updating customer in database' });
    }
  });
  
// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;
      
      await connection.beginTransaction();
      
      // Check if customer exists
      const [customerRows] = await connection.query('SELECT * FROM customers WHERE id = ?', [id]);
      if (customerRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Check if customer has any orders
      const [orderRows] = await connection.query('SELECT id FROM orders WHERE customer_id = ?', [id]);
      
      if (orderRows.length > 0) {
        // Set customer_id to NULL in orders (assuming your schema allows this)
        await connection.query('UPDATE orders SET customer_id = NULL WHERE customer_id = ?', [id]);
      }
      
      // Now delete the customer
      await connection.query('DELETE FROM customers WHERE id = ?', [id]);
      
      await connection.commit();
      res.status(204).send(); // No Content
    } catch (error) {
      await connection.rollback();
      console.error(`Failed to delete customer ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error deleting customer from database', error: error.message });
    } finally {
      connection.release();
    }
  });

module.exports = router; 