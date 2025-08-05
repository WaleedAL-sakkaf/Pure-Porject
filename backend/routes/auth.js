const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { validateUserData } = require('../utils/validation');

// Function to log login attempts
const logLoginAttempt = async (username, ip, userAgent, attemptType) => {
  try {
    // Check if login_attempts table exists
    await db.query('SELECT 1 FROM login_attempts LIMIT 1');
    
    // If we reach here, table exists, so insert the record
    await db.query(
      'INSERT INTO login_attempts (username, ip_address, user_agent, attempt_type) VALUES (?, ?, ?, ?)',
      [username, ip || 'unknown', userAgent || 'unknown', attemptType]
    );
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      // Table doesn't exist, silently skip logging
      return;
    }
    console.error('Error logging login attempt:', error);
  }
};

// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { username, password, companyName, phoneNumbers, role } = req.body;
    
    // Validate user data
    const validationError = validateUserData(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Check if username already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate UUID for user
    const userId = uuidv4();

    // Store phone numbers as JSON
    const phoneNumbersJson = JSON.stringify(phoneNumbers);

    // Check if this is the first user in the system
    const [userCountResult] = await db.query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = userCountResult[0].count === 0;

    // If this is the first user, make them admin and approved automatically
    const finalRole = isFirstUser ? 'admin' : role;
    const accountStatus = isFirstUser ? 'approved' : 'pending';
    const approvedBy = isFirstUser ? 'system' : null;

    // Insert user into database
    await db.query(
      'INSERT INTO users (id, username, password_hash, role, company_name, phone_numbers, account_status, created_at, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)',
      [userId, username, passwordHash, finalRole, companyName, phoneNumbersJson, accountStatus, approvedBy, isFirstUser ? new Date() : null]
    );

    // Log the creation if it's the first user (admin)
    if (isFirstUser) {
      await logAdminOperation('system', 'approve_user', `إنشاء مدير النظام الرئيسي: ${username}`, userId);
    }

    // Return success without password hash
    const successMessage = isFirstUser 
      ? '🎉 مرحباً بك! تم إنشاء حسابك كمدير النظام الرئيسي بنجاح!\n\n🔐 يمكنك الآن تسجيل الدخول والتحكم في جميع وظائف النظام\n\n👑 أنت الآن مدير النظام ويمكنك إدارة جميع المستخدمين الآخرين'
      : '🎉 تم إنشاء الطلب بنجاح! ⏳ حسابك الآن في انتظار مراجعة المدير\n\n📋 تفاصيل الطلب:\n- اسم المستخدم: ' + username + '\n- الشركة: ' + companyName + '\n- تاريخ الطلب: ' + new Date().toLocaleDateString('ar-SA') + '\n\n🔔 سيتم إشعارك فور الموافقة على حسابك\n\nيرجى الانتظار وعدم إنشاء حساب آخر';

    res.status(201).json({ 
      message: successMessage,
      user: {
        id: userId,
        username,
        role: finalRole,
        companyName,
        phoneNumbers,
        accountStatus: accountStatus
      },
      isFirstUser: isFirstUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Find user by username
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      await logLoginAttempt(username, clientIp, userAgent, 'failed_password');
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await logLoginAttempt(username, clientIp, userAgent, 'failed_password');
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Check account status
    if (user.account_status === 'pending') {
      await logLoginAttempt(username, clientIp, userAgent, 'account_pending');
      return res.status(403).json({ 
        message: '⏳ حسابك قيد المراجعة من قبل المدير\n\n📋 تفاصيل الحساب:\n- اسم المستخدم: ' + user.username + '\n- الشركة: ' + user.company_name + '\n- تاريخ الطلب: ' + new Date(user.created_at).toLocaleDateString('ar-SA') + '\n\n🔔 سيتم إشعارك فور الموافقة على حسابك\n\nيرجى الانتظار وعدم إنشاء حساب آخر',
        accountStatus: 'pending',
        accountDetails: {
          username: user.username,
          companyName: user.company_name,
          createdAt: user.created_at
        }
      });
    }

    if (user.account_status === 'rejected') {
      await logLoginAttempt(username, clientIp, userAgent, 'account_rejected');
      return res.status(403).json({ 
        message: '❌ تم رفض طلب حسابك من قبل المدير\n\n📋 تفاصيل الحساب:\n- اسم المستخدم: ' + user.username + '\n- الشركة: ' + user.company_name + '\n- تاريخ الرفض: ' + (user.approved_at ? new Date(user.approved_at).toLocaleDateString('ar-SA') : 'غير محدد') + '\n\n📞 للاستفسار، يرجى التواصل مع إدارة النظام',
        accountStatus: 'rejected',
        accountDetails: {
          username: user.username,
          companyName: user.company_name,
          rejectedAt: user.approved_at
        }
      });
    }

    // Parse phone numbers from JSON
    const phoneNumbers = JSON.parse(user.phone_numbers || '[]');

    // Log successful login
    await logLoginAttempt(username, clientIp, userAgent, 'success');

    // Return user without password hash
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      companyName: user.company_name,
      phoneNumbers,
      accountStatus: user.account_status,
      createdAt: user.created_at,
      approvedBy: user.approved_by,
      approvedAt: user.approved_at
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyName, phoneNumbers } = req.body;

    // Validate update data
    if (!companyName && !phoneNumbers) {
      return res.status(400).json({ message: 'لم يتم تقديم بيانات للتحديث' });
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // Update user data
    const updates = [];
    const values = [];

    if (companyName) {
      updates.push('company_name = ?');
      values.push(companyName);
    }

    if (phoneNumbers) {
      updates.push('phone_numbers = ?');
      values.push(JSON.stringify(phoneNumbers));
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user
    const [updatedUsers] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (updatedUsers.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const updatedUser = updatedUsers[0];
    const parsedPhoneNumbers = JSON.parse(updatedUser.phone_numbers || '[]');

    // Return updated user without password hash
    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      companyName: updatedUser.company_name,
      phoneNumbers: parsedPhoneNumbers
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث الملف الشخصي' });
  }
});

// Get pending users (Admin only)
router.get('/pending-users', async (req, res) => {
  try {
    const [pendingUsers] = await db.query(
      'SELECT id, username, role, company_name, phone_numbers, created_at FROM users WHERE account_status = ? ORDER BY created_at DESC',
      ['pending']
    );

    const usersWithPhoneNumbers = pendingUsers.map(user => ({
      ...user,
      phoneNumbers: JSON.parse(user.phone_numbers || '[]')
    }));

    res.json(usersWithPhoneNumbers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الحسابات المعلقة' });
  }
});

// Approve user (Admin only)
router.post('/approve-user', async (req, res) => {
  try {
    const { userId, adminId } = req.body;

    if (!userId || !adminId) {
      return res.status(400).json({ message: 'معرف المستخدم ومعرف المدير مطلوبان' });
    }

    // Get user info
    const [users] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    const username = users[0]?.username || 'غير معروف';

    // Update user status to approved
    await db.query(
      'UPDATE users SET account_status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['approved', adminId, userId]
    );

    // Log the operation
    await logAdminOperation(adminId, 'approve_user', `الموافقة على المستخدم: ${username}`, userId);

    res.json({ message: 'تم الموافقة على الحساب بنجاح' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء الموافقة على الحساب' });
  }
});

// Reject user (Admin only)
router.post('/reject-user', async (req, res) => {
  try {
    const { userId, adminId } = req.body;

    if (!userId || !adminId) {
      return res.status(400).json({ message: 'معرف المستخدم ومعرف المدير مطلوبان' });
    }

    // Get user info
    const [users] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    const username = users[0]?.username || 'غير معروف';

    // Update user status to rejected
    await db.query(
      'UPDATE users SET account_status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['rejected', adminId, userId]
    );

    // Log the operation
    await logAdminOperation(adminId, 'reject_user', `رفض المستخدم: ${username}`, userId);

    res.json({ message: 'تم رفض الحساب بنجاح' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء رفض الحساب' });
  }
});

// Get account approval statistics
router.get('/approval-stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        account_status,
        COUNT(*) as count
      FROM users 
      GROUP BY account_status
    `);

    const statsObject = stats.reduce((acc, stat) => {
      acc[stat.account_status] = stat.count;
      return acc;
    }, {});

    res.json({
      pending: statsObject.pending || 0,
      approved: statsObject.approved || 0,
      rejected: statsObject.rejected || 0,
      total: stats.reduce((sum, stat) => sum + stat.count, 0)
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب إحصائيات الموافقة' });
  }
});

// Get all users (Admin only)
router.get('/all-users', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Check if login_attempts table exists
    let hasLoginAttemptsTable = false;
    try {
      await db.query('SELECT 1 FROM login_attempts LIMIT 1');
      hasLoginAttemptsTable = true;
    } catch (err) {
      // Table doesn't exist, continue without login attempts data
    }

    let query, params = [];

    if (hasLoginAttemptsTable) {
      query = `
        SELECT 
          u.id, u.username, u.role, u.company_name, u.phone_numbers, 
          u.account_status, u.created_at, u.approved_by, u.approved_at,
          la.created_at as last_login_attempt,
          la.attempt_type as last_attempt_type,
          la.ip_address as last_ip
        FROM users u
        LEFT JOIN (
          SELECT username, created_at, attempt_type, ip_address,
                 ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at DESC) as rn
          FROM login_attempts
        ) la ON u.username = la.username AND la.rn = 1
        WHERE 1=1
      `;
    } else {
      query = `
        SELECT 
          id, username, role, company_name, phone_numbers, 
          account_status, created_at, approved_by, approved_at
        FROM users 
        WHERE 1=1
      `;
    }

    if (status && status !== 'all') {
      query += hasLoginAttemptsTable ? ` AND u.account_status = ?` : ` AND account_status = ?`;
      params.push(status);
    }

    if (search) {
      query += hasLoginAttemptsTable 
        ? ` AND (u.username LIKE ? OR u.company_name LIKE ?)`
        : ` AND (username LIKE ? OR company_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += hasLoginAttemptsTable ? ` ORDER BY u.created_at DESC` : ` ORDER BY created_at DESC`;

    const [users] = await db.query(query, params);

    const usersWithPhoneNumbers = users.map(user => ({
      ...user,
      phoneNumbers: JSON.parse(user.phone_numbers || '[]')
    }));

    res.json(usersWithPhoneNumbers);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب قائمة المستخدمين' });
  }
});

// Edit user (Admin only)
router.put('/edit-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, companyName, phoneNumbers, role } = req.body;
    
    // Check if username already exists for other users
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
    }
    
    // Update user
    await db.query(
      'UPDATE users SET username = ?, company_name = ?, phone_numbers = ?, role = ? WHERE id = ?',
      [username, companyName, JSON.stringify(phoneNumbers), role, userId]
    );
    
    // Log the operation
    await logAdminOperation(req.user?.id || 'admin', 'edit_user', `تعديل المستخدم: ${username}`, userId);
    
    res.json({ message: 'تم تحديث بيانات المستخدم بنجاح' });
  } catch (error) {
    console.error('Error editing user:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث بيانات المستخدم' });
  }
});

// Delete user (Admin only)
router.delete('/delete-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user info before deletion
    const [users] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    const username = users[0]?.username || 'غير معروف';
    
    // Delete user
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    // Log the operation
    await logAdminOperation(req.user?.id || 'admin', 'delete_user', `حذف المستخدم: ${username}`, userId);
    
    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المستخدم' });
  }
});

// Reset user password (Admin only)
router.post('/reset-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    // Get user info
    const [users] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    const username = users[0]?.username || 'غير معروف';
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
    
    // Log the operation
    await logAdminOperation(req.user?.id || 'admin', 'reset_password', `إعادة تعيين كلمة مرور: ${username}`, userId);
    
    res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' });
  }
});

// Change user status (Admin only)
router.post('/change-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    // Get user info
    const [users] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
    const username = users[0]?.username || 'غير معروف';
    
    // Update status
    await db.query(
      'UPDATE users SET account_status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      [status, req.user?.id || 'admin', userId]
    );
    
    // Log the operation
    await logAdminOperation(req.user?.id || 'admin', 'change_status', `تغيير حالة المستخدم ${username} إلى: ${status}`, userId);
    
    res.json({ message: 'تم تغيير حالة المستخدم بنجاح' });
  } catch (error) {
    console.error('Error changing user status:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تغيير حالة المستخدم' });
  }
});

// Get user activity logs (Admin only)
router.get('/user-activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get login attempts
    const [loginAttempts] = await db.query(`
      SELECT attempt_type, ip_address, created_at, user_agent
      FROM login_attempts la
      JOIN users u ON la.username = u.username
      WHERE u.id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);
    
    // Get admin operations on this user
    const [adminOps] = await db.query(`
      SELECT operation_type, description, created_at, admin_id
      FROM admin_operations
      WHERE target_user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);
    
    res.json({
      loginAttempts: loginAttempts || [],
      adminOperations: adminOps || []
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب سجل النشاطات' });
  }
});

// Get all admin operations (Admin only)
router.get('/admin-operations', async (req, res) => {
  try {
    const [operations] = await db.query(`
      SELECT ao.*, u.username as admin_username, tu.username as target_username
      FROM admin_operations ao
      LEFT JOIN users u ON ao.admin_id = u.id
      LEFT JOIN users tu ON ao.target_user_id = tu.id
      ORDER BY ao.created_at DESC
      LIMIT 100
    `);
    
    res.json(operations || []);
  } catch (error) {
    console.error('Error fetching admin operations:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب سجل العمليات الإدارية' });
  }
});

// Function to log admin operations
const logAdminOperation = async (adminId, operationType, description, targetUserId = null) => {
  try {
    // Check if admin_operations table exists
    await db.query('SELECT 1 FROM admin_operations LIMIT 1');
    
    await db.query(
      'INSERT INTO admin_operations (admin_id, operation_type, description, target_user_id) VALUES (?, ?, ?, ?)',
      [adminId, operationType, description, targetUserId]
    );
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      // Table doesn't exist, silently skip logging
      return;
    }
    console.error('Error logging admin operation:', error);
  }
};

module.exports = router; 