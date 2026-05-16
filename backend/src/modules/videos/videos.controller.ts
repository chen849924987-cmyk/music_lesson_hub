import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';
import { PaginationMeta } from '../../common/dto/pagination.dto';

/**
 * 视频管理控制器
 * 功能描述：提供视频元数据的 RESTful API，包括视频记录的创建、查询、播放地址获取、删除等
 * 视频文件的上传通过独立的文件上传接口处理
 */
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  /**
   * 上传视频文件并创建视频记录
   * 功能描述：接收 multipart 视频文件，上传到 MinIO 存储，创建数据库记录
   * @param userId - 当前用户ID
   * @param file - 上传的视频文件（通过 Multer 中间件处理）
   * @returns 创建的视频记录
   */
  @Post('upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('sub') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的视频文件');
    }
    // 校验视频 MIME 类型
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}，仅支持 mp4/webm/ogg/mov/avi 格式`);
    }
    const video = await this.videosService.uploadFile(userId, file);
    return ApiResponse.created(video, '视频上传成功');
  }

  /**
   * 创建视频记录（上传视频后在数据库中记录元数据）
   * 目前已废弃，使用 upload 接口替代上传流程
   * @param userId - 当前用户ID
   * @param createVideoDto - 视频元数据
   * @returns 创建的视频记录
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  async create(
    @CurrentUser('sub') userId: number,
    @Body() createVideoDto: CreateVideoDto,
  ) {
    const video = await this.videosService.create(userId, createVideoDto);
    return ApiResponse.created(video, '视频记录创建成功');
  }

  /**
   * 获取当前用户的视频列表（分页）
   * @param userId - 当前用户ID
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 视频列表及总数
   */
  @Get('my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  async findMyVideos(
    @CurrentUser('sub') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    const result = await this.videosService.findByUser(
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
   * 根据ID获取视频记录
   * @param id - 视频ID
   * @returns 视频记录
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.REVIEWER, Role.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const video = await this.videosService.findOne(id);
    return ApiResponse.success(video);
  }

  /**
   * 获取视频播放地址（签名临时URL）
   * @param id - 视频ID
   * @returns 临时播放URL
   */
  @Get(':id/play-url')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.STUDENT, Role.REVIEWER, Role.SUPER_ADMIN)
  async getPlayUrl(@Param('id', ParseIntPipe) id: number) {
    const url = await this.videosService.getPlayUrl(id);
    return ApiResponse.success({ url });
  }

  /**
   * 获取视频封面地址
   * @param id - 视频ID
   * @returns 封面URL
   */
  @Get(':id/cover-url')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.STUDENT, Role.REVIEWER, Role.SUPER_ADMIN)
  async getCoverUrl(@Param('id', ParseIntPipe) id: number) {
    const url = await this.videosService.getCoverUrl(id);
    return ApiResponse.success({ url });
  }

  /**
   * 获取视频试看播放地址（公开接口，时长受 previewDuration 限制）
   * 功能描述：为未登录/未购课学员生成有时长限制的试看链接
   *          签名 URL 有效期 = previewDuration + 60 秒缓冲
   * @param id - 视频ID
   * @param previewDuration - 试看时长（秒），默认300秒，范围1~600
   * @returns 临时播放URL
   */
  @Get(':id/preview-url')
  async getPreviewUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('previewDuration', new ParseIntPipe({ optional: true })) previewDuration?: number,
  ) {
    // 校验试看时长：默认300秒，范围1~600
    const duration = previewDuration || 300;
    const validDuration = Math.max(1, Math.min(600, duration));
    // 签名 URL 有效期 = 试看时长 + 60秒额外缓冲
    const expiry = validDuration + 60;
    const url = await this.videosService.getPlayUrl(id, expiry);
    return ApiResponse.success({ url, previewDuration: validDuration });
  }

  /** 获取课程审核历史记录（接口定义在 courses controller 中） */

  /**
   * 软删除视频（仅上传者可操作）
   * @param userId - 当前用户ID
   * @param id - 视频ID
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  async remove(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.videosService.softDelete(id, userId);
    return ApiResponse.success(null, '删除成功');
  }
}
