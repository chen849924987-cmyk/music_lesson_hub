/**
 * 数据库数据检查脚本
 * 功能描述：查看数据库中所有表的数据概况，帮助区分种子数据和测试数据
 * 
 * 运行方式：node scripts/check-data.js
 */
const mysql = require('mysql2/promise');

async function checkData() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your-db-password-here',
    database: 'music_edu'
  });

  try {
    console.log('========== 数据库数据检查 ==========');
    console.log('');

    // 1. users 表
    const [users] = await conn.execute(
      'SELECT id, username, nickname, role, DATE(createdAt) as created FROM users ORDER BY id'
    );
    console.log('【users】用户表:');
    if (users.length === 0) {
      console.log('  (无数据)');
    } else {
      users.forEach(u => console.log(`  ID=${u.id} | ${u.username} | ${u.nickname} | ${u.role} | ${u.created}`));
    }
    console.log('');

    // 2. teachers 表
    const [teachers] = await conn.execute(
      'SELECT t.id, t.userId, u.username, t.realName, t.isVerified FROM teachers t LEFT JOIN users u ON t.userId = u.id ORDER BY t.id'
    );
    console.log('【teachers】教师表:');
    if (teachers.length === 0) {
      console.log('  (无数据)');
    } else {
      teachers.forEach(t => console.log(`  ID=${t.id} | userId=${t.userId}(${t.username}) | ${t.realName} | 已认证=${t.isVerified}`));
    }
    console.log('');

    // 3. categories 表
    const [categories] = await conn.execute(
      'SELECT id, name, sortOrder, isActive FROM categories ORDER BY id'
    );
    console.log('【categories】课程分类表:');
    if (categories.length === 0) {
      console.log('  (无数据)');
    } else {
      categories.forEach(c => console.log(`  ID=${c.id} | ${c.name} | sort=${c.sortOrder} | active=${c.isActive}`));
    }
    console.log('');

    // 4. courses 表
    const [courses] = await conn.execute(
      'SELECT c.id, c.title, c.status, c.price, u.nickname as teacher FROM courses c LEFT JOIN users u ON c.teacherId = u.id ORDER BY c.id'
    );
    console.log('【courses】课程表:');
    if (courses.length === 0) {
      console.log('  (无数据)');
    } else {
      courses.forEach(c => console.log(`  ID=${c.id} | ${c.title} | 状态=${c.status} | 价格=${c.price} | 教师=${c.teacher}`));
    }
    console.log('');

    // 5. chapters 表
    const [chapters] = await conn.execute(
      'SELECT ch.id, ch.title, ch.courseId, c.title as courseTitle FROM chapters ch LEFT JOIN courses c ON ch.courseId = c.id ORDER BY ch.id'
    );
    console.log('【chapters】章节表:');
    if (chapters.length === 0) {
      console.log('  (无数据)');
    } else {
      chapters.forEach(ch => console.log(`  ID=${ch.id} | ${ch.title} | 课程ID=${ch.courseId}(${ch.courseTitle})`));
    }
    console.log('');

    // 6. lessons 表
    const [lessons] = await conn.execute(
      'SELECT l.id, l.title, l.chapterId, ch.title as chapterTitle FROM lessons l LEFT JOIN chapters ch ON l.chapterId = ch.id ORDER BY l.id'
    );
    console.log('【lessons】课时表:');
    if (lessons.length === 0) {
      console.log('  (无数据)');
    } else {
      lessons.forEach(l => console.log(`  ID=${l.id} | ${l.title} | 章节ID=${l.chapterId}(${l.chapterTitle})`));
    }
    console.log('');

    // 7. user_courses 表（购买记录）
    const [userCourses] = await conn.execute(
      'SELECT uc.id, uc.userId, u.username, uc.courseId, c.title as courseTitle, uc.price FROM user_courses uc LEFT JOIN users u ON uc.userId = u.id LEFT JOIN courses c ON uc.courseId = c.id ORDER BY uc.id'
    );
    console.log('【user_courses】购买记录表:');
    if (userCourses.length === 0) {
      console.log('  (无数据)');
    } else {
      userCourses.forEach(uc => console.log(`  ID=${uc.id} | 用户ID=${uc.userId}(${uc.username}) | 课程ID=${uc.courseId}(${uc.courseTitle}) | 价格=${uc.price}`));
    }
    console.log('');

    // 8. attachments 表
    const [attachments] = await conn.execute(
      'SELECT a.id, a.fileName, a.status, a.userId, u.username FROM attachments a LEFT JOIN users u ON a.userId = u.id ORDER BY a.id'
    );
    console.log('【attachments】附件表:');
    if (attachments.length === 0) {
      console.log('  (无数据)');
    } else {
      attachments.forEach(a => console.log(`  ID=${a.id} | ${a.fileName} | 状态=${a.status} | 用户ID=${a.userId}(${a.username})`));
    }
    console.log('');

    // 9. earnings 表
    const [earnings] = await conn.execute(
      'SELECT e.id, e.teacherId, e.amount, e.type, t.realName FROM earnings e LEFT JOIN teachers t ON e.teacherId = t.id ORDER BY e.id'
    );
    console.log('【earnings】收益表:');
    if (earnings.length === 0) {
      console.log('  (无数据)');
    } else {
      earnings.forEach(e => console.log(`  ID=${e.id} | 教师ID=${e.teacherId}(${e.realName}) | 金额=${e.amount} | 类型=${e.type}`));
    }
    console.log('');

    // 10. withdrawals 表
    const [withdrawals] = await conn.execute(
      'SELECT w.id, w.teacherId, w.amount, w.status, t.realName FROM withdrawals w LEFT JOIN teachers t ON w.teacherId = t.id ORDER BY w.id'
    );
    console.log('【withdrawals】提现表:');
    if (withdrawals.length === 0) {
      console.log('  (无数据)');
    } else {
      withdrawals.forEach(w => console.log(`  ID=${w.id} | 教师ID=${w.teacherId}(${w.realName}) | 金额=${w.amount} | 状态=${w.status}`));
    }
    console.log('');

    // 11. orders 表
    const [orders] = await conn.execute(
      'SELECT o.id, o.orderNo, o.status, o.totalAmount, u.username FROM orders o LEFT JOIN users u ON o.userId = u.id ORDER BY o.id'
    );
    console.log('【orders】订单表:');
    if (orders.length === 0) {
      console.log('  (无数据)');
    } else {
      orders.forEach(o => console.log(`  ID=${o.id} | ${o.orderNo} | 状态=${o.status} | 金额=${o.totalAmount} | 用户=${o.username}`));
    }
    console.log('');

    // 12. reviews 课程评价表
    const [reviews] = await conn.execute(
      'SELECT r.id, r.rating, r.content, u.username, c.title as courseTitle FROM reviews r LEFT JOIN users u ON r.userId = u.id LEFT JOIN courses c ON r.courseId = c.id ORDER BY r.id'
    );
    console.log('【reviews】课程评价表:');
    if (reviews.length === 0) {
      console.log('  (无数据)');
    } else {
      reviews.forEach(r => console.log(`  ID=${r.id} | 评分=${r.rating} | ${r.content?.substring(0, 30)} | 用户=${r.username} | 课程=${r.courseTitle}`));
    }
    console.log('');

    // 13. videos 视频表
    const [videos] = await conn.execute(
      'SELECT v.id, v.fileName, v.duration, v.status FROM videos v ORDER BY v.id'
    );
    console.log('【videos】视频表:');
    if (videos.length === 0) {
      console.log('  (无数据)');
    } else {
      videos.forEach(v => console.log(`  ID=${v.id} | ${v.fileName} | 时长=${v.duration} | 状态=${v.status}`));
    }
    console.log('');

    // 14. bundles 套餐表（如果有）
    try {
      const [bundles] = await conn.execute('SELECT id, name, price FROM bundles ORDER BY id');
      console.log('【bundles】套餐表:');
      if (bundles.length === 0) console.log('  (无数据)');
      else bundles.forEach(b => console.log(`  ID=${b.id} | ${b.name} | 价格=${b.price}`));
    } catch { console.log('【bundles】套餐表: (不存在)'); }
    console.log('');

    // 15. coupons 优惠券表（如果有）
    try {
      const [coupons] = await conn.execute('SELECT id, name, code, type FROM coupons ORDER BY id');
      console.log('【coupons】优惠券表:');
      if (coupons.length === 0) console.log('  (无数据)');
      else coupons.forEach(c => console.log(`  ID=${c.id} | ${c.name} | ${c.code} | ${c.type}`));
    } catch { console.log('【coupons】优惠券表: (不存在)'); }
    console.log('');

    // 统计数据
    console.log('========== 数据汇总 ==========');
    console.log(`  users: ${users.length} 条`);
    console.log(`  teachers: ${teachers.length} 条`);
    console.log(`  categories: ${categories.length} 条`);
    console.log(`  courses: ${courses.length} 条`);
    console.log(`  chapters: ${chapters.length} 条`);
    console.log(`  lessons: ${lessons.length} 条`);
    console.log(`  user_courses: ${userCourses.length} 条`);
    console.log(`  attachments: ${attachments.length} 条`);
    console.log(`  earnings: ${earnings.length} 条`);
    console.log(`  withdrawals: ${withdrawals.length} 条`);
    console.log(`  orders: ${orders.length} 条`);
    console.log(`  reviews: ${reviews.length} 条`);
    console.log(`  videos: ${videos.length} 条`);
    console.log('================================');

  } catch (err) {
    console.error('❌ 查询失败:', err.message);
  } finally {
    await conn.end();
  }
}

checkData();
