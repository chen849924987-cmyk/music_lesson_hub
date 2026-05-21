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
var EvaluationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_entity_1 = require("./entities/evaluation.entity");
const course_entity_1 = require("./entities/course.entity");
const user_course_entity_1 = require("./entities/user-course.entity");
const response_dto_1 = require("../../common/dto/response.dto");
let EvaluationsService = EvaluationsService_1 = class EvaluationsService {
    evaluationRepository;
    courseRepository;
    userCourseRepository;
    logger = new common_1.Logger(EvaluationsService_1.name);
    constructor(evaluationRepository, courseRepository, userCourseRepository) {
        this.evaluationRepository = evaluationRepository;
        this.courseRepository = courseRepository;
        this.userCourseRepository = userCourseRepository;
    }
    async create(courseId, userId, createEvaluationDto) {
        const course = await this.courseRepository.findOne({
            where: { id: courseId },
        });
        if (!course) {
            throw response_dto_1.BusinessException.notFound('课程不存在');
        }
        const existing = await this.evaluationRepository.findOne({
            where: { courseId, userId },
        });
        if (existing) {
            throw response_dto_1.BusinessException.conflict('您已评价过该课程，不能重复评价');
        }
        const purchased = await this.userCourseRepository.findOne({
            where: { userId, courseId },
        });
        const evaluation = this.evaluationRepository.create({
            courseId,
            userId,
            rating: createEvaluationDto.rating,
            content: createEvaluationDto.content,
            isPurchased: !!purchased,
        });
        const saved = await this.evaluationRepository.save(evaluation);
        await this.syncCourseRating(courseId);
        return saved;
    }
    async reply(evaluationId, teacherId, replyDto) {
        const evaluation = await this.evaluationRepository.findOne({
            where: { id: evaluationId },
            relations: ['course'],
        });
        if (!evaluation) {
            throw response_dto_1.BusinessException.notFound('评价不存在');
        }
        if (evaluation.course.teacherId !== teacherId) {
            throw response_dto_1.BusinessException.forbidden('仅课程教师可回复评价');
        }
        if (evaluation.replyContent) {
            throw response_dto_1.BusinessException.conflict('您已回复过该评价');
        }
        evaluation.replyContent = replyDto.replyContent;
        evaluation.repliedAt = new Date();
        return this.evaluationRepository.save(evaluation);
    }
    async findByCourse(courseId, page = 1, pageSize = 20) {
        const [items, total] = await this.evaluationRepository.findAndCount({
            where: { courseId, isVisible: true },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return {
            items,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async findByUser(userId, page = 1, pageSize = 20) {
        const [items, total] = await this.evaluationRepository.findAndCount({
            where: { userId },
            relations: ['course'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return {
            items,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async checkUserEvaluated(courseId, userId) {
        const evaluation = await this.evaluationRepository.findOne({
            where: { courseId, userId },
        });
        if (evaluation) {
            return { evaluated: true, evaluation };
        }
        return { evaluated: false };
    }
    async syncCourseRating(courseId) {
        try {
            const result = await this.evaluationRepository
                .createQueryBuilder('e')
                .select('AVG(e.rating)', 'avgRating')
                .addSelect('COUNT(e.id)', 'count')
                .where('e.courseId = :courseId', { courseId })
                .andWhere('e.isVisible = true')
                .andWhere('e.isPurchased = true')
                .getRawOne();
            const avgRating = Number(result?.avgRating || 0);
            const reviewCount = Number(result?.count || 0);
            await this.courseRepository.update(courseId, {
                rating: Math.round(avgRating * 100) / 100,
                reviewCount,
            });
            this.logger.log(`课程评分已同步: courseId=${courseId}, avgRating=${avgRating}, reviewCount=${reviewCount}`);
        }
        catch (error) {
            this.logger.error(`同步课程评分失败: courseId=${courseId}`, error);
        }
    }
};
exports.EvaluationsService = EvaluationsService;
exports.EvaluationsService = EvaluationsService = EvaluationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_entity_1.Evaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(2, (0, typeorm_1.InjectRepository)(user_course_entity_1.UserCourse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EvaluationsService);
//# sourceMappingURL=evaluations.service.js.map