import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis 缓存服务
 * 功能描述：封装 ioredis 客户端，提供统一的缓存读写接口，
 *          支持键值对存取、过期时间设置、缓存失效等操作。
 *          所有业务模块通过此服务访问 Redis，不直接操作 ioredis 实例。
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  /** ioredis 客户端实例 */
  private client: Redis | null = null;

  /** 是否启用缓存 */
  private enabled: boolean;

  /** 默认缓存 TTL（秒） */
  private defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('redis.enabled', true);
    this.defaultTtl = this.configService.get<number>('redis.defaultTtl', 300);
  }

  /**
   * 模块初始化时建立 Redis 连接
   */
  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Redis 缓存未启用（REDIS_ENABLED=false），跳过连接');
      return;
    }

    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    const password = this.configService.get<string>('redis.password', '');
    const db = this.configService.get<number>('redis.db', 0);
    const connectTimeout = this.configService.get<number>('redis.connectTimeout', 10000);
    const maxRetries = this.configService.get<number>('redis.maxRetries', 3);

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      connectTimeout,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > maxRetries) {
          this.logger.error(`Redis 连接重试超过 ${maxRetries} 次，放弃连接`);
          return null; // 停止重试
        }
        const delay = Math.min(times * 200, 2000);
        this.logger.warn(`Redis 连接重试第 ${times} 次，延迟 ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // 注册事件监听
    this.client.on('connect', () => {
      this.logger.log(`Redis 已连接: ${host}:${port}/${db}`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis 连接错误: ${err.message}`);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis 已就绪');
    });

    this.client.on('close', () => {
      this.logger.warn('Redis 连接已关闭');
    });

    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error(`Redis 连接失败: ${(err as Error).message}`);
      this.client = null;
    }
  }

  /**
   * 模块销毁时关闭 Redis 连接
   */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis 连接已正常关闭');
    }
  }

  /**
   * 获取 Redis 客户端（供需要直接操作 ioredis 的场景使用）
   * @returns ioredis 客户端实例，未启用时返回 null
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * 检查 Redis 是否可用
   * @returns true 表示 Redis 已连接可用
   */
  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值（字符串），不存在或 Redis 不可用时返回 null
   */
  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isAvailable()) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.error(`Redis get 失败 (key=${key}): ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * 获取缓存值并自动解析为 JSON 对象
   * @param key 缓存键
   * @returns 解析后的 JSON 对象，不存在或解析失败时返回 null
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      this.logger.warn(`Redis 缓存 JSON 解析失败 (key=${key})`);
      return null;
    }
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值（字符串或可 JSON 序列化的对象）
   * @param ttl 过期时间（秒），不传则使用默认 TTL，传 0 表示永不过期
   */
  async set(key: string, value: string | Record<string, any>, ttl?: number): Promise<void> {
    if (!this.client || !this.isAvailable()) {
      return;
    }
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      const expireIn = ttl ?? this.defaultTtl;

      if (expireIn > 0) {
        await this.client.setex(key, expireIn, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      this.logger.error(`Redis set 失败 (key=${key}): ${(err as Error).message}`);
    }
  }

  /**
   * 删除指定缓存键
   * @param key 要删除的缓存键，支持通配符（如 `course:*`）
   * @returns 删除的键数量
   */
  async del(key: string): Promise<number> {
    if (!this.client || !this.isAvailable()) {
      return 0;
    }
    try {
      return await this.client.del(key);
    } catch (err) {
      this.logger.error(`Redis del 失败 (key=${key}): ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * 按模式批量删除缓存键（如清空某类缓存）
   * @param pattern 匹配模式，如 `course:catalog:*`
   * @returns 删除的键数量
   */
  async delByPattern(pattern: string): Promise<number> {
    if (!this.client || !this.isAvailable()) {
      return 0;
    }
    try {
      // 使用 SCAN 命令分批查找匹配的键，避免 KEYS 命令阻塞 Redis
      let cursor = '0';
      let deletedCount = 0;
      do {
        const result = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          const count = await this.client.del(...keys);
          deletedCount += count;
        }
      } while (cursor !== '0');
      return deletedCount;
    } catch (err) {
      this.logger.error(`Redis delByPattern 失败 (pattern=${pattern}): ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * 检查缓存键是否存在
   * @param key 缓存键
   * @returns true 表示存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isAvailable()) {
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      this.logger.error(`Redis exists 失败 (key=${key}): ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   * @param key 缓存键
   * @param ttl 过期时间（秒）
   * @returns true 表示设置成功
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client || !this.isAvailable()) {
      return false;
    }
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (err) {
      this.logger.error(`Redis expire 失败 (key=${key}): ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * 原子自增（用于计数器场景，如播放量）
   * @param key 缓存键
   * @param increment 增量，默认 1
   * @returns 自增后的值
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    if (!this.client || !this.isAvailable()) {
      return 0;
    }
    try {
      return await this.client.incrby(key, increment);
    } catch (err) {
      this.logger.error(`Redis incr 失败 (key=${key}): ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * 获取缓存剩余过期时间
   * @param key 缓存键
   * @returns 剩余秒数，-1 表示永不过期，-2 表示键不存在
   */
  async ttl(key: string): Promise<number> {
    if (!this.client || !this.isAvailable()) {
      return -2;
    }
    try {
      return await this.client.ttl(key);
    } catch (err) {
      this.logger.error(`Redis ttl 失败 (key=${key}): ${(err as Error).message}`);
      return -2;
    }
  }
}
