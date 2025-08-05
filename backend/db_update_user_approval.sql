-- تحديث قاعدة البيانات لإضافة نظام الموافقة على الحسابات
-- تشغيل هذا الملف على قاعدة البيانات الحالية

-- إضافة الأعمدة الجديدة لجدول المستخدمين
ALTER TABLE `users` 
ADD COLUMN `account_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `approved_by` VARCHAR(255) NULL,
ADD COLUMN `approved_at` DATETIME NULL;

-- تحديث المستخدمين الحاليين إلى حالة 'approved'
UPDATE `users` 
SET 
  `account_status` = 'approved',
  `approved_at` = CURRENT_TIMESTAMP,
  `approved_by` = 'system'
WHERE `account_status` = 'pending';

-- إضافة فهرس للبحث السريع
CREATE INDEX idx_users_account_status ON `users`(`account_status`);
CREATE INDEX idx_users_created_at ON `users`(`created_at`); 