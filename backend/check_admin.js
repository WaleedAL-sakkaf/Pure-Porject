const db = require('./db');

async function checkAdmin() {
  try {
    console.log('🔍 فحص حالة المدراء في النظام...\n');
    
    // Check total users
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 إجمالي المستخدمين: ${totalUsers[0].count}`);
    
    // Check admins
    const [admins] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    console.log(`👑 عدد المدراء: ${admins[0].count}`);
    
    // Check approved admins
    const [approvedAdmins] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ? AND account_status = ?', ['admin', 'approved']);
    console.log(`✅ المدراء المفعلون: ${approvedAdmins[0].count}`);
    
    // Check pending users
    const [pendingUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE account_status = ?', ['pending']);
    console.log(`⏳ المستخدمون المعلقون: ${pendingUsers[0].count}`);
    
    console.log('\n' + '='.repeat(50));
    
    if (totalUsers[0].count === 0) {
      console.log('📋 الحالة: لا يوجد مستخدمون في النظام');
      console.log('💡 الحل: المستخدم الأول الذي يسجل سيصبح مدير تلقائياً');
    } else if (admins[0].count === 0) {
      console.log('⚠️  الحالة: لا يوجد مدير في النظام');
      console.log('💡 الحل: استخدم السكريبت التالي لإنشاء مدير:');
      console.log('   cd backend && node create_admin.js');
    } else if (approvedAdmins[0].count === 0) {
      console.log('⚠️  الحالة: يوجد مدير لكنه غير مفعل');
      console.log('💡 الحل: قم بتفعيل المدير من قاعدة البيانات أو أنشئ مدير جديد');
    } else {
      console.log('✅ الحالة: يوجد مدير مفعل في النظام');
      
      // Show admin details
      const [adminDetails] = await db.query(
        'SELECT username, company_name, created_at FROM users WHERE role = ? AND account_status = ? ORDER BY created_at ASC LIMIT 1',
        ['admin', 'approved']
      );
      
      if (adminDetails.length > 0) {
        const admin = adminDetails[0];
        console.log('\n👑 بيانات المدير الأول:');
        console.log(`   - اسم المستخدم: ${admin.username}`);
        console.log(`   - الشركة: ${admin.company_name}`);
        console.log(`   - تاريخ الإنشاء: ${new Date(admin.created_at).toLocaleDateString('ar-SA')}`);
      }
    }
    
    if (pendingUsers[0].count > 0) {
      console.log(`\n⏳ تحتاج إلى مراجعة ${pendingUsers[0].count} مستخدم معلق`);
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('❌ خطأ في التحقق:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await db.end();
  }
}

checkAdmin(); 