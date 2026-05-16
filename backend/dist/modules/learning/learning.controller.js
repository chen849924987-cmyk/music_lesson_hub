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
var LearningController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const learning_service_1 = require("./learning.service");
const update_progress_dto_1 = require("./dto/update-progress.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let LearningController = LearningController_1 = class LearningController {
    learningService;
    logger = new common_1.Logger(LearningController_1.name);
    constructor(learningService) {
        this.learningService = learningService;
    }
    async updateProgress(userId, dto) {
        const record = await this.learningService.updateProgress(userId, dto);
        return {
            id: record.id,
            lessonId: record.lessonId,
            progress: Number(record.progress),
            lastPosition: Number(record.lastPosition),
            completed: record.completed,
            completedAt: record.completedAt,
        };
    }
    async getLessonProgress(userId, lessonId) {
        const record = await this.learningService.getLessonProgress(userId, lessonId);
        if (!record) {
            return {
                lessonId,
                progress: 0,
                lastPosition: 0,
                completed: false,
                completedAt: null,
            };
        }
        return {
            id: record.id,
            lessonId: record.lessonId,
            progress: Number(record.progress),
            lastPosition: Number(record.lastPosition),
            completed: record.completed,
            completedAt: record.completedAt,
        };
    }
    async getCourseProgress(userId, courseId) {
        return this.learningService.getCourseProgress(userId, courseId);
    }
    async getCourseLessonProgresses(userId, courseId) {
        const records = await this.learningService.getCourseLessonProgresses(userId, courseId);
        return records.map((r) => ({
            lessonId: r.lessonId,
            progress: Number(r.progress),
            lastPosition: Number(r.lastPosition),
            completed: r.completed,
        }));
    }
};
exports.LearningController = LearningController;
__decorate([
    (0, common_1.Post)('progress'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_progress_dto_1.UpdateProgressDto]),
    __metadata("design:returntype", Promise)
], LearningController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Get)('progress/:lessonId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('lessonId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], LearningController.prototype, "getLessonProgress", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], LearningController.prototype, "getCourseProgress", null);
__decorate([
    (0, common_1.Get)('course/:courseId/lessons'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], LearningController.prototype, "getCourseLessonProgresses", null);
exports.LearningController = LearningController = LearningController_1 = __decorate([
    (0, common_1.Controller)('learning'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [learning_service_1.LearningService])
], LearningController);
//# sourceMappingURL=learning.controller.js.map