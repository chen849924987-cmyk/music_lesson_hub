import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, CourseStatus } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  private transformPriceToYuan(course: any): void {
    if (course.price !== undefined && course.price !== null) course.price = course.price / 100;
    if (course.originalPrice !== undefined && course.originalPrice !== null) course.originalPrice = course.originalPrice / 100;
  }

  private transformPriceListToYuan(items: any[]): void {
    items.forEach((item) => this.transformPriceToYuan(item));
  }

  @Get()
  async findPublished(@Query() queryDto: CourseQueryDto) {
    const result = await this.coursesService.findPublished(queryDto);
    await Promise.all(result.items.map((item: any) => this.coursesService.transformCoverToUrl(item)));
    this.transformPriceListToYuan(result.items);
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  @Get('teacher')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async findMyCourses(@CurrentUser('sub') userId: number, @Query() queryDto: CourseQueryDto) {
    const result = await this.coursesService.findTeacherCourses(userId, queryDto);
    await Promise.all(result.items.map((item: any) => this.coursesService.transformCoverToUrl(item)));
    this.transformPriceListToYuan(result.items);
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  @Get('teacher/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async getTeacherStats(@CurrentUser('sub') userId: number) {
    const stats = await this.coursesService.getTeacherStats(userId);
    return ApiResponse.success({ totalCourses: stats.totalCourses, totalStudents: stats.totalStudents, pendingReviewCount: stats.pendingReviewCount, totalEarnings: stats.totalEarnings / 100 });
  }

  @Get('teacher/producers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async getTeacherProducers(@CurrentUser('sub') userId: number, @Query('page', new ParseIntPipe({ optional: true })) page?: number, @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number) {
    const result = await this.coursesService.getTeacherProducers(userId, page || 1, pageSize || 20);
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER, Role.OPERATOR)
  async findAll(@Query() queryDto: CourseQueryDto) {
    const result = await this.coursesService.findAll(queryDto);
    await Promise.all(result.items.map((item: any) => this.coursesService.transformCoverToUrl(item)));
    this.transformPriceListToYuan(result.items);
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  @Get('admin/preview/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER, Role.OPERATOR)
  async findByIdAdmin(@Param('id', ParseIntPipe) id: number) {
    const course = await this.coursesService.findById(id, ['category', 'chapters', 'chapters.lessons']);
    await this.coursesService.transformCoverToUrl(course);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course);
  }

  // ⚠️ 具名路由必须放在 :id 之前，否则会被 :id 捕获
  @Get('pending-review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER)
  async findPendingReview(@Query() queryDto: CourseQueryDto) {
    const result = await this.coursesService.findPendingReview(queryDto);
    await Promise.all(result.items.map((item: any) => this.coursesService.transformCoverToUrl(item)));
    this.transformPriceListToYuan(result.items);
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  @Get('stats/pending-count')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER)
  async getPendingCourseCount() {
    const count = await this.coursesService.countPendingReview();
    return ApiResponse.success({ count });
  }

  @Get('my/purchased')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async getMyPurchasedCourses(@CurrentUser('sub') userId: number) {
    const courses = await this.coursesService.findUserCourses(userId);
    this.transformPriceListToYuan(courses);
    return ApiResponse.success(courses);
  }

  // ===== 课程详情与变更对比 =====

  @Get(':id/diff')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER)
  async getCourseDiff(@Param('id', ParseIntPipe) id: number) {
    const diff = await this.coursesService.getCourseDiff(id);
    return ApiResponse.success(diff);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const course = await this.coursesService.findById(id, ['category', 'chapters', 'chapters.lessons']);
    await this.coursesService.transformCoverToUrl(course);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course);
  }

  @Get(':id/reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER, Role.TEACHER)
  async getReviewHistory(@Param('id', ParseIntPipe) id: number) {
    const reviews = await this.coursesService.getReviewHistory(id);
    return ApiResponse.success(reviews);
  }

  @Get(':id/purchase-status')
  @UseGuards(AuthGuard('jwt'))
  async checkPurchaseStatus(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    const purchased = await this.coursesService.checkUserPurchasedCourse(userId, id);
    return ApiResponse.success({ purchased });
  }

  @Get(':courseId/lessons/:lessonId/access')
  @UseGuards(OptionalJwtGuard)
  async checkLessonAccess(@Param('courseId', ParseIntPipe) courseId: number, @Param('lessonId', ParseIntPipe) lessonId: number, @CurrentUser('sub') userId?: number) {
    const access = await this.coursesService.checkLessonAccess(userId || null, courseId, lessonId);
    return ApiResponse.success(access);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async create(@CurrentUser('sub') userId: number, @Body() createCourseDto: CreateCourseDto) {
    const course = await this.coursesService.create(userId, createCourseDto);
    this.transformPriceToYuan(course);
    return ApiResponse.created(course, '课程创建成功');
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async update(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number, @Body() updateCourseDto: UpdateCourseDto) {
    const course = await this.coursesService.update(id, userId, updateCourseDto);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course, '课程更新成功');
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    await this.coursesService.remove(id, userId);
    return ApiResponse.success(null, '课程删除成功');
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN, Role.REVIEWER)
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: CourseStatus, @CurrentUser('sub') userId: number, @CurrentUser('role') role: Role) {
    const course = await this.coursesService.updateStatus(id, status, userId, role);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course, '课程状态更新成功');
  }

  @Post(':id/cover')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择要上传的封面图片');
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) throw new BadRequestException('仅支持 jpg/png/webp/gif 格式的图片');
    const coverUrl = await this.coursesService.uploadCover(id, userId, file);
    return ApiResponse.success({ url: coverUrl }, '封面上传成功');
  }

  @Post(':id/submit-review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async submitForReview(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    const course = await this.coursesService.submitForReview(id, userId);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course, '已提交审核');
  }

  @Post(':id/request-off-shelf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async requestOffShelf(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    const course = await this.coursesService.requestOffShelf(id, userId);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course, '下架申请已提交');
  }

  @Post(':id/review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER)
  async reviewCourse(@Param('id', ParseIntPipe) id: number, @Body('approved') approved: boolean, @Body('comment') comment: string | undefined, @CurrentUser('sub') userId: number) {
    const course = await this.coursesService.reviewCourse(id, userId, approved, comment);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course, approved ? '审核通过，课程已上架' : '课程已驳回');
  }

  @Post(':id/withdraw-review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async withdrawReview(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    const course = await this.coursesService.withdrawReview(id, userId);
    this.transformPriceToYuan(course);
    return ApiResponse.success(course, '已撤回审核申请');
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async adminRemove(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.adminRemove(id);
    return ApiResponse.success(null, '课程已强制删除');
  }

  @Patch(':id/featured')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async setFeatured(@Param('id', ParseIntPipe) id: number, @Body('isRecommended') isRecommended: boolean) {
    const course = await this.coursesService.setFeatured(id, isRecommended);
    return ApiResponse.success(course, isRecommended ? '已设为推荐课程' : '已取消推荐');
  }
}
