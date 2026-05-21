/**
 * 更新课程封面脚本
 * 功能描述：将已存在课程封面上传到 MinIO，并更新数据库中所有课程的 cover 字段
 * 
 * 使用方式：node scripts/update-covers.js
 */
const Minio = require('minio');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const MINIO_CONFIG = {
  endPoint: '127.0.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  bucket: 'music-edu',
};

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'your-db-password-here',
  database: 'music_edu',
};

const TEST_FILES_DIR = path.resolve(__dirname, '../../用于测试上传功能的视频和图片');

async function updateCovers() {
  console.log('🖼️ 开始更新课程封面...\n');

  // 1. 连接 MinIO
  const minioClient = new Minio.Client(MINIO_CONFIG);

  // 2. 上传新封面到 MinIO
  const imagePath = path.join(TEST_FILES_DIR, 'b0b004ceaeea73cdc8ce5a71c8acc09f.png');
  const objectName = 'seed/default-cover.png';

  try {
    await minioClient.statObject(MINIO_CONFIG.bucket, objectName);
    console.log('  ℹ️ 封面文件已存在，重新上传覆盖...');
  } catch (err) {
    if (err.code !== 'NotFound') throw err;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  await minioClient.putObject(MINIO_CONFIG.bucket, objectName, fileBuffer, fileBuffer.length, {
    'Content-Type': 'image/png',
  });
  console.log(`  ✅ 封面上传成功: ${objectName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

  // 3. 连接 MySQL
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('\n✅ MySQL 连接成功');

  // 4. 查询所有课程
  const [courses] = await conn.execute('SELECT id, title, cover FROM courses');
  console.log(`\n📚 共找到 ${courses.length} 门课程`);

  // 5. 更新每门课程的 cover 字段
  for (const course of courses) {
    await conn.execute('UPDATE courses SET cover = ? WHERE id = ?', [objectName, course.id]);
    console.log(`  ✅ [ID=${course.id}] "${course.title}" 封面已更新：${course.cover} → ${objectName}`);
  }

  await conn.end();
  console.log('\n🎉 所有课程封面已成功更新！');
  console.log('💡 刷新页面即可看到新封面（封面 URL 为预签名 URL，可能有缓存延迟）');
}

updateCovers().catch((err) => {
  console.error('❌ 更新封面失败:', err.message);
  process.exit(1);
});
