const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
  try {
    console.log('🔄 بدء تحديث قاعدة البيانات...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'pure_water_db'
    });

    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // التحقق من وجود العمود account_status
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'pure_water_db' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'account_status'
      `);

      if (columns.length === 0) {
        console.log('⚠️ العمود account_status غير موجود، جاري إضافته...');
        
        // إضافة العمود الجديد
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN account_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'
        `);
        console.log('✅ تم إضافة العمود account_status');

        // إضافة العمود created_at
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ تم إضافة العمود created_at');

        // إضافة العمود approved_by
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN approved_by VARCHAR(255) NULL
        `);
        console.log('✅ تم إضافة العمود approved_by');

        // إضافة العمود approved_at
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN approved_at DATETIME NULL
        `);
        console.log('✅ تم إضافة العمود approved_at');

        // تحديث المستخدمين الحاليين
        await connection.execute(`
          UPDATE users 
          SET account_status = 'approved', 
              approved_at = CURRENT_TIMESTAMP, 
              approved_by = 'system'
          WHERE account_status = 'pending'
        `);
        console.log('✅ تم تحديث المستخدمين الحاليين');

        // إضافة فهارس للأداء
        await connection.execute(`
          CREATE INDEX idx_users_account_status ON users(account_status)
        `);
        console.log('✅ تم إضافة فهرس account_status');

        await connection.execute(`
          CREATE INDEX idx_users_created_at ON users(created_at)
        `);
        console.log('✅ تم إضافة فهرس created_at');

      } else {
        console.log('✅ العمود account_status موجود بالفعل');
      }

      // إنشاء جدول تتبع محاولات تسجيل الدخول
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            attempt_type ENUM('success', 'failed_password', 'account_pending', 'account_rejected') NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_created_at (created_at),
            INDEX idx_attempt_type (attempt_type)
          ) ENGINE=InnoDB
        `);
        console.log('✅ تم إنشاء جدول تتبع محاولات تسجيل الدخول');
      } catch (error) {
        console.log('ℹ️ جدول تتبع محاولات تسجيل الدخول موجود بالفعل');
      }

      // إنشاء جدول العمليات الإدارية
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS admin_operations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id VARCHAR(255) NOT NULL,
            operation_type ENUM('edit_user', 'delete_user', 'reset_password', 'change_status', 'approve_user', 'reject_user') NOT NULL,
            description TEXT NOT NULL,
            target_user_id VARCHAR(255),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin_id (admin_id),
            INDEX idx_target_user_id (target_user_id),
            INDEX idx_created_at (created_at),
            INDEX idx_operation_type (operation_type)
          ) ENGINE=InnoDB
        `);
        console.log('✅ تم إنشاء جدول العمليات الإدارية');
      } catch (error) {
        console.log('ℹ️ جدول العمليات الإدارية موجود بالفعل');
      }

    } catch (error) {
      console.error('❌ خطأ في تحديث قاعدة البيانات:', error.message);
    }

    await connection.end();
    console.log('🎉 تم تحديث قاعدة البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    console.error('تأكد من:');
    console.error('1. تشغيل MySQL server');
    console.error('2. وجود قاعدة البيانات pure_water_db');
    console.error('3. صحة بيانات الاتصال');
    process.exit(1);
  }
}

updateDatabase(); 