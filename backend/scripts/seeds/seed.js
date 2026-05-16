const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'your-db-password-here',
      database: 'music_edu'
    });

    // 1. 先检查是否已有用户
    const [existing] = await conn.execute('SELECT COUNT(*) as count FROM users');
    if (existing[0].count > 0) {
      console.log('⚠️ 数据库中已有用户，跳过创建');
      const [users] = await conn.execute('SELECT id, username, role, nickname FROM users');
      users.forEach(u => console.log(`  - [${u.role}] ${u.username} (${u.nickname})`));
      console.log('\n📋 课程数据将始终重新创建（幂等设计）');
    }

    const hash = await bcrypt.hash('admin123', 10);

    // ========== 创建用户 ==========
    if (existing[0].count === 0) {
      // 2. 创建超级管理员
      await conn.execute(
        'INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
        ['admin', hash, '超级管理员', 'super_admin']
      );
      console.log('✅ 创建管理员: admin / admin123');

      // 3. 创建教师账号
      await conn.execute(
        'INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
        ['teacher01', hash, '张老师', 'teacher']
      );
      const [rows] = await conn.execute('SELECT id FROM users WHERE username = ?', ['teacher01']);
      
      // 4. 创建教师详情
      await conn.execute(
        'INSERT INTO teachers (userId, realName, introduction, specialties, isVerified) VALUES (?, ?, ?, ?, 1)',
        [rows[0].id, '张明', '资深钢琴教师，10年教学经验', '钢琴,乐理,作曲']
      );
      console.log('✅ 创建教师: teacher01 / admin123 (已认证)');

      // 5. 创建审核员
      await conn.execute(
        'INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
        ['reviewer01', hash, '王审核', 'reviewer']
      );
      console.log('✅ 创建审核员: reviewer01 / admin123');

      // 6. 创建运营员
      await conn.execute(
        'INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
        ['operator01', hash, '李运营', 'operator']
      );
      console.log('✅ 创建运营员: operator01 / admin123');
    }

    // ========== 创建课程分类 ==========
    const [existingCategories] = await conn.execute('SELECT COUNT(*) as count FROM categories');
    if (existingCategories[0].count === 0) {
      await conn.execute('INSERT INTO categories (name, icon, sortOrder, isActive) VALUES (?, ?, ?, ?)', ['钢琴', 'piano', 1, true]);
      await conn.execute('INSERT INTO categories (name, icon, sortOrder, isActive) VALUES (?, ?, ?, ?)', ['吉他', 'guitar', 2, true]);
      await conn.execute('INSERT INTO categories (name, icon, sortOrder, isActive) VALUES (?, ?, ?, ?)', ['声乐', 'vocal', 3, true]);
      await conn.execute('INSERT INTO categories (name, icon, sortOrder, isActive) VALUES (?, ?, ?, ?)', ['乐理', 'theory', 4, true]);
      await conn.execute('INSERT INTO categories (name, icon, sortOrder, isActive) VALUES (?, ?, ?, ?)', ['古筝', 'guzheng', 5, true]);
      await conn.execute('INSERT INTO categories (name, icon, sortOrder, isActive) VALUES (?, ?, ?, ?)', ['二胡', 'erhu', 6, true]);
      console.log('✅ 已创建 6 个课程分类');
    } else {
      console.log('⚠️ 分类数据已存在，跳过创建');
    }

    // ========== 创建示例课程 ==========
    const [teacherRow] = await conn.execute('SELECT id FROM users WHERE username = ?', ['teacher01']);
    const teacherUserId = teacherRow[0].id;
    const [teacherDetail] = await conn.execute('SELECT id FROM teachers WHERE userId = ?', [teacherUserId]);
    const teacherId = teacherDetail[0].id;
    const [pianoCategory] = await conn.execute('SELECT id FROM categories WHERE name = ?', ['钢琴']);
    const [guitarCategory] = await conn.execute('SELECT id FROM categories WHERE name = ?', ['吉他']);
    const [theoryCategory] = await conn.execute('SELECT id FROM categories WHERE name = ?', ['乐理']);

    const [existingCourses] = await conn.execute('SELECT COUNT(*) as count FROM courses');
    if (existingCourses[0].count === 0) {
      console.log('\n✨ 三门 Demo 课程已在前端清理，如需重建注释恢复');
    } else {
      console.log('⚠️ 课程数据已存在，跳过创建');
    }

    // ========== 创建测试用的购买记录 ==========
    // 让 teacher01 用户购买钢琴课程（演示已购课可播放整课）
    const [teacherUser] = await conn.execute('SELECT id FROM users WHERE username = ?', ['teacher01']);
    const teacherUserIdForPurchase = teacherUser[0].id;
    const [anyCourse] = await conn.execute('SELECT id FROM courses LIMIT 1');
    if (anyCourse.length > 0) {
      const [existingPurchase] = await conn.execute(
        'SELECT COUNT(*) as count FROM user_courses WHERE userId = ? AND courseId = ?',
        [teacherUserIdForPurchase, anyCourse[0].id]
      );
      if (existingPurchase[0].count === 0) {
        await conn.execute(
          'INSERT INTO user_courses (userId, courseId, price, createdAt, updatedAt) VALUES (?, ?, 0, NOW(), NOW())',
          [teacherUserIdForPurchase, anyCourse[0].id]
        );
        console.log('✅ 已创建测试购买记录: teacher01 购买了课程ID=' + anyCourse[0].id);
      }
    }

    // ========== 最终提示 ==========
    console.log('\n📋 所有账号密码均为: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('管理员  → admin');
    console.log('教师    → teacher01');
    console.log('审核员  → reviewer01');
    console.log('运营员  → operator01');
    console.log('学生    → 自行注册即可');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━');

    await conn.end();
  } catch (err) {
    console.error('❌ 创建失败:', err.message);
  }
}

seed();
