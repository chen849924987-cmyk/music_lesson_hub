"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VideosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const path_1 = require("path");
const fs_1 = require("fs");
const os_1 = require("os");
const child_process_1 = require("child_process");
const video_entity_1 = require("./entities/video.entity");
const storage_service_1 = require("../storage/storage.service");
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
let VideosService = VideosService_1 = class VideosService {
    videoRepository;
    storageService;
    logger = new common_1.Logger(VideosService_1.name);
    constructor(videoRepository, storageService) {
        this.videoRepository = videoRepository;
        this.storageService = storageService;
    }
    async create(userId, createVideoDto) {
        const video = this.videoRepository.create({
            userId,
            ...createVideoDto,
        });
        const saved = await this.videoRepository.save(video);
        this.logger.log(`视频记录创建成功: id=${saved.id}, objectName=${saved.objectName}`);
        return saved;
    }
    getVideoDuration(buffer) {
        let tempDir = null;
        let tempFilePath = null;
        try {
            tempDir = (0, fs_1.mkdtempSync)((0, path_1.join)((0, os_1.tmpdir)(), 'video-probe-'));
            tempFilePath = (0, path_1.join)(tempDir, `probe_${(0, crypto_1.randomUUID)()}.mp4`);
            (0, fs_1.writeFileSync)(tempFilePath, buffer);
            const cmd = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempFilePath}"`;
            const output = (0, child_process_1.execSync)(cmd, { encoding: 'utf-8', timeout: 30000 }).trim();
            const duration = parseFloat(output);
            return isNaN(duration) ? 0 : Math.round(duration);
        }
        catch (error) {
            this.logger.warn(`ffprobe 提取视频时长失败: ${error.message}`);
            return 0;
        }
        finally {
            if (tempFilePath) {
                try {
                    (0, fs_1.unlinkSync)(tempFilePath);
                }
                catch { }
            }
            if (tempDir) {
                try {
                    (0, fs_1.unlinkSync)(tempDir);
                }
                catch { }
            }
        }
    }
    async uploadFile(userId, file) {
        try {
            const ext = (0, path_1.extname)(file.originalname);
            const objectName = `videos/${userId}/${(0, crypto_1.randomUUID)()}${ext}`;
            await this.storageService.uploadFile(objectName, file.buffer, file.size, file.mimetype);
            const duration = this.getVideoDuration(file.buffer);
            this.logger.log(`视频时长提取结果: duration=${duration}s, name=${file.originalname}`);
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
        }
        catch (error) {
            this.logger.error(`视频文件上传失败: userId=${userId}, name=${file.originalname}`, error);
            if (error instanceof Error && 'objectName' in error) {
                await this.storageService.deleteFile(error.objectName).catch(() => { });
            }
            throw new common_1.InternalServerErrorException('视频文件上传失败，请稍后重试');
        }
    }
    async findOne(id) {
        const video = await this.videoRepository.findOne({
            where: { id, isDeleted: false },
        });
        if (!video) {
            throw new common_1.NotFoundException(`视频记录不存在: id=${id}`);
        }
        return video;
    }
    async findByUser(userId, page = 1, pageSize = 20) {
        const [items, total] = await this.videoRepository.findAndCount({
            where: { userId, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total };
    }
    async getPlayUrl(id, expiry = 3600) {
        const video = await this.findOne(id);
        return this.storageService.getPresignedUrl(video.objectName, expiry);
    }
    async getCoverUrl(id, expiry = 3600) {
        const video = await this.findOne(id);
        if (!video.coverObjectName) {
            return '';
        }
        return this.storageService.getPresignedUrl(video.coverObjectName, expiry);
    }
    async updateTranscodeStatus(id, transcodeStatus, transcodeOutputs) {
        const updateData = { transcodeStatus };
        if (transcodeOutputs !== undefined) {
            updateData.transcodeOutputs = transcodeOutputs;
        }
        await this.videoRepository.update(id, updateData);
        this.logger.log(`视频转码状态更新: id=${id}, status=${transcodeStatus}`);
    }
    async updateCover(id, coverObjectName) {
        await this.videoRepository.update(id, { coverObjectName });
        this.logger.log(`视频封面更新: id=${id}, cover=${coverObjectName}`);
    }
    async softDelete(id, userId) {
        const video = await this.findOne(id);
        if (video.userId !== userId) {
            throw new common_1.NotFoundException('无权操作此视频');
        }
        await this.videoRepository.update(id, { isDeleted: true });
        this.logger.log(`视频已软删除: id=${id}`);
    }
    async hardDelete(id) {
        const video = await this.findOne(id);
        await this.storageService.deleteFile(video.objectName);
        if (video.coverObjectName) {
            await this.storageService.deleteFile(video.coverObjectName);
        }
        await this.videoRepository.delete(id);
        this.logger.log(`视频已物理删除: id=${id}`);
    }
};
exports.VideosService = VideosService;
exports.VideosService = VideosService = VideosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(video_entity_1.Video)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        storage_service_1.StorageService])
], VideosService);
//# sourceMappingURL=videos.service.js.map