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
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const attachments_service_1 = require("./attachments.service");
const create_attachment_dto_1 = require("./dto/create-attachment.dto");
const upload_attachment_dto_1 = require("./dto/upload-attachment.dto");
const review_attachment_dto_1 = require("./dto/review-attachment.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let AttachmentsController = class AttachmentsController {
    attachmentsService;
    constructor(attachmentsService) {
        this.attachmentsService = attachmentsService;
    }
    async create(userId, createAttachmentDto) {
        const attachment = await this.attachmentsService.create(userId, createAttachmentDto);
        return response_dto_1.ApiResponse.created(attachment, '附件记录创建成功');
    }
    async upload(userId, file, uploadDto) {
        if (!file) {
            throw new common_1.BadRequestException('请选择要上传的文件');
        }
        const maxSize = 200 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('文件大小不能超过 200MB');
        }
        const attachment = await this.attachmentsService.uploadFile(userId, file, uploadDto);
        return response_dto_1.ApiResponse.created(attachment, '附件上传成功，等待审核');
    }
    async findMyAttachments(userId, page, pageSize) {
        const result = await this.attachmentsService.findByUser(userId, page ?? 1, pageSize ?? 20);
        return response_dto_1.ApiResponse.successWithPagination(result.items, new pagination_dto_1.PaginationMeta(result.total, page ?? 1, pageSize ?? 20));
    }
    async findPending(page, pageSize) {
        const result = await this.attachmentsService.findPending(page ?? 1, pageSize ?? 20);
        return response_dto_1.ApiResponse.successWithPagination(result.items, new pagination_dto_1.PaginationMeta(result.total, page ?? 1, pageSize ?? 20));
    }
    async findPendingWithSource(page, pageSize) {
        const result = await this.attachmentsService.findPendingWithSource(page ?? 1, pageSize ?? 20);
        return response_dto_1.ApiResponse.successWithPagination(result.items, new pagination_dto_1.PaginationMeta(result.total, page ?? 1, pageSize ?? 20));
    }
    async getPendingAttachmentCount() {
        const count = await this.attachmentsService.countPending();
        return response_dto_1.ApiResponse.success({ count });
    }
    async findByCourse(courseId) {
        const attachments = await this.attachmentsService.findByCourse(courseId);
        return response_dto_1.ApiResponse.success(attachments);
    }
    async findByLesson(lessonId) {
        const attachments = await this.attachmentsService.findByLesson(lessonId);
        return response_dto_1.ApiResponse.success(attachments);
    }
    async findOne(id) {
        if (id <= 0) {
            throw new common_1.BadRequestException('附件ID必须是正整数');
        }
        const attachment = await this.attachmentsService.findOne(id);
        return response_dto_1.ApiResponse.success(attachment);
    }
    async review(id, userId, reviewDto) {
        if (id <= 0) {
            throw new common_1.BadRequestException('附件ID必须是正整数');
        }
        if (reviewDto.status === constants_1.AttachmentStatus.REJECTED && !reviewDto.reviewComment) {
            throw new common_1.BadRequestException('驳回附件时必须填写审核意见');
        }
        const attachment = await this.attachmentsService.review(id, userId, reviewDto.status, reviewDto.reviewComment);
        return response_dto_1.ApiResponse.success(attachment, '附件审核完成');
    }
    async getDownloadUrl(id) {
        if (id <= 0) {
            throw new common_1.BadRequestException('附件ID必须是正整数');
        }
        const url = await this.attachmentsService.getDownloadUrl(id);
        return response_dto_1.ApiResponse.success({ url });
    }
    async getPreviewUrl(id) {
        if (id <= 0) {
            throw new common_1.BadRequestException('附件ID必须是正整数');
        }
        const url = await this.attachmentsService.getDownloadUrl(id, false);
        return response_dto_1.ApiResponse.success({ url });
    }
    async remove(user, id) {
        if (id <= 0) {
            throw new common_1.BadRequestException('附件ID必须是正整数');
        }
        const isSuperAdmin = user.role === constants_1.Role.SUPER_ADMIN;
        if (!isSuperAdmin && user.role !== constants_1.Role.TEACHER) {
            throw new common_1.ForbiddenException('无权删除附件');
        }
        await this.attachmentsService.softDelete(id, user.sub, isSuperAdmin);
        return response_dto_1.ApiResponse.success(null, '删除成功');
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_attachment_dto_1.CreateAttachmentDto]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, upload_attachment_dto_1.UploadAttachmentDto]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "upload", null);
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
], AttachmentsController.prototype, "findMyAttachments", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(1, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findPending", null);
__decorate([
    (0, common_1.Get)('pending/with-source'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(1, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findPendingWithSource", null);
__decorate([
    (0, common_1.Get)('stats/pending-count'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "getPendingAttachmentCount", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.STUDENT, constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findByCourse", null);
__decorate([
    (0, common_1.Get)('lesson/:lessonId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.STUDENT, constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('lessonId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findByLesson", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', new common_1.ParseIntPipe({ errorHttpStatusCode: 400 }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', new common_1.ParseIntPipe({ errorHttpStatusCode: 400 }))),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, review_attachment_dto_1.ReviewAttachmentDto]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "review", null);
__decorate([
    (0, common_1.Get)(':id/download-url'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.STUDENT, constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', new common_1.ParseIntPipe({ errorHttpStatusCode: 400 }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "getDownloadUrl", null);
__decorate([
    (0, common_1.Get)(':id/preview-url'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.REVIEWER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', new common_1.ParseIntPipe({ errorHttpStatusCode: 400 }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "getPreviewUrl", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', new common_1.ParseIntPipe({ errorHttpStatusCode: 400 }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "remove", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, common_1.Controller)('attachments'),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService])
], AttachmentsController);
//# sourceMappingURL=attachments.controller.js.map