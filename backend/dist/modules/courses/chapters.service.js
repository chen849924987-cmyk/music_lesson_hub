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
exports.ChaptersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chapter_entity_1 = require("./entities/chapter.entity");
const course_entity_1 = require("./entities/course.entity");
const response_dto_1 = require("../../common/dto/response.dto");
let ChaptersService = class ChaptersService {
    chapterRepository;
    courseRepository;
    constructor(chapterRepository, courseRepository) {
        this.chapterRepository = chapterRepository;
        this.courseRepository = courseRepository;
    }
    async create(courseId, createChapterDto) {
        const course = await this.courseRepository.findOne({ where: { id: courseId } });
        if (!course) {
            throw response_dto_1.BusinessException.notFound('课程不存在');
        }
        const lastChapter = await this.chapterRepository.findOne({
            where: { courseId },
            order: { sortOrder: 'DESC' },
            select: ['sortOrder'],
        });
        const maxSortOrder = lastChapter?.sortOrder ?? 0;
        const chapter = this.chapterRepository.create({
            ...createChapterDto,
            courseId,
            sortOrder: (maxSortOrder ?? 0) + 1,
        });
        return this.chapterRepository.save(chapter);
    }
    async findById(id) {
        const chapter = await this.chapterRepository.findOne({
            where: { id },
            relations: ['lessons'],
            order: { lessons: { sortOrder: 'ASC' } },
        });
        if (!chapter) {
            throw response_dto_1.BusinessException.notFound('章节不存在');
        }
        return chapter;
    }
    async findByCourseId(courseId) {
        return this.chapterRepository.find({
            where: { courseId },
            relations: ['lessons'],
            order: { sortOrder: 'ASC', lessons: { sortOrder: 'ASC' } },
        });
    }
    async update(id, updateChapterDto) {
        const chapter = await this.findById(id);
        Object.assign(chapter, updateChapterDto);
        return this.chapterRepository.save(chapter);
    }
    async remove(id) {
        const chapter = await this.findById(id);
        await this.chapterRepository.remove(chapter);
    }
    async updateSortOrder(id, sortOrder) {
        const chapter = await this.findById(id);
        chapter.sortOrder = sortOrder;
        return this.chapterRepository.save(chapter);
    }
};
exports.ChaptersService = ChaptersService;
exports.ChaptersService = ChaptersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chapter_entity_1.Chapter)),
    __param(1, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChaptersService);
//# sourceMappingURL=chapters.service.js.map