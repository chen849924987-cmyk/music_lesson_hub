import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChaptersService } from './chapters.service';
import { LessonsService } from './lessons.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

/**
 * 章节控制器
 * 功能描述：处理课程章节的 CRUD 接口，以及章节下课时的 CRUD 接口
 *
 * 接口权限说明：
 * - GET    /courses/:courseId/chapters                          → 公开，获取课程下的章节列表
 * - GET    /courses/:courseId/chapters/:id                      → 公开，获取章节详情
 * - POST   /courses/:courseId/chapters                          → 教师，创建章节
 * - PUT    /courses/:courseId/chapters/:id                      → 教师，更新章节
 * - DELETE /courses/:courseId/chapters/:id                      → 教师，删除章节
 * - PATCH  /courses/:courseId/chapters/:id/sort                 → 教师，更新章节排序
 * - POST   /courses/:courseId/chapters/:chapterId/lessons       → 教师，创建课时（系列课下）
 * - PUT    /courses/:courseId/chapters/:chapterId/lessons/:id   → 教师，更新课时（系列课下）
 * - DELETE /courses/:courseId/chapters/:chapterId/lessons/:id   → 教师，删除课时（系列课下）
 */
@Controller('courses/:courseId/chapters')
export class ChaptersController {
  constructor(
    private readonly chaptersService: ChaptersService,
    private readonly lessonsService: LessonsService,
  ) {}

  /**
   * 获取课程下的章节列表（公开接口）
   * GET /api/v1/courses/:courseId/chapters
   */
  @Get()
  async findByCourseId(@Param('courseId', ParseIntPipe) courseId: number) {
    const chapters = await this.chaptersService.findByCourseId(courseId);
    return ApiResponse.success(chapters);
  }

  /**
   * 获取章节详情（公开接口）
   * GET /api/v1/courses/:courseId/chapters/:id
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const chapter = await this.chaptersService.findById(id);
    return ApiResponse.success(chapter);
  }

  /**
   * 教师端：创建章节
   * POST /api/v1/courses/:courseId/chapters
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() createChapterDto: CreateChapterDto,
  ) {
    const chapter = await this.chaptersService.create(courseId, createChapterDto);
    return ApiResponse.created(chapter, '章节创建成功');
  }

  /**
   * 教师端：更新章节
   * PUT /api/v1/courses/:courseId/chapters/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    const chapter = await this.chaptersService.update(id, updateChapterDto);
    return ApiResponse.success(chapter, '章节更新成功');
  }

  /**
   * 教师端：删除章节
   * DELETE /api/v1/courses/:courseId/chapters/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.chaptersService.remove(id);
    return ApiResponse.success(null, '章节删除成功');
  }

  /**
   * 教师端：更新章节排序
   * PATCH /api/v1/courses/:courseId/chapters/:id/sort
   * Body: { "sortOrder": 1 }
   */
  @Patch(':id/sort')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async updateSortOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('sortOrder') sortOrder: number,
  ) {
    const chapter = await this.chaptersService.updateSortOrder(id, sortOrder);
    return ApiResponse.success(chapter, '排序更新成功');
  }

  // ======================================================================
  // 章节下的课时子路由（系列课程使用）
  // 说明：系列课程的课时管理通过 /courses/:courseId/chapters/:chapterId/lessons 路径
  //       单课程的课时管理通过 /courses/:courseId/lessons 路径（lessons.controller.ts）
  // ======================================================================

  /**
   * 获取章节下的课时列表（公开接口）
   * GET /api/v1/courses/:courseId/chapters/:chapterId/lessons
   */
  @Get(':chapterId/lessons')
  async findLessonsByChapterId(
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ) {
    const lessons = await this.lessonsService.findByChapterId(chapterId);
    return ApiResponse.success(lessons);
  }

  /**
   * 教师端：创建课时（系列课程下，关联章节）
   * POST /api/v1/courses/:courseId/chapters/:chapterId/lessons
   */
  @Post(':chapterId/lessons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async createLesson(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    // 自动注入章节ID
    createLessonDto.chapterId = chapterId;
    const lesson = await this.lessonsService.create(courseId, createLessonDto);
    return ApiResponse.created(lesson, '课时创建成功');
  }

  /**
   * 教师端：更新课时（系列课程下）
   * PUT /api/v1/courses/:courseId/chapters/:chapterId/lessons/:id
   */
  @Put(':chapterId/lessons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async updateLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    const lesson = await this.lessonsService.update(id, updateLessonDto);
    return ApiResponse.success(lesson, '课时更新成功');
  }

  /**
   * 教师端：删除课时（系列课程下）
   * DELETE /api/v1/courses/:courseId/chapters/:chapterId/lessons/:id
   */
  @Delete(':chapterId/lessons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async removeLesson(
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.lessonsService.remove(id);
    return ApiResponse.success(null, '课时删除成功');
  }
}
