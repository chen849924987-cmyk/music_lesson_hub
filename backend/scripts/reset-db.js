const mysql = require('mysql2/promise');

async function resetDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'your-db-password-here',
      port: 3306,
      database: 'music_edu'
    });
    
    // 先尝试删除残留表（按依赖顺序，从子表到父表）
    await connection.execute('DROP TABLE IF EXISTS `lessons`');
    await connection.execute('DROP TABLE IF EXISTS `chapters`');
    await connection.execute('DROP TABLE IF EXISTS `courses`');
    await connection.execute('DROP TABLE IF EXISTS `categories`');
    await connection.execute('DROP TABLE IF EXISTS `users`');
    await connection.execute('DROP TABLE IF EXISTS `teachers`');
    await connection.execute('DROP TABLE IF EXISTS `typeorm_metadata`');
    console.log('✅ 已清除所有残留表（含课程相关表）');
    
    await connection.end();
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
}

resetDatabase();
