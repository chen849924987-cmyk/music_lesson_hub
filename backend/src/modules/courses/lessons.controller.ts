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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

/**
 * 课时控制器
 * 功能描述：处理课时的 CRUD 接口
 *
 * 接口权限说明：
 * - GET    /courses/:courseId/lessons              → 公开，获取课程下的课时列表
 * - GET    /courses/:courseId/chapters/:chapterId/lessons → 公开，获取章节下的课时列表
 * - GET    /courses/:courseId/lessons/:id          → 公开，获取课时详情
 * - POST   /courses/:courseId/lessons              → 教师，创建课时
 * - PUT    /courses/:courseId/lessons/:id          → 教师，更新课时
 * - DELETE /courses/:courseId/lessons/:id          → 教师，删除课时
 * - PATCH  /courses/:courseId/lessons/:id/sort     → 教师，更新课时排序
 */
@Controller('courses/:courseId/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  /**
   * 获取课程下的课时列表（公开接口）
   * GET /api/v1/courses/:courseId/lessons
   */
  @Get()
  async findByCourseId(@Param('courseId', ParseIntPipe) courseId: number) {
    const lessons = await this.lessonsService.findByCourseId(courseId);
    return ApiResponse.success(lessons);
  }

  /**
   * 获取课时详情（公开接口）
   * GET /api/v1/courses/:courseId/lessons/:id
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const lesson = await this.lessonsService.findById(id);
    return ApiResponse.success(lesson);
  }

  /**
   * 教师端：创建课时
   * POST /api/v1/courses/:courseId/lessons
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    const lesson = await this.lessonsService.create(courseId, createLessonDto);
    return ApiResponse.created(lesson, '课时创建成功');
  }

  /**
   * 教师端：更新课时
   * PUT /api/v1/courses/:courseId/lessons/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    const lesson = await this.lessonsService.update(id, updateLessonDto);
    return ApiResponse.success(lesson, '课时更新成功');
  }

  /**
   * 教师端：删除课时
   * DELETE /api/v1/courses/:courseId/lessons/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.lessonsService.remove(id);
    return ApiResponse.success(null, '课时删除成功');
  }

  /**
   * 教师端：更新课时排序
   * PATCH /api/v1/courses/:courseId/lessons/:id/sort
   * Body: { "sortOrder": 1 }
   */
  @Patch(':id/sort')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async updateSortOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('sortOrder') sortOrder: number,
  ) {
    const lesson = await this.lessonsService.updateSortOrder(id, sortOrder);
    return ApiResponse.success(lesson, '排序更新成功');
  }
}
