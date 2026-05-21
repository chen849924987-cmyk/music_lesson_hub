import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import redisConfig from '../../config/redis.config';
import { RedisService } from './redis.service';

/**
 * Redis 缓存模块
 * 功能描述：全局共享模块，提供 RedisService 供所有业务模块使用。
 *          通过 @Global 装饰器标记为全局模块，其他模块无需导入即可注入 RedisService。
 *
 * @Global 全局模块：一旦在 AppModule 中导入，所有模块都可以直接注入 RedisService
 */
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
