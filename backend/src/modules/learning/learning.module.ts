/**
 * LearningModule 学习进度模块
 *
 * 功能描述：注册学习进度相关的 Controller、Service 和 TypeORM 实体。
 *           需要导入 TypeOrmModule.forFeature([LearningProgress]) 注册实体。
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { LearningProgress } from './entities/learning-progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LearningProgress])],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
