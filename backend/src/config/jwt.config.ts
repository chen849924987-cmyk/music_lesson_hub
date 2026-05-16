import { registerAs } from '@nestjs/config';

/**
 * JWT 配置
 * 功能描述：从环境变量读取 JWT 鉴权配置，包括密钥和过期时间
 */
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'your-jwt-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
}));
