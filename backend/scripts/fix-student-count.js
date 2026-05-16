/**
 * studentCount 数据修复脚本
 * 功能描述：根据 user_courses 表中的真实购买记录，重新计算并更新每个课程的 studentCount。
 *          解决 seed 数据使用假值（256、128 等）导致统计数据不准确的问题。
 *
 * 使用方式：在 backend 目录下执行 node scripts/fix-student-count.js
 *
 * @note 该脚本为一次性修复工具，后续新增购买记录将通过 addUserCourse 中的递增逻辑自动维护
 */

const mysql = require('mysql2/promise');

// ============ 数据库配置 ============
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'your-db-password-here',
  database: 'music_edu',
};

/**
 * 主函数：修复所有课程的 studentCount
 */
async function fixStudentCount() {
  console.log('🔄 开始修复课程 studentCount 数据...\n');

  // 1. 连接数据库
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅ 数据库连接成功\n');

  try {
    // 2. 查询每门课程的真实购买人数（user_courses 表）
    const [realCounts] = await conn.execute(`
      SELECT courseId, COUNT(DISTINCT userId) AS realStudentCount
      FROM user_courses
      GROUP BY courseId
    `);
    console.log(`📊 从 user_courses 表中找到 ${realCounts.length} 门课程有购买记录\n`);

    // 3. 查询所有课程的当前 studentCount
    const [allCourses] = await conn.execute(`
      SELECT id, title, studentCount FROM courses ORDER BY id
    `);
    console.log(`📚 数据库中共有 ${allCourses.length} 门课程\n`);

    // 4. 建立 courseId → realStudentCount 的映射
    const realCountMap = {};
    let totalReal = 0;
    for (const row of realCounts) {
      realCountMap[row.courseId] = row.realStudentCount;
      totalReal += row.realStudentCount;
    }

    // 5. 批量更新 studentCount
    let updatedCount = 0;
    let noChangeCount = 0;

    for (const course of allCourses) {
      const realCount = realCountMap[course.id] || 0;
      const oldCount = course.studentCount;

      if (oldCount !== realCount) {
        await conn.execute(
          'UPDATE courses SET studentCount = ? WHERE id = ?',
          [realCount, course.id]
        );
        console.log(`  ✅ [ID=${course.id}] "${course.title}": ${oldCount} → ${realCount}`);
        updatedCount++;
      } else {
        noChangeCount++;
      }
    }

    // 6. 输出统计结果
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📈 修复完成统计：`);
    console.log(`   - 总课程数：${allCourses.length}`);
    console.log(`   - 已更新：${updatedCount} 门课程`);
    console.log(`   - 无需变更：${noChangeCount} 门课程`);
    console.log(`   - 真实购买人数总计：${totalReal} 人`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 7. 如果没有购买记录，提示用户
    if (totalReal === 0) {
      console.log('💡 提示：目前 user_courses 表中没有购买记录，');
      console.log('   所有课程的 studentCount 已重置为 0。');
      console.log('   后续用户购买课程后，addUserCourse 方法会自动递增 studentCount。\n');
    }

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    throw error;
  } finally {
    await conn.end();
    console.log('🔌 数据库连接已关闭');
  }
}

fixStudentCount().catch((err) => {
  console.error('❌ 脚本执行失败:', err.message);
  process.exit(1);
});
