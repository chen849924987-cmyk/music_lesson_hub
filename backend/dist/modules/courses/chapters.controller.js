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
exports.ChaptersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const chapters_service_1 = require("./chapters.service");
const lessons_service_1 = require("./lessons.service");
const create_chapter_dto_1 = require("./dto/create-chapter.dto");
const update_chapter_dto_1 = require("./dto/update-chapter.dto");
const create_lesson_dto_1 = require("./dto/create-lesson.dto");
const update_lesson_dto_1 = require("./dto/update-lesson.dto");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
let ChaptersController = class ChaptersController {
    chaptersService;
    lessonsService;
    constructor(chaptersService, lessonsService) {
        this.chaptersService = chaptersService;
        this.lessonsService = lessonsService;
    }
    async findByCourseId(courseId) {
        const chapters = await this.chaptersService.findByCourseId(courseId);
        return response_dto_1.ApiResponse.success(chapters);
    }
    async findById(id) {
        const chapter = await this.chaptersService.findById(id);
        return response_dto_1.ApiResponse.success(chapter);
    }
    async create(courseId, createChapterDto) {
        const chapter = await this.chaptersService.create(courseId, createChapterDto);
        return response_dto_1.ApiResponse.created(chapter, '章节创建成功');
    }
    async update(id, updateChapterDto) {
        const chapter = await this.chaptersService.update(id, updateChapterDto);
        return response_dto_1.ApiResponse.success(chapter, '章节更新成功');
    }
    async remove(id) {
        await this.chaptersService.remove(id);
        return response_dto_1.ApiResponse.success(null, '章节删除成功');
    }
    async updateSortOrder(id, sortOrder) {
        const chapter = await this.chaptersService.updateSortOrder(id, sortOrder);
        return response_dto_1.ApiResponse.success(chapter, '排序更新成功');
    }
    async findLessonsByChapterId(chapterId) {
        const lessons = await this.lessonsService.findByChapterId(chapterId);
        return response_dto_1.ApiResponse.success(lessons);
    }
    async createLesson(courseId, chapterId, createLessonDto) {
        createLessonDto.chapterId = chapterId;
        const lesson = await this.lessonsService.create(courseId, createLessonDto);
        return response_dto_1.ApiResponse.created(lesson, '课时创建成功');
    }
    async updateLesson(id, updateLessonDto) {
        const lesson = await this.lessonsService.update(id, updateLessonDto);
        return response_dto_1.ApiResponse.success(lesson, '课时更新成功');
    }
    async removeLesson(id) {
        await this.lessonsService.remove(id);
        return response_dto_1.ApiResponse.success(null, '课时删除成功');
    }
};
exports.ChaptersController = ChaptersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "findByCourseId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_chapter_dto_1.CreateChapterDto]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_chapter_dto_1.UpdateChapterDto]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/sort'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "updateSortOrder", null);
__decorate([
    (0, common_1.Get)(':chapterId/lessons'),
    __param(0, (0, common_1.Param)('chapterId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "findLessonsByChapterId", null);
__decorate([
    (0, common_1.Post)(':chapterId/lessons'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('chapterId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, create_lesson_dto_1.CreateLessonDto]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "createLesson", null);
__decorate([
    (0, common_1.Put)(':chapterId/lessons/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_lesson_dto_1.UpdateLessonDto]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "updateLesson", null);
__decorate([
    (0, common_1.Delete)(':chapterId/lessons/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChaptersController.prototype, "removeLesson", null);
exports.ChaptersController = ChaptersController = __decorate([
    (0, common_1.Controller)('courses/:courseId/chapters'),
    __metadata("design:paramtypes", [chapters_service_1.ChaptersService,
        lessons_service_1.LessonsService])
], ChaptersController);
//# sourceMappingURL=chapters.controller.js.map