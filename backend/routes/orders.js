const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { keysToCamel } = require('../utils/caseConverter');

const router = express.Router();

// GET /api/orders - Get all orders with items
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY order_date DESC');
    const [items] = await db.query('SELECT * FROM order_items');
    
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: items.filter(item => item.order_id === order.id)
    }));
    
    res.json(keysToCamel(ordersWithItems));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ message: 'Error fetching orders from database' });
  }
});

// GET /api/orders/:id - Get a single order by ID
router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
      
      if (orderRows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const [itemRows] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
      
      const order = {
          ...orderRows[0],
          items: itemRows
      };

      res.json(keysToCamel(order));
    } catch (error) {
      console.error(`Failed to fetch order ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error fetching order from database' });
    }
  });


// POST /api/orders - Add a new order (with transaction)
router.post('/', async (req, res) => {
  const connection = await db.getConnection(); // Get a connection from the pool for transaction
  try {
    const { customerId, customerName, driverId, items, totalAmount, status, paymentMethod, saleType, deliveryAddress } = req.body;

    if (!items || items.length === 0 || !totalAmount || !status || !paymentMethod || !saleType) {
      return res.status(400).json({ message: 'Missing required fields for order' });
    }

    await connection.beginTransaction();

    // 1. Check stock for all items
    for (const item of items) {
      const [[product]] = await connection.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [item.productId]);
      if (!product || product.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for product ${item.productName}` });
      }
    }

    // Generate sequential order number
    const [orderNumberResult] = await connection.query('SELECT order_number FROM orders ORDER BY CAST(CASE WHEN order_number REGEXP "^[0-9]+$" THEN order_number ELSE REPLACE(order_number, "ORD-", "") END AS UNSIGNED) DESC LIMIT 1');
    
    let nextOrderNumber = 1; // Default start at 1
    
    if (orderNumberResult.length > 0) {
      // Extract the numeric part and increment
      const currentOrderNumber = orderNumberResult[0].order_number;
      // Support both new format (numeric only) and old format (ORD-xxxx)
      const match = currentOrderNumber.match(/(\d+)$/);
      if (match) {
        nextOrderNumber = parseInt(match[1], 10) + 1;
      }
    }

    // 2. Create the order with SHORT sequential number
    console.log(`🔢 Creating order with SHORT number: ${nextOrderNumber}`);
    const newOrder = {
      id: uuidv4(),
      order_number: String(nextOrderNumber), // SHORT sequential number (1, 2, 3, etc.)
      customer_id: customerId,
      customer_name: customerName,
      driver_id: driverId,
      total_amount: totalAmount,
      status,
      order_date: new Date(),
      payment_method: paymentMethod,
      sale_type: saleType,
      delivery_address: deliveryAddress,
    };
    await connection.query('INSERT INTO orders SET ?', newOrder);

    // 3. Insert order items and update stock
    for (const item of items) {
      const orderItem = {
        order_id: newOrder.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        sale_type: item.saleType
      };
      await connection.query('INSERT INTO order_items SET ?', orderItem);
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
    }
    
    await connection.commit();

    // Fetch the complete order to return
    const [finalOrder] = await connection.query('SELECT * FROM orders WHERE id = ?', [newOrder.id]);
    const [finalItems] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [newOrder.id]);

    res.status(201).json(keysToCamel({ ...finalOrder[0], items: finalItems }));

  } catch (error) {
    await connection.rollback();
    console.error('Failed to create order:', error);
    res.status(500).json({ message: 'Error creating order' });
  } finally {
    connection.release();
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    const connection = await db.getConnection();
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      await connection.beginTransaction();

      // If status is 'Delivered', set delivery_date to now if it's not already set.
      let deliveryDateUpdateQuery = '';
      if (status === 'تم التوصيل') {
        deliveryDateUpdateQuery = ', delivery_date = COALESCE(delivery_date, NOW())';
      }

      const [result] = await connection.query(`UPDATE orders SET status = ? ${deliveryDateUpdateQuery} WHERE id = ?`, [status, id]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Order not found' });
      }

      // If order is delivered, create an invoice
      if (status === 'تم التوصيل') {
        const [[order]] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
        
        // Check if an invoice for this order already exists
        const [[existingInvoice]] = await connection.query('SELECT id FROM invoices WHERE order_id = ?', [id]);

        if (!existingInvoice) {
            const newInvoice = {
                id: uuidv4(),
                invoice_number: `INV-${order.order_number}`,
                order_id: id,
                customer_id: order.customer_id,
                customer_name: order.customer_name,
                issue_date: order.delivery_date || new Date(),
                due_date: new Date(new Date(order.delivery_date || new Date()).setDate(new Date().getDate() + 15)), // Due in 15 days
                total_amount: order.total_amount,
                is_paid: false
            };
            await connection.query('INSERT INTO invoices SET ?', newInvoice);
        }
      }

      await connection.commit();
      res.json({ message: 'Order status updated successfully' });

    } catch (error) {
      await connection.rollback();
      console.error(`Failed to update order status for ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error updating order status' });
    } finally {
      connection.release();
    }
  });

// DELETE /api/orders/:id - Delete an order
router.delete('/:id', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    
    await connection.beginTransaction();
    
    // First, check if the order exists
    const [[order]] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Delete related invoice if exists
    await connection.query('DELETE FROM invoices WHERE order_id = ?', [id]);
    
    // Delete related order items
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Delete the order itself
    await connection.query('DELETE FROM orders WHERE id = ?', [id]);
    
    await connection.commit();
    res.status(204).send(); // No Content response for successful deletion
  } catch (error) {
    await connection.rollback();
    console.error(`Failed to delete order ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting order from database', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router; 