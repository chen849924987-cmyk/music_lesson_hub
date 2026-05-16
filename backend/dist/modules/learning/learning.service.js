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
var LearningService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const learning_progress_entity_1 = require("./entities/learning-progress.entity");
let LearningService = LearningService_1 = class LearningService {
    progressRepository;
    logger = new common_1.Logger(LearningService_1.name);
    constructor(progressRepository) {
        this.progressRepository = progressRepository;
    }
    async updateProgress(userId, dto) {
        const { lessonId, courseId, lastPosition, duration, progress } = dto;
        let record = await this.progressRepository.findOne({
            where: { userId, lessonId },
        });
        const calcProgress = progress ??
            (duration > 0
                ? Math.round((Math.min(lastPosition, duration) / duration) * 1000) / 10
                : 0);
        const finalProgress = Math.min(100, Math.max(0, calcProgress));
        const isCompleted = finalProgress >= 95;
        if (record) {
            if (lastPosition > record.lastPosition) {
                record.lastPosition = lastPosition;
                record.progress = finalProgress;
                record.duration = duration;
                if (isCompleted && !record.completed) {
                    record.completed = true;
                    record.completedAt = new Date();
                }
            }
            return this.progressRepository.save(record);
        }
        try {
            record = this.progressRepository.create({
                userId,
                courseId,
                lessonId,
                lastPosition,
                duration,
                progress: finalProgress,
                completed: isCompleted,
                completedAt: isCompleted ? new Date() : null,
                playCount: 1,
            });
            return await this.progressRepository.save(record);
        }
        catch (err) {
            if (err?.code === 'ER_DUP_ENTRY') {
                const existing = await this.progressRepository.findOne({
                    where: { userId, lessonId },
                });
                if (existing && lastPosition > existing.lastPosition) {
                    existing.lastPosition = lastPosition;
                    existing.progress = finalProgress;
                    existing.duration = duration;
                    if (isCompleted && !existing.completed) {
                        existing.completed = true;
                        existing.completedAt = new Date();
                    }
                    return this.progressRepository.save(existing);
                }
                return existing;
            }
            throw err;
        }
    }
    async getLessonProgress(userId, lessonId) {
        return this.progressRepository.findOne({
            where: { userId, lessonId },
        });
    }
    async getCourseProgress(userId, courseId) {
        const records = await this.progressRepository.find({
            where: { userId, courseId },
        });
        const totalLessons = records.length;
        const completedLessons = records.filter((r) => r.completed).length;
        const startedLessons = records.filter((r) => r.progress > 0).length;
        const progress = totalLessons > 0
            ? Math.round((records.reduce((sum, r) => sum + Number(r.progress), 0) /
                totalLessons) *
                10) / 10
            : 0;
        return { totalLessons, completedLessons, startedLessons, progress };
    }
    async getCourseLessonProgresses(userId, courseId) {
        return this.progressRepository.find({
            where: { userId, courseId },
            select: [
                'id',
                'lessonId',
                'progress',
                'lastPosition',
                'completed',
                'duration',
            ],
        });
    }
};
exports.LearningService = LearningService;
exports.LearningService = LearningService = LearningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(learning_progress_entity_1.LearningProgress)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LearningService);
//# sourceMappingURL=learning.service.js.map