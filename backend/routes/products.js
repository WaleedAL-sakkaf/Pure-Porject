const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db'); // We will create this db module shortly
const { keysToCamel } = require('../utils/caseConverter');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/products');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('يجب أن يكون الملف صورة (jpg, png, gif, etc.)'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(keysToCamel(rows));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ message: 'Error fetching products from database' });
  }
});

// GET /api/products/:id - Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(keysToCamel(rows[0]));
  } catch (error) {
    console.error(`Failed to fetch product ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching product from database' });
  }
});

// POST /api/products - Add a new product (with optional image)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, wholesalePrice, stock, description } = req.body;
    if (!name || !category || !price || stock === undefined) {
      return res.status(400).json({ message: 'Missing required fields: name, category, price, stock' });
    }

    const newProduct = {
      id: uuidv4(),
      name,
      category,
      price,
      wholesale_price: wholesalePrice,
      stock,
      description,
      image: req.file ? `/uploads/products/${req.file.filename}` : null
    };

    await db.query('INSERT INTO products SET ?', newProduct);
    res.status(201).json(keysToCamel(newProduct));
  } catch (error) {
    console.error('Failed to add product:', error);
    res.status(500).json({ message: 'Error adding product to database' });
  }
});

// PUT /api/products/:id - Update an existing product (with optional new image)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, wholesalePrice, stock, description } = req.body;

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const currentProduct = rows[0];
    
    const updatedFields = {
      name: name,
      category: category,
      price: price,
      wholesale_price: wholesalePrice,
      stock: stock,
      description: description,
    };

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (currentProduct.image) {
        const oldImagePath = path.join(__dirname, '..', currentProduct.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updatedFields.image = `/uploads/products/${req.file.filename}`;
    }

    // Remove undefined fields so they don't overwrite existing data
    Object.keys(updatedFields).forEach(key => updatedFields[key] === undefined && delete updatedFields[key]);

    if(Object.keys(updatedFields).length === 0) {
        const [currentProduct] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        return res.json(keysToCamel(currentProduct[0]));
    }

    await db.query('UPDATE products SET ? WHERE id = ?', [updatedFields, id]);

    const [updatedProduct] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(keysToCamel(updatedProduct[0]));
  } catch (error) {
    console.error(`Failed to update product ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating product in database' });
  }
});

// DELETE /api/products/:id - Delete a product (and its image)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product info to delete image
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = rows[0];
    
    // Delete from database
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    
    // Delete image file if exists
    if (product.image) {
      const imagePath = path.join(__dirname, '..', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(204).send(); // No Content
  } catch (error) {
    console.error(`Failed to delete product ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting product from database' });
  }
});

module.exports = router; 