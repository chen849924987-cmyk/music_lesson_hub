import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { Video } from './entities/video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { StorageService } from '../storage/storage.service';

/**
 * ffprobe 可执行文件路径（由 @ffprobe-installer/ffprobe 提供）
 */
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

/**
 * 视频管理服务
 * 功能描述：提供视频元数据的 CRUD 操作，支持视频上传后的记录创建、播放地址获取、软删除等功能
 * 视频文件的上传与存储由 StorageService（MinIO）处理，本服务仅管理数据库中的元数据
 */
@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * 创建视频记录（上传视频文件后在数据库中记录元数据）
   * @param userId - 上传者用户ID
   * @param createVideoDto - 视频元数据
   * @returns 创建的视频记录
   */
  async create(userId: number, createVideoDto: CreateVideoDto): Promise<Video> {
    const video = this.videoRepository.create({
      userId,
      ...createVideoDto,
    });
    const saved = await this.videoRepository.save(video);
    this.logger.log(`视频记录创建成功: id=${saved.id}, objectName=${saved.objectName}`);
    return saved;
  }

  /**
   * 使用 ffprobe 提取视频时长（秒）
   * 功能描述：将文件缓冲区写入临时文件，通过 ffprobe 命令读取视频元数据中的时长信息
   * @param buffer - 视频文件缓冲区
   * @returns 视频时长（秒），提取失败时返回 0
   */
  private getVideoDuration(buffer: Buffer): number {
    let tempDir: string | null = null;
    let tempFilePath: string | null = null;
    try {
      // 创建临时目录存放视频文件
      tempDir = mkdtempSync(join(tmpdir(), 'video-probe-'));
      tempFilePath = join(tempDir, `probe_${randomUUID()}.mp4`);
      writeFileSync(tempFilePath, buffer);

      // 使用 ffprobe 读取视频时长（格式: seconds.microseconds）
      const cmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 }).trim();
      const duration = parseFloat(output);
      return isNaN(duration) ? 0 : Math.round(duration);
    } catch (error) {
      this.logger.warn(`ffprobe 提取视频时长失败: ${(error as Error).message}`);
      return 0;
    } finally {
      // 清理临时文件
      if (tempFilePath) {
        try { unlinkSync(tempFilePath); } catch { /* ignore */ }
      }
      if (tempDir) {
        try { unlinkSync(tempDir); } catch { /* ignore */ }
      }
    }
  }

  /**
   * 上传视频文件到 MinIO 并创建数据库记录
   * 功能描述：接收 Express.Multer.File 对象，将视频文件上传到 MinIO 的 videos/ 目录下，
   * 生成唯一文件名并使用 ffprobe 自动提取视频时长，创建对应的视频数据库记录
   * @param userId - 上传者用户ID
   * @param file - Express.Multer.File 对象（由 @UploadedFile() 注入）
   * @returns 创建的视频记录（含 MinIO 路径信息、视频时长）
   * @throws InternalServerErrorException 当文件上传或数据库保存失败时抛出
   */
  async uploadFile(userId: number, file: Express.Multer.File): Promise<Video> {
    try {
      // 生成唯一对象名称：videos/{userId}/{uuid}{ext}
      const ext = extname(file.originalname);
      const objectName = `videos/${userId}/${randomUUID()}${ext}`;

      // 上传文件到 MinIO
      await this.storageService.uploadFile(
        objectName,
        file.buffer,
        file.size,
        file.mimetype,
      );

      // 使用 ffprobe 自动提取视频时长
      const duration = this.getVideoDuration(file.buffer);
      this.logger.log(`视频时长提取结果: duration=${duration}s, name=${file.originalname}`);

      // 创建数据库记录（含自动获取的时长）
      const video = this.videoRepository.create({
        userId,
        originalName: file.originalname,
        objectName,
        fileSize: file.size,
        mimeType: file.mimetype,
        duration,
      });
      const saved = await this.videoRepository.save(video);
      this.logger.log(`视频文件上传成功: id=${saved.id}, objectName=${objectName}, size=${file.size}, duration=${duration}`);
      return saved;
    } catch (error) {
      this.logger.error(`视频文件上传失败: userId=${userId}, name=${file.originalname}`, error);
      // 如果已上传到 MinIO 但保存数据库失败，尝试清理已上传的文件
      if (error instanceof Error && 'objectName' in (error as any)) {
        await this.storageService.deleteFile((error as any).objectName).catch(() => {});
      }
      throw new InternalServerErrorException('视频文件上传失败，请稍后重试');
    }
  }

  /**
   * 根据ID查询视频记录
   * @param id - 视频ID
   * @returns 视频记录
   * @throws NotFoundException 当视频不存在或已被删除时抛出
   */
  async findOne(id: number): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!video) {
      throw new NotFoundException(`视频记录不存在: id=${id}`);
    }
    return video;
  }

  /**
   * 获取用户上传的视频列表（分页）
   * @param userId - 用户ID
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 视频列表及总数
   */
  async findByUser(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: Video[]; total: number }> {
    const [items, total] = await this.videoRepository.findAndCount({
      where: { userId, isDeleted: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  /**
   * 获取视频的播放地址（签名URL，有时效性）
   * @param id - 视频ID
   * @param expiry - 签名过期时间（秒），默认3600
   * @returns 临时播放URL
   */
  async getPlayUrl(id: number, expiry: number = 3600): Promise<string> {
    const video = await this.findOne(id);
    return this.storageService.getPresignedUrl(video.objectName, expiry);
  }

  /**
   * 获取视频封面图片的访问地址
   * @param id - 视频ID
   * @param expiry - 签名过期时间（秒），默认3600
   * @returns 封面图片临时URL，若无封面则返回空字符串
   */
  async getCoverUrl(id: number, expiry: number = 3600): Promise<string> {
    const video = await this.findOne(id);
    if (!video.coverObjectName) {
      return '';
    }
    return this.storageService.getPresignedUrl(video.coverObjectName, expiry);
  }

  /**
   * 更新视频转码状态
   * @param id - 视频ID
   * @param transcodeStatus - 转码状态
   * @param transcodeOutputs - 转码输出文件路径（JSON 字符串，可选）
   */
  async updateTranscodeStatus(
    id: number,
    transcodeStatus: string,
    transcodeOutputs?: string,
  ): Promise<void> {
    const updateData: Partial<Video> = { transcodeStatus };
    if (transcodeOutputs !== undefined) {
      updateData.transcodeOutputs = transcodeOutputs;
    }
    await this.videoRepository.update(id, updateData);
    this.logger.log(`视频转码状态更新: id=${id}, status=${transcodeStatus}`);
  }

  /**
   * 更新视频封面
   * @param id - 视频ID
   * @param coverObjectName - 封面图在 MinIO 中的存储路径
   */
  async updateCover(id: number, coverObjectName: string): Promise<void> {
    await this.videoRepository.update(id, { coverObjectName });
    this.logger.log(`视频封面更新: id=${id}, cover=${coverObjectName}`);
  }

  /**
   * 软删除视频记录
   * @param id - 视频ID
   * @param userId - 操作用户ID（仅允许上传者操作）
   */
  async softDelete(id: number, userId: number): Promise<void> {
    const video = await this.findOne(id);
    if (video.userId !== userId) {
      throw new NotFoundException('无权操作此视频');
    }
    await this.videoRepository.update(id, { isDeleted: true });
    this.logger.log(`视频已软删除: id=${id}`);
  }

  /**
   * 物理删除视频及其存储文件
   * @param id - 视频ID
   */
  async hardDelete(id: number): Promise<void> {
    const video = await this.findOne(id);
    // 从 MinIO 删除视频文件
    await this.storageService.deleteFile(video.objectName);
    // 如果有封面，也一并删除
    if (video.coverObjectName) {
      await this.storageService.deleteFile(video.coverObjectName);
    }
    // 删除数据库记录
    await this.videoRepository.delete(id);
    this.logger.log(`视频已物理删除: id=${id}`);
  }
}
