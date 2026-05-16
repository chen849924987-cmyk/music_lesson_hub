const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAccounts() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'your-db-password-here',
      database: 'music_edu'
    });

    const hash = await bcrypt.hash('admin123', 10);

    // 使用 INSERT IGNORE 避免重复报错
    await conn.execute('INSERT IGNORE INTO users (username,password,nickname,role) VALUES (?,?,?,?)', 
      ['admin', hash, '超级管理员', 'super_admin']);
    console.log('✅ 管理员账号: admin / admin123');

    await conn.execute('INSERT IGNORE INTO users (username,password,nickname,role) VALUES (?,?,?,?)', 
      ['teacher01', hash, '张老师', 'teacher']);
    console.log('✅ 教师账号: teacher01 / admin123');

    await conn.execute('INSERT IGNORE INTO users (username,password,nickname,role) VALUES (?,?,?,?)', 
      ['reviewer01', hash, '王审核', 'reviewer']);
    console.log('✅ 审核员账号: reviewer01 / admin123');

    await conn.execute('INSERT IGNORE INTO users (username,password,nickname,role) VALUES (?,?,?,?)', 
      ['operator01', hash, '李运营', 'operator']);
    console.log('✅ 运营员账号: operator01 / admin123');

    await conn.execute('INSERT IGNORE INTO users (username,password,nickname,role) VALUES (?,?,?,?)', 
      ['student', hash, '测试学生', 'student']);
    console.log('✅ 学生账号: student / admin123');

    // 创建教师详情（如果不存在）
    const [rows] = await conn.execute('SELECT id FROM users WHERE username = ?', ['teacher01']);
    if (rows.length > 0) {
      await conn.execute(
        'INSERT IGNORE INTO teachers (userId,realName,introduction,specialties,isVerified) VALUES (?,?,?,?,1)',
        [rows[0].id, '张明', '资深钢琴教师，10年教学经验', '钢琴,乐理,作曲']
      );
      console.log('✅ 教师认证信息已创建');
    }

    console.log('\n═══════════════════════════════════');
    console.log('  所有账号密码: admin123');
    console.log('═══════════════════════════════════');
    console.log('  🛡️ 管理员 → admin');
    console.log('  👨‍🏫 教师   → teacher01');
    console.log('  🔍 审核员 → reviewer01');
    console.log('  ⚙️ 运营员 → operator01');
    console.log('  🎓 学生   → student');
    console.log('═══════════════════════════════════');

    await conn.end();
  } catch (err) {
    console.error('❌ 失败:', err.message);
  }
}

createAccounts();
