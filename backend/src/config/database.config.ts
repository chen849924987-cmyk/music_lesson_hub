import { registerAs } from '@nestjs/config';

/**
 * 数据库配置
 * 功能描述：从环境变量读取 MySQL 数据库连接配置，统一管理
 * 配置项包括：主机、端口、用户名、密码、数据库名
 */
export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10) || 3306,
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root123456',
  database: process.env.DB_DATABASE ?? 'music_edu',
}));
