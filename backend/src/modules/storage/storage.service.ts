import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * MinIO 对象存储服务
 * 功能描述：封装 MinIO 客户端的常用操作，包括上传文件、获取签名URL、删除文件、确保存储桶存在等
 * 供视频模块和附件模块内部调用，不直接对外暴露
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const endPoint = this.configService.get<string>('minio.endPoint') ?? '192.168.1.100';
    const port = this.configService.get<number>('minio.port') ?? 9000;
    const accessKey = this.configService.get<string>('minio.accessKey') ?? 'minioadmin';
    const secretKey = this.configService.get<string>('minio.secretKey') ?? 'minioadmin';
    const useSSL = this.configService.get<boolean>('minio.useSSL') ?? false;
    this.bucket = this.configService.get<string>('minio.bucket') ?? 'music-edu';

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.logger.log(`MinIO 客户端初始化成功: ${endPoint}:${port}/${this.bucket}`);
  }

  /**
   * 获取 MinIO 原生客户端（供高级操作使用）
   * @returns MinIO Client 实例
   */
  getClient(): Minio.Client {
    return this.minioClient;
  }

  /**
   * 获取当前存储桶名称
   * @returns 存储桶名称
   */
  getBucket(): string {
    return this.bucket;
  }

  /**
   * 确保存储桶存在，不存在则自动创建
   * @param bucketName - 存储桶名称，不传则使用默认存储桶
   */
  async ensureBucket(bucketName?: string): Promise<void> {
    const name = bucketName ?? this.bucket;
    try {
      const exists = await this.minioClient.bucketExists(name);
      if (!exists) {
        await this.minioClient.makeBucket(name, 'us-east-1');
        this.logger.log(`存储桶已创建: ${name}`);
      }
    } catch (error: unknown) {
      this.logger.error(`确保存储桶存在失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 上传文件到 MinIO
   * @param objectName - 对象名称（路径+文件名）
   * @param buffer - 文件缓冲区
   * @param size - 文件大小
   * @param mimetype - 文件 MIME 类型
   * @param metadata - 自定义元数据（可选）
   * @returns 上传成功后的对象信息
   */
  async uploadFile(
    objectName: string,
    buffer: Buffer,
    size: number,
    mimetype: string,
    metadata?: Record<string, string>,
  ): Promise<{ bucket: string; objectName: string }> {
    await this.ensureBucket();
    const meta = {
      'Content-Type': mimetype,
      ...(metadata ?? {}),
    };
    await this.minioClient.putObject(this.bucket, objectName, buffer, size, meta);
    this.logger.log(`文件上传成功: ${this.bucket}/${objectName}`);
    return { bucket: this.bucket, objectName };
  }

  /**
   * 获取文件的签名访问URL（带过期时间，用于视频播放和文件下载）
   * @param objectName - 对象名称
   * @param expiry - 过期时间（秒），默认 3600（1小时）
   * @returns 签名的临时访问URL
   */
  async getPresignedUrl(objectName: string, expiry: number = 3600): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(this.bucket, objectName, expiry);
      return url;
    } catch (error: unknown) {
      this.logger.error(`获取签名URL失败: ${this.bucket}/${objectName} - ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 获取文件的统计信息（大小、元数据等）
   * @param objectName - 对象名称
   * @returns 文件统计信息
   */
  async statObject(objectName: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.minioClient.statObject(this.bucket, objectName);
    } catch (error: unknown) {
      this.logger.error(`获取文件统计信息失败: ${this.bucket}/${objectName} - ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 从 MinIO 删除文件
   * @param objectName - 对象名称
   */
  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucket, objectName);
      this.logger.log(`文件删除成功: ${this.bucket}/${objectName}`);
    } catch (error: unknown) {
      this.logger.error(`删除文件失败: ${this.bucket}/${objectName} - ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 批量删除文件
   * @param objectNames - 对象名称数组
   */
  async deleteFiles(objectNames: string[]): Promise<void> {
    try {
      await this.minioClient.removeObjects(this.bucket, objectNames);
      this.logger.log(`批量删除文件成功: ${objectNames.length} 个文件`);
    } catch (error: unknown) {
      this.logger.error(`批量删除文件失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 获取部分对象内容（用于视频范围请求/流式传输）
   * @param objectName - 对象名称
   * @param offset - 起始偏移量
   * @param length - 读取长度
   * @returns 可读流
   */
  async getPartialObject(objectName: string, offset: number, length: number): Promise<any> {
    try {
      return await this.minioClient.getPartialObject(this.bucket, objectName, offset, length);
    } catch (error: unknown) {
      this.logger.error(`获取部分对象失败: ${this.bucket}/${objectName} - ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 复制文件到指定路径
   * @param sourceObject - 源对象名称
   * @param destObject - 目标对象名称
   */
  async copyObject(sourceObject: string, destObject: string): Promise<void> {
    try {
      await this.minioClient.copyObject(this.bucket, destObject, `/${this.bucket}/${sourceObject}`);
      this.logger.log(`文件复制成功: ${sourceObject} -> ${destObject}`);
    } catch (error: unknown) {
      this.logger.error(`复制文件失败: ${(error as Error).message}`);
      throw error;
    }
  }
}
