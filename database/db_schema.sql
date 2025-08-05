-- Pure Water Control System - MySQL Schema

-- Before running, create a database, e.g.: CREATE DATABASE pure_water_db;
-- Then select it: USE pure_water_db;

-- -----------------------------------------------------
-- Table `users`
-- Stores user accounts for authentication and authorization.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'pos_agent') NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- A simple way to handle phone numbers without a separate table for this schema
ALTER TABLE `users` ADD COLUMN `phone_numbers` JSON;

-- -----------------------------------------------------
-- Table `products`
-- Stores information about all available products.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `wholesale_price` DECIMAL(10, 2),
  `stock` INT NOT NULL DEFAULT 0,
  `description` TEXT,
  `image` VARCHAR(500), -- Path to product image file
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `customers`
-- Stores information about customers.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `address` TEXT,
  `customer_type` ENUM('مؤقت', 'رسمي', 'حكومي', 'تجاري', 'منزلي') NOT NULL,
  `temporary_expiry_date` DATE,
  `balance` DECIMAL(10, 2) DEFAULT 0.00,
  `owned_bottles` INT DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `drivers`
-- Stores information about delivery drivers.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `vehicle_number` VARCHAR(255),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `orders`
-- Main table for customer orders.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(255) NOT NULL,
  `order_number` VARCHAR(255) NOT NULL UNIQUE,
  `customer_id` VARCHAR(255),
  `customer_name` VARCHAR(255), -- Denormalized for retail/quick access
  `driver_id` VARCHAR(255),
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('قيد الانتظار', 'قيد التوصيل', 'تم التوصيل', 'ملغي') NOT NULL,
  `order_date` DATETIME NOT NULL,
  `delivery_date` DATETIME,
  `payment_method` ENUM('نقداً', 'بطاقة ائتمانية', 'دفع إلكتروني') NOT NULL,
  `sale_type` ENUM('جملة', 'تجزئة') NOT NULL,
  `delivery_address` TEXT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `order_items`
-- Stores individual items within an order.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT,
  `order_id` VARCHAR(255) NOT NULL,
  `product_id` VARCHAR(255) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL, -- Denormalized for easier reporting
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `sale_type` ENUM('جملة', 'تجزئة') NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `invoices`
-- Stores invoice information related to orders.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(255) NOT NULL,
  `invoice_number` VARCHAR(255) NOT NULL UNIQUE,
  `order_id` VARCHAR(255) NOT NULL,
  `customer_id` VARCHAR(255),
  `customer_name` VARCHAR(255) NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `is_paid` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Note on invoice items:
-- The `types.ts` has `items: OrderItem[]` in the `Invoice` interface.
-- To avoid data duplication, we can retrieve invoice items by joining
-- with `order_items` through the `order_id`. A separate `invoice_items`
-- table is omitted for simplicity unless specific invoice-only item
-- modifications are required.
-- -----------------------------------------------------

-- --- Indexes for performance ---
CREATE INDEX idx_orders_customer_id ON `orders`(`customer_id`);
CREATE INDEX idx_orders_driver_id ON `orders`(`driver_id`);
CREATE INDEX idx_orders_order_date ON `orders`(`order_date`);
CREATE INDEX idx_order_items_order_id ON `order_items`(`order_id`);
CREATE INDEX idx_order_items_product_id ON `order_items`(`product_id`);
CREATE INDEX idx_invoices_order_id ON `invoices`(`order_id`);
CREATE INDEX idx_invoices_customer_id ON `invoices`(`customer_id`); 