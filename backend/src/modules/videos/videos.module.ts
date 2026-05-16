import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video } from './entities/video.entity';
import { StorageModule } from '../storage/storage.module';

/**
 * 视频管理模块
 * 功能描述：提供视频元数据的 CRUD 功能，包括视频记录管理、播放地址生成、封面管理、转码状态跟踪等
 * 依赖 StorageModule 进行 MinIO 文件存储操作
 *
 * 导出了 TypeOrmModule 和 VideosService，供其他模块（如 CoursesModule）注入 VideoRepository
 */
@Module({
  imports: [TypeOrmModule.forFeature([Video]), StorageModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService, TypeOrmModule.forFeature([Video])],
})
export class VideosModule {}
