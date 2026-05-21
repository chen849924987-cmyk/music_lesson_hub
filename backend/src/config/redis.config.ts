import { registerAs } from '@nestjs/config';

/**
 * Redis 缓存配置
 * 功能描述：从环境变量读取 Redis 连接配置，统一管理
 * 配置项包括：主机、端口、密码、数据库索引、连接超时等
 */
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
  password: process.env.REDIS_PASSWORD ?? '',
  db: parseInt(process.env.REDIS_DB ?? '0', 10) || 0,
  /** 连接超时（毫秒） */
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT ?? '10000', 10) || 10000,
  /** 最大重试次数 */
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES ?? '3', 10) || 3,
  /** 是否启用缓存（开发环境可关闭） */
  enabled: process.env.REDIS_ENABLED !== 'false',
  /** 默认缓存 TTL（秒） */
  defaultTtl: parseInt(process.env.REDIS_DEFAULT_TTL ?? '300', 10) || 300,
}));
