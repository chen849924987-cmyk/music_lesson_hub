import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Course } from './entities/course.entity';
import { Chapter } from './entities/chapter.entity';
import { Lesson } from './entities/lesson.entity';
import { CourseReview } from './entities/course-review.entity';
import { UserCourse } from './entities/user-course.entity';
import { UserLesson } from './entities/user-lesson.entity';
import { Evaluation } from './entities/evaluation.entity';
import { CategoriesService } from './categories.service';
import { CoursesService } from './courses.service';
import { ChaptersService } from './chapters.service';
import { LessonsService } from './lessons.service';
import { EvaluationsService } from './evaluations.service';
import { CategoriesController } from './categories.controller';
import { CoursesController } from './courses.controller';
import { ChaptersController } from './chapters.controller';
import { LessonsController } from './lessons.controller';
import { EvaluationsController } from './evaluations.controller';
import { VideosModule } from '../videos/videos.module';

/**
 * 课程模块
 * 功能描述：整合课程管理相关的所有组件
 *
 * 提供能力：
 * - 分类管理（CategoriesController + CategoriesService）
 * - 课程管理（CoursesController + CoursesService）
 * - 章节管理（ChaptersController + ChaptersService）
 * - 课时管理（LessonsController + LessonsService）
 *
 * 依赖：VideosModule（获取 VideoRepository 用于课时创建/更新时自动关联视频时长）
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Course, Chapter, Lesson, CourseReview, UserCourse, UserLesson, Evaluation]),
    VideosModule,
  ],
  controllers: [
    CategoriesController,
    CoursesController,
    ChaptersController,
    LessonsController,
    EvaluationsController,
  ],
  providers: [
    CategoriesService,
    CoursesService,
    ChaptersService,
    LessonsService,
    EvaluationsService,
  ],
  exports: [
    CoursesService,
    CategoriesService,
  ],
})
export class CoursesModule {}
