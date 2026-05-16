import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './entities/attachment.entity';
import { StorageModule } from '../storage/storage.module';

/**
 * 附件管理模块
 * 功能描述：提供课程附件（课件、乐谱等）的 CRUD 功能，支持附件上传记录、审核流程、下载地址生成等
 * 依赖 StorageModule 进行 MinIO 文件存储操作
 */
@Module({
  imports: [TypeOrmModule.forFeature([Attachment]), StorageModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
