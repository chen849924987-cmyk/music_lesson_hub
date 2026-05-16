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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const videos_service_1 = require("./videos.service");
const create_video_dto_1 = require("./dto/create-video.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let VideosController = class VideosController {
    videosService;
    constructor(videosService) {
        this.videosService = videosService;
    }
    async upload(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException('请选择要上传的视频文件');
        }
        const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`不支持的文件类型: ${file.mimetype}，仅支持 mp4/webm/ogg/mov/avi 格式`);
        }
        const video = await this.videosService.uploadFile(userId, file);
        return response_dto_1.ApiResponse.created(video, '视频上传成功');
    }
    async create(userId, createVideoDto) {
        const video = await this.videosService.create(userId, createVideoDto);
        return response_dto_1.ApiResponse.created(video, '视频记录创建成功');
    }
    async findMyVideos(userId, page, pageSize) {
        const result = await this.videosService.findByUser(userId, page ?? 1, pageSize ?? 20);
        return response_dto_1.ApiResponse.successWithPagination(result.items, new pagination_dto_1.PaginationMeta(result.total, page ?? 1, pageSize ?? 20));
    }
    async findOne(id) {
        const video = await this.videosService.findOne(id);
        return response_dto_1.ApiResponse.success(video);
    }
    async getPlayUrl(id) {
        const url = await this.videosService.getPlayUrl(id);
        return response_dto_1.ApiResponse.success({ url });
    }
    async getCoverUrl(id) {
        const url = await this.videosService.getCoverUrl(id);
        return response_dto_1.ApiResponse.success({ url });
    }
    async getPreviewUrl(id, previewDuration) {
        const duration = previewDuration || 300;
        const validDuration = Math.max(1, Math.min(600, duration));
        const expiry = validDuration + 60;
        const url = await this.videosService.getPlayUrl(id, expiry);
        return response_dto_1.ApiResponse.success({ url, previewDuration: validDuration });
    }
    async remove(userId, id) {
        await this.videosService.softDelete(id, userId);
        return response_dto_1.ApiResponse.success(null, '删除成功');
    }
};
exports.VideosController = VideosController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_video_dto_1.CreateVideoDto]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "findMyVideos", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/play-url'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.STUDENT, constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "getPlayUrl", null);
__decorate([
    (0, common_1.Get)(':id/cover-url'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.STUDENT, constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "getCoverUrl", null);
__decorate([
    (0, common_1.Get)(':id/preview-url'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('previewDuration', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "getPreviewUrl", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "remove", null);
exports.VideosController = VideosController = __decorate([
    (0, common_1.Controller)('videos'),
    __metadata("design:paramtypes", [videos_service_1.VideosService])
], VideosController);
//# sourceMappingURL=videos.controller.js.map