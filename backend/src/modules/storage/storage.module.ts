import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import minioConfig from '../../config/minio.config';
import { StorageService } from './storage.service';

/**
 * 存储模块
 * 功能描述：全局模块，提供基于 MinIO 的对象存储服务（视频存储、附件存储）
 * 使用 @Global 装饰器使其全局可用，其他模块无需重复导入
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(minioConfig)],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
