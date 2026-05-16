/**
 * 清理测试数据脚本
 * 
 * 功能描述：保留 seed.js 创建的种子数据，删除所有自动化测试过程中产生的测试数据
 * 
 * 保留的种子数据：
 *   - users: admin (ID=1), teacher01 (ID=2), reviewer01 (ID=3), operator01 (ID=4)
 *   - teachers: 张明 (ID=1, userId=2)
 *   - categories: 钢琴、吉他、声乐、乐理、古筝、二胡
 * 
 * 删除的测试数据：
 *   - users 表中 ID>=5 的所有用户（注册测试账号）
 *   - teachers 表中 ID>=2 的所有教师记录（测试创建）
 *   - 所有 courses / chapters / lessons（测试创建的课程内容）
 *   - 其他相关表中的关联数据
 * 
 * 运行方式：node scripts/clean-test-data.js
 */

const mysql = require('mysql2/promise');

async function cleanTestData() {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'your-db-password-here',
      database: 'music_edu'
    });

  try {
    console.log('========== 开始清理测试数据 ==========\n');

    // 先获取所有表名，确认哪些表存在
    const [tables] = await conn.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('当前数据库中的表:', tableNames.join(', '));

    // 临时禁用外键检查，避免删除顺序导致的约束冲突
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // 获取需要删除数据的表列表（按依赖顺序：子表先删，父表后删）
    const deletionOrder = [
      'cart_items',
      'coupons',
      'course_reviews',
      'user_coupons',
      'user_lessons',
      'user_courses',
      'order_items',
      'orders',
      'earnings',
      'withdrawals',
      'attachments',
      'videos',
      'lessons',
      'chapters',
      'courses',
    ];

    for (const tableName of deletionOrder) {
      try {
        // 检查表是否存在
        if (!tableNames.includes(tableName)) {
          console.log(`ℹ️  ${tableName} 表不存在，跳过`);
          continue;
        }
        const [result] = await conn.execute(`DELETE FROM \`${tableName}\` WHERE id > 0`);
        if (result.affectedRows > 0) {
          console.log(`✅ 已清空 ${tableName}: ${result.affectedRows} 条`);
        } else {
          console.log(`ℹ️  ${tableName} 表已空`);
        }
      } catch (err) {
        console.log(`⚠️  删除 ${tableName} 时出错: ${err.message}`);
      }
    }

    // 删除测试教师记录 (teachers) - 保留种子数据 ID=1
    try {
      if (tableNames.includes('teachers')) {
        const [result] = await conn.execute('DELETE FROM teachers WHERE id >= 2');
        console.log(`✅ 已删除 teachers (测试): ${result.affectedRows} 条 (保留 ID=1 张明)`);
      }
    } catch (err) {
      console.log(`⚠️  删除 teachers 时出错: ${err.message}`);
    }

    // 删除测试用户 (users) - 保留种子数据 ID=1~4
    try {
      if (tableNames.includes('users')) {
        const [result] = await conn.execute('DELETE FROM users WHERE id >= 5');
        console.log(`✅ 已删除 users (测试): ${result.affectedRows} 条 (保留 ID=1~4: admin/teacher01/reviewer01/operator01)`);
      }
    } catch (err) {
      console.log(`⚠️  删除 users 时出错: ${err.message}`);
    }

    // 恢复外键检查
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n========== 清理完成 ==========');
    console.log('保留的种子数据：');
    console.log('  - admin (super_admin)');
    console.log('  - teacher01 + 张明 (teacher)');
    console.log('  - reviewer01 (reviewer)');
    console.log('  - operator01 (operator)');
    console.log('  - 6 个课程分类 (钢琴/吉他/声乐/乐理/古筝/二胡)');

  } catch (err) {
    console.error('❌ 清理失败:', err.message);
    console.error(err);
  } finally {
    await conn.end();
  }
}

cleanTestData();
