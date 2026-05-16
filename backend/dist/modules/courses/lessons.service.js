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
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lesson_entity_1 = require("./entities/lesson.entity");
const chapter_entity_1 = require("./entities/chapter.entity");
const video_entity_1 = require("../videos/entities/video.entity");
const response_dto_1 = require("../../common/dto/response.dto");
let LessonsService = class LessonsService {
    lessonRepository;
    chapterRepository;
    videoRepository;
    constructor(lessonRepository, chapterRepository, videoRepository) {
        this.lessonRepository = lessonRepository;
        this.chapterRepository = chapterRepository;
        this.videoRepository = videoRepository;
    }
    async create(courseId, createLessonDto) {
        if (createLessonDto.chapterId) {
            const chapter = await this.chapterRepository.findOne({
                where: { id: createLessonDto.chapterId },
            });
            if (!chapter) {
                throw response_dto_1.BusinessException.badRequest('章节不存在');
            }
        }
        if (createLessonDto.videoId) {
            const video = await this.videoRepository.findOne({
                where: { id: createLessonDto.videoId, isDeleted: false },
            });
            if (!video) {
                throw response_dto_1.BusinessException.badRequest('关联的视频不存在');
            }
            if (!createLessonDto.duration || createLessonDto.duration === 0) {
                createLessonDto.duration = video.duration || 0;
            }
        }
        const lesson = this.lessonRepository.create({
            ...createLessonDto,
            courseId,
        });
        return this.lessonRepository.save(lesson);
    }
    async findById(id) {
        const lesson = await this.lessonRepository.findOne({
            where: { id },
            relations: ['chapter'],
        });
        if (!lesson) {
            throw response_dto_1.BusinessException.notFound('课时不存在');
        }
        return lesson;
    }
    async findByCourseId(courseId) {
        return this.lessonRepository.find({
            where: { courseId },
            order: { sortOrder: 'ASC' },
        });
    }
    async findByChapterId(chapterId) {
        return this.lessonRepository.find({
            where: { chapterId },
            order: { sortOrder: 'ASC' },
        });
    }
    async update(id, updateLessonDto) {
        const lesson = await this.findById(id);
        if (updateLessonDto.videoId && updateLessonDto.videoId > 0) {
            const video = await this.videoRepository.findOne({
                where: { id: updateLessonDto.videoId, isDeleted: false },
            });
            if (!video) {
                throw response_dto_1.BusinessException.badRequest('关联的视频不存在');
            }
            if (!updateLessonDto.duration || updateLessonDto.duration === 0) {
                updateLessonDto.duration = video.duration || 0;
            }
        }
        if (updateLessonDto.videoId === 0 || updateLessonDto.videoId === undefined || updateLessonDto.videoId === null) {
        }
        Object.assign(lesson, updateLessonDto);
        return this.lessonRepository.save(lesson);
    }
    async remove(id) {
        const lesson = await this.findById(id);
        await this.lessonRepository.remove(lesson);
    }
    async updateSortOrder(id, sortOrder) {
        const lesson = await this.findById(id);
        lesson.sortOrder = sortOrder;
        return this.lessonRepository.save(lesson);
    }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(1, (0, typeorm_1.InjectRepository)(chapter_entity_1.Chapter)),
    __param(2, (0, typeorm_1.InjectRepository)(video_entity_1.Video)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map