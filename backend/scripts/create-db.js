const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'your-db-password-here',
      port: 3306,
    });
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS music_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 数据库 music_edu 创建/确认成功！');
    
    await connection.end();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('\n请确认：');
    console.log('1. MySQL 服务是否已启动？');
    console.log('2. 用户名和密码是否正确？');
    console.log('3. 端口是否为 3306？');
  }
}

createDatabase();
