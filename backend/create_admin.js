const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

async function createInitialAdmin() {
  try {
    console.log('🔍 فحص وجود مدير في النظام...');
    
    // Check if any admin exists
    const [admins] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    
    if (admins[0].count > 0) {
      console.log('✅ يوجد مدير في النظام بالفعل');
      console.log(`📊 عدد المدراء: ${admins[0].count}`);
      process.exit(0);
    }
    
    console.log('⚠️  لا يوجد مدير في النظام');
    console.log('🚀 بدء إنشاء حساب مدير أولي...');
    
    // Default admin credentials
    const adminData = {
      username: 'admin',
      password: 'admin123',
      companyName: 'الإدارة العامة',
      phoneNumbers: ['00000000000']
    };
    
    console.log('📝 بيانات المدير الافتراضية:');
    console.log(`   - اسم المستخدم: ${adminData.username}`);
    console.log(`   - كلمة المرور: ${adminData.password}`);
    console.log(`   - الشركة: ${adminData.companyName}`);
    console.log(`   - رقم الهاتف: ${adminData.phoneNumbers[0]}`);
    
    // Generate UUID and hash password
    const userId = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminData.password, salt);
    const phoneNumbersJson = JSON.stringify(adminData.phoneNumbers);
    
    console.log('🔐 تشفير كلمة المرور...');
    
    // Insert admin user
    await db.query(
      'INSERT INTO users (id, username, password_hash, role, company_name, phone_numbers, account_status, created_at, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())',
      [userId, adminData.username, passwordHash, 'admin', adminData.companyName, phoneNumbersJson, 'approved', 'system']
    );
    
    console.log('✅ تم إنشاء حساب المدير بنجاح!');
    
    // Log the operation
    try {
      await db.query(
        'INSERT INTO admin_operations (admin_id, operation_type, description, target_user_id) VALUES (?, ?, ?, ?)',
        ['system', 'approve_user', `إنشاء مدير النظام الأولي: ${adminData.username}`, userId]
      );
      console.log('📝 تم تسجيل العملية في سجل الإدارة');
    } catch (logError) {
      console.log('⚠️  تعذر تسجيل العملية (الجدول غير موجود)');
    }
    
    console.log('\n🎉 تم إنشاء المدير الأولي بنجاح!');
    console.log('🔗 يمكنك الآن تسجيل الدخول بالبيانات التالية:');
    console.log(`   📧 اسم المستخدم: ${adminData.username}`);
    console.log(`   🔑 كلمة المرور: ${adminData.password}`);
    console.log('\n⚠️  تأكد من تغيير كلمة المرور بعد أول تسجيل دخول!');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المدير:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await db.end();
  }
}

// التحقق من وجود معاملات سطر الأوامر لبيانات مخصصة
if (process.argv.length > 2) {
  console.log('\n📋 استخدام بيانات مخصصة:');
  console.log('node create_admin.js [اسم_المستخدم] [كلمة_المرور] [اسم_الشركة] [رقم_الهاتف]');
  console.log('\nأو اتركها فارغة لاستخدام البيانات الافتراضية');
}

createInitialAdmin(); 