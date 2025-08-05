const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { keysToCamel } = require('../utils/caseConverter');

const router = express.Router();

// GET /api/drivers - Get all drivers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM drivers');
    res.json(keysToCamel(rows));
  } catch (error) {
    console.error('Failed to fetch drivers:', error);
    res.status(500).json({ message: 'Error fetching drivers from database' });
  }
});

// GET /api/drivers/:id - Get a single driver by ID
router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.json(keysToCamel(rows[0]));
    } catch (error) {
      console.error(`Failed to fetch driver ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error fetching driver from database' });
    }
  });

// POST /api/drivers - Add a new driver
router.post('/', async (req, res) => {
  try {
    const { name, phone, vehicleNumber } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Missing required fields: name, phone' });
    }

    const newDriver = {
      id: uuidv4(),
      name,
      phone,
      vehicle_number: vehicleNumber,
    };

    await db.query('INSERT INTO drivers SET ?', newDriver);
    res.status(201).json(keysToCamel(newDriver));
  } catch (error) {
    console.error('Failed to add driver:', error);
    res.status(500).json({ message: 'Error adding driver to database' });
  }
});

// PUT /api/drivers/:id - Update an existing driver
router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, vehicleNumber } = req.body;
  
      const [rows] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      const updatedFields = {
        name,
        phone,
        vehicle_number: vehicleNumber
      };

      Object.keys(updatedFields).forEach(key => updatedFields[key] === undefined && delete updatedFields[key]);

      if(Object.keys(updatedFields).length === 0) {
        return res.json(keysToCamel(rows[0]));
      }
  
      await db.query('UPDATE drivers SET ? WHERE id = ?', [updatedFields, id]);
      const [updatedDriver] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
      res.json(keysToCamel(updatedDriver[0]));
    } catch (error) {
      console.error(`Failed to update driver ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error updating driver in database' });
    }
  });
  
// DELETE /api/drivers/:id - Delete a driver
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await db.query('DELETE FROM drivers WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      res.status(204).send();
    } catch (error) {
      console.error(`Failed to delete driver ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error deleting driver from database' });
    }
  });

module.exports = router; 