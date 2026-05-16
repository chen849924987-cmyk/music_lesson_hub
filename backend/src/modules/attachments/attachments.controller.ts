import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { ReviewAttachmentDto } from './dto/review-attachment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, AttachmentStatus } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';
import { PaginationMeta } from '../../common/dto/pagination.dto';

/**
 * 附件管理控制器
 * 功能描述：提供课程附件（课件、乐谱等）的 RESTful API，包括附件记录创建、查询、下载、审核、删除等
 * 附件文件的上传通过独立的文件上传接口处理
 */
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  /**
   * 创建附件记录（上传附件后在数据库中记录元数据）
   * @param userId - 当前用户ID
   * @param createAttachmentDto - 附件元数据
   * @returns 创建的附件记录
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  async create(
    @CurrentUser('sub') userId: number,
    @Body() createAttachmentDto: CreateAttachmentDto,
  ) {
    const attachment = await this.attachmentsService.create(userId, createAttachmentDto);
    return ApiResponse.created(attachment, '附件记录创建成功');
  }

  /**
   * 上传附件文件（支持 multipart/form-data 文件上传）
   * 功能描述：接收文件 + 元数据，上传至 MinIO 并创建数据库记录（初始状态为待审核）
   * @param userId - 当前用户ID
   * @param file - 上传的文件（通过 @UploadedFile() 注入）
   * @param uploadDto - 上传元数据（课程ID、附件类型等）
   * @returns 创建的附件记录
   */
  @Post('upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('sub') userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadAttachmentDto,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    // 校验文件大小（限制 200MB）
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过 200MB');
    }
    const attachment = await this.attachmentsService.uploadFile(userId, file, uploadDto);
    return ApiResponse.created(attachment, '附件上传成功，等待审核');
  }

  /**
   * 获取当前用户的附件列表（分页）
   * @param userId - 当前用户ID
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 附件列表及总数
   */
  @Get('my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  async findMyAttachments(
    @CurrentUser('sub') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    const result = await this.attachmentsService.findByUser(
      userId,
      page ?? 1,
      pageSize ?? 20,
    );
    return ApiResponse.successWithPagination(
      result.items,
      new PaginationMeta(result.total, page ?? 1, pageSize ?? 20),
    );
  }

  /**
   * 获取待审核的附件列表（分页，审核员/管理员使用）
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 待审核附件列表及总数
   */
  @Get('pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.REVIEWER, Role.SUPER_ADMIN)
  async findPending(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    const result = await this.attachmentsService.findPending(
      page ?? 1,
      pageSize ?? 20,
    );
    return ApiResponse.successWithPagination(
      result.items,
      new PaginationMeta(result.total, page ?? 1, pageSize ?? 20),
    );
  }

  /**
   * 获取待审核附件列表（带来源信息，审核/管理员使用）
   * 功能描述：联查 courses 表获取课程标题和类型，联查 lessons 表获取课时标题，
   *          用于在附件审核页面上标注来源：单课程/系列课程/系列课程下的某课时
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 带来源信息的待审核附件列表及总数
   */
  @Get('pending/with-source')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.REVIEWER, Role.SUPER_ADMIN)
  async findPendingWithSource(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    const result = await this.attachmentsService.findPendingWithSource(
      page ?? 1,
      pageSize ?? 20,
    );
    return ApiResponse.successWithPagination(
      result.items,
      new PaginationMeta(result.total, page ?? 1, pageSize ?? 20),
    );
  }

  /**
   * 获取待审核附件数量（审核员控制台用）
   * GET /api/v1/attachments/stats/pending-count
   */
  @Get('stats/pending-count')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.REVIEWER, Role.SUPER_ADMIN)
  async getPendingAttachmentCount() {
    const count = await this.attachmentsService.countPending();
    return ApiResponse.success({ count });
  }

  /**
   * 获取指定课程的所有附件列表
   * @param courseId - 课程ID
   * @returns 附件列表
   */
  @Get('course/:courseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.STUDENT, Role.REVIEWER, Role.SUPER_ADMIN)
  async findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    const attachments = await this.attachmentsService.findByCourse(courseId);
    return ApiResponse.success(attachments);
  }

  /**
   * 获取指定课时的所有附件列表
   * @param lessonId - 课时ID
   * @returns 附件列表
   */
  @Get('lesson/:lessonId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.STUDENT, Role.REVIEWER, Role.SUPER_ADMIN)
  async findByLesson(@Param('lessonId', ParseIntPipe) lessonId: number) {
    const attachments = await this.attachmentsService.findByLesson(lessonId);
    return ApiResponse.success(attachments);
  }

  /**
   * 根据ID获取附件详情（必须放在静态路由之后，避免 'my'/'pending' 被 :id 捕获）
   * @param id - 附件ID（必须是正整数）
   * @returns 附件记录
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.REVIEWER, Role.SUPER_ADMIN)
  async findOne(@Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number) {
    if (id <= 0) {
      throw new BadRequestException('附件ID必须是正整数');
    }
    const attachment = await this.attachmentsService.findOne(id);
    return ApiResponse.success(attachment);
  }

  /**
   * 审核附件（通过/驳回）
   * @param id - 附件ID（必须是正整数）
   * @param userId - 当前审核员ID
   * @param reviewDto - 审核参数（status + reviewComment），由 ValidationPipe 自动校验
   * @returns 更新后的附件记录
   */
  @Patch(':id/review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.REVIEWER, Role.SUPER_ADMIN)
  async review(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @CurrentUser('sub') userId: number,
    @Body() reviewDto: ReviewAttachmentDto,
  ) {
    // 校验ID为正整数
    if (id <= 0) {
      throw new BadRequestException('附件ID必须是正整数');
    }
    // 校验驳回时必须提供审核意见
    if (reviewDto.status === AttachmentStatus.REJECTED && !reviewDto.reviewComment) {
      throw new BadRequestException('驳回附件时必须填写审核意见');
    }
    const attachment = await this.attachmentsService.review(
      id,
      userId,
      reviewDto.status as AttachmentStatus.APPROVED | AttachmentStatus.REJECTED,
      reviewDto.reviewComment,
    );
    return ApiResponse.success(attachment, '附件审核完成');
  }

  /**
   * 获取附件下载地址（签名URL，有时效性）
   * 功能描述：需要附件已审核通过（状态为 APPROVED），普通学员和教师使用此接口
   * @param id - 附件ID（必须是正整数）
   * @returns 临时下载URL
   */
  @Get(':id/download-url')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.STUDENT, Role.REVIEWER, Role.SUPER_ADMIN)
  async getDownloadUrl(@Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number) {
    if (id <= 0) {
      throw new BadRequestException('附件ID必须是正整数');
    }
    const url = await this.attachmentsService.getDownloadUrl(id);
    return ApiResponse.success({ url });
  }

  /**
   * 获取附件预览地址（审核专用，不要求审核状态）
   * 功能描述：审核员/管理员在审核附件时预览文件内容，不校验附件是否已审核通过
   *          （因为预览时附件还处于待审核状态）
   * @param id - 附件ID（必须是正整数）
   * @returns 临时预览URL
   */
  @Get(':id/preview-url')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.REVIEWER, Role.SUPER_ADMIN)
  async getPreviewUrl(@Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number) {
    if (id <= 0) {
      throw new BadRequestException('附件ID必须是正整数');
    }
    const url = await this.attachmentsService.getDownloadUrl(id, false);
    return ApiResponse.success({ url });
  }

  /**
   * 软删除附件（仅上传者和管理员可操作）
   * @param user - 当前用户信息（含 id、角色）
   * @param id - 附件ID（必须是正整数）
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    if (id <= 0) {
      throw new BadRequestException('附件ID必须是正整数');
    }
    // 判断是否为超级管理员，管理员可删除任何附件
    const isSuperAdmin = user.role === Role.SUPER_ADMIN;
    // 如果不是管理员，必须确保是自己的附件（service中会校验userId）
    if (!isSuperAdmin && user.role !== Role.TEACHER) {
      throw new ForbiddenException('无权删除附件');
    }
    await this.attachmentsService.softDelete(id, user.sub, isSuperAdmin);
    return ApiResponse.success(null, '删除成功');
  }
}
