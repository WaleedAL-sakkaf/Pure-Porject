const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// إعداد multer لرفع ملفات النسخ الاحتياطي
const upload = multer({
  dest: path.join(__dirname, '../temp/'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/sql' || file.originalname.endsWith('.sql')) {
      cb(null, true);
    } else {
      cb(new Error('يجب أن يكون الملف بصيغة .sql'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB حد أقصى
  }
});

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pure_water_db',
  port: process.env.DB_PORT || 3306
};

// التأكد من وجود مجلد المؤقت
const ensureTempDir = async () => {
  const tempDir = path.join(__dirname, '../temp');
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
  return tempDir;
};

// حل بديل للنسخ الاحتياطي عندما لا يكون mysqldump متاحاً
const createBackupAlternative = async (backupPath, res, backupFileName) => {
  const db = require('../db');
  let sqlContent = `-- نسخة احتياطية لقاعدة البيانات ${dbConfig.database}\n`;
  sqlContent += `-- تاريخ الإنشاء: ${new Date().toISOString()}\n\n`;
  
  try {
    // الحصول على قائمة الجداول
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    for (const tableName of tableNames) {
      console.log(`📊 نسخ جدول: ${tableName}`);
      
      // الحصول على هيكل الجدول
      const [createTable] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlContent += `\n-- هيكل جدول ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += createTable[0]['Create Table'] + ';\n\n';
      
      // الحصول على البيانات
      const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        sqlContent += `-- بيانات جدول ${tableName}\n`;
        
        for (const row of rows) {
          const values = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return value;
          }).join(', ');
          
          sqlContent += `INSERT INTO \`${tableName}\` VALUES (${values});\n`;
        }
        sqlContent += '\n';
      }
    }
    
    // كتابة الملف
    await fs.writeFile(backupPath, sqlContent, 'utf8');
    
    console.log(`✅ تم إنشاء النسخة الاحتياطية البديلة: ${backupFileName}`);
    
    // إرسال الملف
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
    
    res.download(backupPath, backupFileName, async (err) => {
      if (err) {
        console.error('❌ خطأ في إرسال الملف:', err);
      }
      
      // حذف الملف المؤقت
      try {
        await fs.unlink(backupPath);
        console.log('🗑️ تم حذف الملف المؤقت');
      } catch (unlinkError) {
        console.error('⚠️ خطأ في حذف الملف المؤقت:', unlinkError);
      }
    });
    
  } catch (error) {
    console.error('❌ خطأ في النسخ الاحتياطي البديل:', error);
    throw error;
  }
};

// حل بديل للاستعادة عندما لا يكون mysql command متاحاً
const restoreAlternative = async (backupFilePath, res) => {
  const db = require('../db');
  
  try {
    // قراءة محتوى ملف SQL
    const sqlContent = await fs.readFile(backupFilePath, 'utf8');
    
    // تنظيف وتقسيم الاستعلامات
    const statements = sqlContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .filter(statement => statement.trim());

    console.log(`📊 جاري تنفيذ ${statements.length} استعلام...`);

    // تنفيذ كل استعلام
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`⚙️ تنفيذ استعلام ${i + 1}/${statements.length}`);
          await db.query(statement);
        } catch (queryError) {
          // تجاهل بعض الأخطاء المتوقعة
          if (!queryError.message.includes('already exists') && 
              !queryError.message.includes("doesn't exist")) {
            console.error(`❌ خطأ في الاستعلام ${i + 1}:`, queryError.message);
            console.error('الاستعلام:', statement.substring(0, 100) + '...');
            // لا نوقف العملية، نكمل مع باقي الاستعلامات
          }
        }
      }
    }

    // حذف الملف المؤقت
    try {
      await fs.unlink(backupFilePath);
      console.log('🗑️ تم حذف الملف المؤقت');
    } catch (unlinkError) {
      console.error('⚠️ خطأ في حذف الملف المؤقت:', unlinkError);
    }

    console.log('✅ تم استعادة قاعدة البيانات بنجاح (الطريقة البديلة)');
    res.json({
      success: true,
      message: 'تم استعادة قاعدة البيانات بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في الاستعادة البديلة:', error);
    
    // حذف الملف المؤقت في حالة الخطأ
    try {
      await fs.unlink(backupFilePath);
    } catch (unlinkError) {
      console.error('⚠️ خطأ في حذف الملف المؤقت:', unlinkError);
    }
    
    throw error;
  }
};

// إنشاء نسخة احتياطية من قاعدة البيانات
router.post('/create', async (req, res) => {
  try {
    console.log('🔄 بدء إنشاء النسخة الاحتياطية...');
    
    const tempDir = await ensureTempDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${dbConfig.database}_${timestamp}.sql`;
    const backupPath = path.join(tempDir, backupFileName);

    // التحقق من وجود mysqldump أولاً
    exec('mysqldump --version', async (error) => {
      if (error) {
        console.error('❌ mysqldump غير متاح، جاري استخدام الطريقة البديلة...');
        
        try {
          // استخدام الطريقة البديلة عبر Node.js
          await createBackupAlternative(backupPath, res, backupFileName);
          return;
        } catch (altError) {
          console.error('❌ فشل الحل البديل:', altError);
          return res.status(500).json({
            success: false,
            message: 'mysqldump غير متاح والحل البديل فشل. تأكد من تثبيت MySQL بشكل كامل',
            error: altError.message
          });
        }
      }

      // إنشاء أمر mysqldump
      const mysqldumpCmd = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} --routines --triggers --single-transaction --lock-tables=false`;

      console.log('⚙️ تنفيذ أمر النسخ الاحتياطي...');
      console.log('🔧 أمر mysqldump:', mysqldumpCmd.replace(/-p\S+/, '-p***')); // إخفاء كلمة المرور

    exec(`${mysqldumpCmd} > "${backupPath}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
        console.error('❌ stderr:', stderr);
        
        // حذف الملف المؤقت في حالة الخطأ
        try {
          await fs.unlink(backupPath);
        } catch (unlinkError) {
          console.error('⚠️ خطأ في حذف الملف المؤقت:', unlinkError);
        }
        
        let errorMessage = 'فشل في إنشاء النسخة الاحتياطية';
        if (error.message.includes('mysqldump')) {
          errorMessage = 'تأكد من تثبيت MySQL وتشغيل الخادم';
        } else if (error.message.includes('Access denied')) {
          errorMessage = 'خطأ في بيانات الاتصال بقاعدة البيانات';
        }
        
        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: error.message
        });
      }
      
      if (stderr && stderr.trim()) {
        console.warn('⚠️ تحذير من mysqldump:', stderr);
      }

      try {
        // التحقق من وجود الملف وحجمه
        const stats = await fs.stat(backupPath);
        if (stats.size === 0) {
          throw new Error('ملف النسخة الاحتياطية فارغ');
        }

        console.log(`✅ تم إنشاء النسخة الاحتياطية بنجاح: ${backupFileName} (${Math.round(stats.size / 1024)} KB)`);

        // إرسال الملف للتحميل
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
        
        res.download(backupPath, backupFileName, async (err) => {
          if (err) {
            console.error('❌ خطأ في إرسال الملف:', err);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: 'خطأ في إرسال الملف',
                error: err.message
              });
            }
          }
          
          // حذف الملف المؤقت بعد التحميل
          try {
            await fs.unlink(backupPath);
            console.log('🗑️ تم حذف الملف المؤقت');
          } catch (unlinkError) {
            console.error('⚠️ خطأ في حذف الملف المؤقت:', unlinkError);
          }
        });

      } catch (statError) {
        console.error('❌ خطأ في فحص الملف:', statError);
        res.status(500).json({
          success: false,
          message: 'خطأ في إنشاء ملف النسخة الاحتياطية',
          error: statError.message
        });
      }
    });
    });

  } catch (error) {
    console.error('❌ خطأ عام في النسخ الاحتياطي:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في النسخ الاحتياطي',
      error: error.message
    });
  }
});

// استعادة قاعدة البيانات من نسخة احتياطية
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  try {
    console.log('🔄 بدء استعادة قاعدة البيانات...');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع ملف النسخة الاحتياطية'
      });
    }

    const backupFilePath = req.file.path;
    console.log(`📁 ملف النسخة الاحتياطية: ${req.file.originalname}`);

    // التحقق من صحة الملف
    try {
      const fileContent = await fs.readFile(backupFilePath, 'utf8');
      if (!fileContent.includes('CREATE TABLE') && !fileContent.includes('INSERT INTO')) {
        throw new Error('ملف النسخة الاحتياطية غير صالح');
      }
    } catch (readError) {
      await fs.unlink(backupFilePath);
      return res.status(400).json({
        success: false,
        message: 'ملف النسخة الاحتياطية تالف أو غير صالح'
      });
    }

    // التحقق من وجود mysql command أولاً
    exec('mysql --version', async (mysqlError) => {
      if (mysqlError) {
        console.log('❌ mysql command غير متاح، جاري استخدام الطريقة البديلة...');
        
        try {
          await restoreAlternative(backupFilePath, res);
          return;
        } catch (altError) {
          console.error('❌ فشل الحل البديل للاستعادة:', altError);
          return res.status(500).json({
            success: false,
            message: 'mysql command غير متاح والحل البديل فشل',
            error: altError.message
          });
        }
      }

      // إنشاء أمر mysql للاستعادة
      const mysqlCmd = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database}`;

      console.log('⚙️ تنفيذ أمر الاستعادة...');

      exec(`${mysqlCmd} < "${backupFilePath}"`, async (error, stdout, stderr) => {
        // حذف الملف المؤقت
        try {
          await fs.unlink(backupFilePath);
          console.log('🗑️ تم حذف الملف المؤقت');
        } catch (unlinkError) {
          console.error('⚠️ خطأ في حذف الملف المؤقت:', unlinkError);
        }

        if (error) {
          console.error('❌ خطأ في استعادة قاعدة البيانات:', error);
          return res.status(500).json({
            success: false,
            message: 'فشل في استعادة قاعدة البيانات',
            error: error.message
          });
        }

        console.log('✅ تم استعادة قاعدة البيانات بنجاح');
        res.json({
          success: true,
          message: 'تم استعادة قاعدة البيانات بنجاح'
        });
      });
    });

  } catch (error) {
    // حذف الملف في حالة الخطأ
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('⚠️ خطأ في حذف الملف:', unlinkError);
      }
    }

    console.error('❌ خطأ عام في الاستعادة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في استعادة قاعدة البيانات',
      error: error.message
    });
  }
});

// الحصول على معلومات النسخ الاحتياطي
router.get('/info', async (req, res) => {
  try {
    const db = require('../db');
    
    // معلومات قاعدة البيانات
    const [tables] = await db.query(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);

    const totalRows = tables.reduce((sum, table) => sum + (table.TABLE_ROWS || 0), 0);
    const totalSize = tables.reduce((sum, table) => sum + (table.DATA_LENGTH || 0) + (table.INDEX_LENGTH || 0), 0);

    res.json({
      success: true,
      info: {
        database: dbConfig.database,
        host: dbConfig.host,
        tablesCount: tables.length,
        totalRows: totalRows,
        totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
        tables: tables.map(table => ({
          name: table.TABLE_NAME,
          rows: table.TABLE_ROWS || 0,
          size: Math.round(((table.DATA_LENGTH || 0) + (table.INDEX_LENGTH || 0)) / 1024 * 100) / 100 // KB
        }))
      }
    });

  } catch (error) {
    console.error('❌ خطأ في الحصول على معلومات قاعدة البيانات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الحصول على معلومات قاعدة البيانات',
      error: error.message
    });
  }
});

module.exports = router; 