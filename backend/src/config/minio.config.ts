import { registerAs } from '@nestjs/config';

/**
 * MinIO 对象存储配置
 * 功能描述：从环境变量读取 MinIO 连接配置，统一管理
 * 配置项包括：终端地址、端口、访问密钥、密钥、存储桶名、是否使用SSL
 */
export default registerAs('minio', () => ({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: parseInt(process.env.MINIO_PORT ?? '9000', 10) || 9000,
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  bucket: process.env.MINIO_BUCKET ?? 'music-edu',
  useSSL: process.env.MINIO_USE_SSL === 'true',
}));
