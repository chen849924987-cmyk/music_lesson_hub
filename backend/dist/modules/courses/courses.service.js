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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CoursesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const course_entity_1 = require("./entities/course.entity");
const category_entity_1 = require("./entities/category.entity");
const course_review_entity_1 = require("./entities/course-review.entity");
const user_course_entity_1 = require("./entities/user-course.entity");
const user_lesson_entity_1 = require("./entities/user-lesson.entity");
const lesson_entity_1 = require("./entities/lesson.entity");
const response_dto_1 = require("../../common/dto/response.dto");
const constants_1 = require("../../common/constants");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const storage_service_1 = require("../storage/storage.service");
const user_entity_1 = require("../users/entities/user.entity");
let CoursesService = CoursesService_1 = class CoursesService {
    courseRepository;
    categoryRepository;
    courseReviewRepository;
    userCourseRepository;
    userLessonRepository;
    lessonRepository;
    storageService;
    dataSource;
    logger = new common_1.Logger(CoursesService_1.name);
    constructor(courseRepository, categoryRepository, courseReviewRepository, userCourseRepository, userLessonRepository, lessonRepository, storageService, dataSource) {
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
        this.courseReviewRepository = courseReviewRepository;
        this.userCourseRepository = userCourseRepository;
        this.userLessonRepository = userLessonRepository;
        this.lessonRepository = lessonRepository;
        this.storageService = storageService;
        this.dataSource = dataSource;
    }
    async create(teacherId, createCourseDto) {
        if (createCourseDto.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: createCourseDto.categoryId },
            });
            if (!category) {
                throw response_dto_1.BusinessException.badRequest('分类不存在');
            }
        }
        if (createCourseDto.previewDuration && createCourseDto.previewDuration > 0) {
            if (createCourseDto.previewDuration < 1 || createCourseDto.previewDuration > 600) {
                throw response_dto_1.BusinessException.badRequest('试看时长必须在 1~600 秒之间');
            }
        }
        const rawPrice = createCourseDto.price;
        const rawOriginalPrice = createCourseDto.originalPrice;
        const course = this.courseRepository.create({
            ...createCourseDto,
            price: rawPrice ? Math.round(rawPrice * 100) : 0,
            originalPrice: rawOriginalPrice ? Math.round(rawOriginalPrice * 100) : 0,
            teacherId,
            status: constants_1.CourseStatus.DRAFT,
        });
        return this.courseRepository.save(course);
    }
    async findById(id, relations = []) {
        const course = await this.courseRepository.findOne({
            where: { id },
            relations,
        });
        if (!course) {
            throw response_dto_1.BusinessException.notFound('课程不存在');
        }
        return course;
    }
    async update(id, teacherId, updateCourseDto) {
        const course = await this.findById(id);
        if (course.teacherId !== teacherId) {
            throw response_dto_1.BusinessException.forbidden('无权编辑该课程');
        }
        if (updateCourseDto.courseType && updateCourseDto.courseType !== course.courseType) {
            throw response_dto_1.BusinessException.badRequest('课程类型创建后不可修改');
        }
        if (updateCourseDto.previewDuration && updateCourseDto.previewDuration > 0) {
            if (updateCourseDto.previewDuration < 1 || updateCourseDto.previewDuration > 600) {
                throw response_dto_1.BusinessException.badRequest('试看时长必须在 1~600 秒之间');
            }
        }
        if (updateCourseDto.price !== undefined) {
            updateCourseDto.price = Math.round(updateCourseDto.price * 100);
        }
        if (updateCourseDto.originalPrice !== undefined) {
            updateCourseDto.originalPrice = Math.round(updateCourseDto.originalPrice * 100);
        }
        if (course.status === constants_1.CourseStatus.APPROVED) {
            course.pendingEdit = true;
            if (!course.previousData) {
                const snapshot = {
                    title: course.title,
                    price: course.price,
                    originalPrice: course.originalPrice,
                    description: course.description,
                    previewDuration: course.previewDuration,
                    tags: course.tags,
                    categoryId: course.categoryId,
                    trailerVideoId: course.trailerVideoId || null,
                };
                course.previousData = JSON.stringify(snapshot);
            }
        }
        Object.assign(course, updateCourseDto);
        return this.courseRepository.save(course);
    }
    async remove(id, teacherId) {
        const course = await this.findById(id);
        if (course.teacherId !== teacherId) {
            throw response_dto_1.BusinessException.forbidden('无权删除该课程');
        }
        if (course.status === constants_1.CourseStatus.APPROVED) {
            throw response_dto_1.BusinessException.badRequest('已上架课程不允许删除，请先下架');
        }
        await this.courseRepository.remove(course);
    }
    async findPublished(queryDto) {
        const { page = 1, pageSize = 20, categoryId, courseType, keyword, sortBy = 'sortOrder', sortOrder: sortOrderParam = 'ASC', } = queryDto;
        const queryBuilder = this.courseRepository.createQueryBuilder('course')
            .leftJoinAndSelect('course.category', 'category')
            .addSelect('(SELECT COUNT(l.id) FROM lessons l WHERE l.courseId = course.id)', 'course_lessonCount')
            .where('course.status = :status', { status: constants_1.CourseStatus.APPROVED });
        if (categoryId) {
            queryBuilder.andWhere('course.categoryId = :categoryId', { categoryId });
        }
        if (courseType) {
            queryBuilder.andWhere('course.courseType = :courseType', { courseType });
        }
        if (keyword) {
            queryBuilder.andWhere('course.title LIKE :keyword', { keyword: `%${keyword}%` });
        }
        const allowedSortFields = ['sortOrder', 'createdAt', 'price', 'studentCount', 'rating'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? `course.${sortBy}` : 'course.sortOrder';
        const safeSortOrder = sortOrderParam === 'DESC' ? 'DESC' : 'ASC';
        queryBuilder
            .addOrderBy('course.isRecommended', 'DESC')
            .addOrderBy(safeSortBy, safeSortOrder);
        const total = await queryBuilder.getCount();
        const { entities, raw } = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getRawAndEntities();
        entities.forEach((entity, index) => {
            entity.lessonCount = Number(raw[index]?.course_lessonCount || 0);
        });
        const meta = new pagination_dto_1.PaginationMeta(total, page, pageSize);
        return { items: entities, meta };
    }
    async findTeacherCourses(teacherId, queryDto) {
        const { page = 1, pageSize = 20, status } = queryDto;
        const where = { teacherId };
        if (status) {
            where.status = status;
        }
        const [items, total] = await this.courseRepository.findAndCount({
            where,
            relations: ['category'],
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { createdAt: 'DESC' },
        });
        const meta = new pagination_dto_1.PaginationMeta(total, page, pageSize);
        return { items, meta };
    }
    async findAll(queryDto) {
        const { page = 1, pageSize = 20, categoryId, status, keyword, } = queryDto;
        const queryBuilder = this.courseRepository.createQueryBuilder('course')
            .leftJoinAndSelect('course.category', 'category');
        if (categoryId) {
            queryBuilder.andWhere('course.categoryId = :categoryId', { categoryId });
        }
        if (status) {
            queryBuilder.andWhere('course.status = :status', { status });
        }
        if (keyword) {
            queryBuilder.andWhere('course.title LIKE :keyword', { keyword: `%${keyword}%` });
        }
        queryBuilder.orderBy('course.createdAt', 'DESC');
        const total = await queryBuilder.getCount();
        const items = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getMany();
        const meta = new pagination_dto_1.PaginationMeta(total, page, pageSize);
        return { items, meta };
    }
    async updateStatus(id, status, userId, role) {
        const course = await this.findById(id);
        if (role === constants_1.Role.TEACHER && course.teacherId !== userId) {
            throw response_dto_1.BusinessException.forbidden('无权操作该课程');
        }
        this.validateStatusTransition(course.status, status, role);
        course.status = status;
        return this.courseRepository.save(course);
    }
    async findPendingReview(queryDto) {
        const { page = 1, pageSize = 20 } = queryDto;
        const [items, total] = await this.courseRepository.findAndCount({
            where: { status: constants_1.CourseStatus.PENDING },
            relations: ['category'],
            order: { updatedAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const meta = new pagination_dto_1.PaginationMeta(total, page, pageSize);
        return { items, meta };
    }
    async countPendingReview() {
        return this.courseRepository.count({
            where: { status: constants_1.CourseStatus.PENDING },
        });
    }
    async submitForReview(id, teacherId) {
        const course = await this.findById(id);
        if (course.teacherId !== teacherId) {
            throw response_dto_1.BusinessException.forbidden('无权操作该课程');
        }
        if (course.status !== constants_1.CourseStatus.DRAFT &&
            course.status !== constants_1.CourseStatus.REJECTED &&
            course.status !== constants_1.CourseStatus.APPROVED &&
            course.status !== constants_1.CourseStatus.OFF_SHELF) {
            throw response_dto_1.BusinessException.badRequest('当前状态的课程无法提交审核');
        }
        if (course.status === constants_1.CourseStatus.APPROVED && !course.pendingEdit) {
            throw response_dto_1.BusinessException.badRequest('请先保存修改后再提交审核');
        }
        course.status = constants_1.CourseStatus.PENDING;
        course.reviewComment = undefined;
        course.reviewerId = undefined;
        course.reviewedAt = undefined;
        return this.courseRepository.save(course);
    }
    async getCourseDiff(id) {
        const course = await this.findById(id, ['category']);
        if (!course.previousData)
            return [];
        let previous;
        try {
            previous = JSON.parse(course.previousData);
        }
        catch {
            return [];
        }
        const changes = [];
        const fieldLabels = {
            title: '课程名称',
            price: '价格',
            originalPrice: '原价',
            description: '课程简介',
            previewDuration: '试看时长',
            tags: '标签',
            categoryId: '分类',
            courseType: '课程类型',
        };
        for (const [field, label] of Object.entries(fieldLabels)) {
            if (!(field in previous))
                continue;
            const oldVal = previous[field];
            const newVal = course[field];
            if (String(oldVal) === String(newVal))
                continue;
            if (field === 'price' || field === 'originalPrice') {
                changes.push({
                    field,
                    label,
                    oldValue: `¥${(Number(oldVal) / 100).toFixed(2)}`,
                    newValue: `¥${(Number(newVal) / 100).toFixed(2)}`,
                });
            }
            else if (field === 'previewDuration') {
                changes.push({
                    field,
                    label,
                    oldValue: `${oldVal}秒`,
                    newValue: `${newVal}秒`,
                });
            }
            else if (field === 'categoryId') {
                const oldCatName = await this.getCategoryName(oldVal);
                const newCatName = course.category?.name || await this.getCategoryName(newVal);
                changes.push({
                    field,
                    label,
                    oldValue: oldCatName,
                    newValue: newCatName,
                });
            }
            else if (field === 'courseType') {
                changes.push({
                    field,
                    label,
                    oldValue: oldVal === 'series' ? '系列课程' : '单课程',
                    newValue: newVal === 'series' ? '系列课程' : '单课程',
                });
            }
            else {
                changes.push({
                    field,
                    label,
                    oldValue: String(oldVal || '(空)'),
                    newValue: String(newVal || '(空)'),
                });
            }
        }
        try {
            const lessonsWithVideo = await this.lessonRepository.find({
                where: { courseId: id },
                select: ['id', 'title', 'videoId'],
            });
            const hasAnyVideo = lessonsWithVideo.some(l => l.videoId);
            if (hasAnyVideo) {
                changes.push({
                    field: 'lessons_video',
                    label: '课时视频',
                    oldValue: `${lessonsWithVideo.length} 个课时`,
                    newValue: '请查看课程目录确认视频变更',
                });
            }
        }
        catch {
        }
        return changes;
    }
    async getCategoryName(categoryId) {
        try {
            const cat = await this.categoryRepository.findOne({
                where: { id: categoryId },
                select: ['name'],
            });
            return cat?.name || `ID:${categoryId}`;
        }
        catch {
            return `ID:${categoryId}`;
        }
    }
    async requestOffShelf(id, teacherId) {
        const course = await this.findById(id);
        if (course.teacherId !== teacherId) {
            throw response_dto_1.BusinessException.forbidden('无权操作该课程');
        }
        if (course.status !== constants_1.CourseStatus.APPROVED) {
            throw response_dto_1.BusinessException.badRequest('仅已上架课程可以申请下架');
        }
        if (course.pendingEdit) {
            throw response_dto_1.BusinessException.badRequest('课程存在待审核的编辑内容，请等待审核完成后再申请下架');
        }
        if (course.pendingOffShelf) {
            throw response_dto_1.BusinessException.badRequest('下架申请已提交，请等待审核');
        }
        course.status = constants_1.CourseStatus.PENDING;
        course.pendingOffShelf = true;
        course.reviewComment = undefined;
        course.reviewerId = undefined;
        course.reviewedAt = undefined;
        return this.courseRepository.save(course);
    }
    async withdrawReview(id, teacherId) {
        const course = await this.findById(id);
        if (course.teacherId !== teacherId) {
            throw response_dto_1.BusinessException.forbidden('无权操作该课程');
        }
        if (course.status !== constants_1.CourseStatus.PENDING) {
            throw response_dto_1.BusinessException.badRequest('仅待审核状态的课程可以撤回');
        }
        if (course.pendingOffShelf) {
            course.status = constants_1.CourseStatus.APPROVED;
            course.pendingOffShelf = false;
        }
        else if (course.pendingEdit) {
            course.status = constants_1.CourseStatus.APPROVED;
            course.pendingEdit = false;
        }
        else {
            course.status = constants_1.CourseStatus.DRAFT;
        }
        course.reviewComment = undefined;
        course.reviewerId = undefined;
        course.reviewedAt = undefined;
        return this.courseRepository.save(course);
    }
    async reviewCourse(id, reviewerId, approved, comment) {
        const course = await this.findById(id);
        if (course.status !== constants_1.CourseStatus.PENDING) {
            throw response_dto_1.BusinessException.badRequest('只有待审核状态的课程才能审核');
        }
        const previousStatus = course.status;
        let newStatus;
        if (approved) {
            if (course.pendingOffShelf) {
                course.status = constants_1.CourseStatus.OFF_SHELF;
                course.pendingOffShelf = false;
            }
            else {
                course.status = constants_1.CourseStatus.APPROVED;
                course.pendingEdit = false;
            }
            course.reviewComment = undefined;
            newStatus = course.status;
        }
        else {
            if (!comment) {
                throw response_dto_1.BusinessException.badRequest('驳回时必须填写原因');
            }
            if (course.pendingOffShelf) {
                course.status = constants_1.CourseStatus.APPROVED;
                course.pendingOffShelf = false;
            }
            else {
                course.status = constants_1.CourseStatus.REJECTED;
            }
            course.reviewComment = comment;
            newStatus = course.status;
        }
        course.reviewerId = reviewerId;
        course.reviewedAt = new Date();
        const saved = await this.courseRepository.save(course);
        try {
            const reviewRecord = this.courseReviewRepository.create({
                courseId: id,
                reviewerId,
                action: approved ? 'approved' : 'rejected',
                comment: comment || undefined,
                previousStatus,
                newStatus,
            });
            await this.courseReviewRepository.save(reviewRecord);
            this.logger.log(`审核记录已保存: courseId=${id}, action=${approved ? 'approved' : 'rejected'}`);
        }
        catch (error) {
            this.logger.warn(`审核记录保存失败: ${error.message}`);
        }
        return saved;
    }
    async getReviewHistory(courseId) {
        return this.courseReviewRepository.find({
            where: { courseId },
            order: { createdAt: 'DESC' },
        });
    }
    async setFeatured(id, isRecommended) {
        const course = await this.findById(id);
        course.isRecommended = isRecommended;
        return this.courseRepository.save(course);
    }
    async uploadCover(id, teacherId, file) {
        const course = await this.findById(id);
        if (course.teacherId !== teacherId) {
            throw response_dto_1.BusinessException.forbidden('无权操作该课程');
        }
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        const objectName = `covers/${id}/${(0, uuid_1.v4)()}${ext}`;
        await this.storageService.uploadFile(objectName, file.buffer, file.size, file.mimetype);
        course.cover = objectName;
        await this.courseRepository.save(course);
        const coverUrl = await this.storageService.getPresignedUrl(objectName, 86400);
        return coverUrl || objectName;
    }
    async transformCoverToUrl(course) {
        if (course.cover && !course.cover.startsWith('http')) {
            try {
                course.cover = await this.storageService.getPresignedUrl(course.cover, 86400);
            }
            catch {
                this.logger.warn(`获取封面签名URL失败: ${course.cover}`);
            }
        }
    }
    async adminRemove(id) {
        const course = await this.findById(id);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const manager = queryRunner.manager;
            if (course.cover && !course.cover.startsWith('http')) {
                try {
                    await this.storageService.deleteFile(course.cover);
                    this.logger.log(`课程封面文件已从 MinIO 删除: ${course.cover}`);
                }
                catch (error) {
                    this.logger.warn(`删除封面文件失败（可能文件不存在）: ${course.cover} - ${error.message}`);
                }
            }
            const chapters = await manager.query('SELECT id FROM chapters WHERE courseId = ?', [id]);
            const chapterIds = chapters.map((c) => c.id);
            let lessons;
            if (chapterIds.length > 0) {
                lessons = await manager.query('SELECT id, videoId FROM lessons WHERE courseId = ? OR chapterId IN (?)', [id, chapterIds]);
            }
            else {
                lessons = await manager.query('SELECT id, videoId FROM lessons WHERE courseId = ?', [id]);
            }
            const lessonIds = lessons.map((l) => l.id);
            const videoIdsFromLessons = lessons
                .map((l) => l.videoId)
                .filter((v) => v != null);
            if (course.trailerVideoId) {
                videoIdsFromLessons.push(course.trailerVideoId);
            }
            if (videoIdsFromLessons.length > 0) {
                const uniqueVideoIds = [...new Set(videoIdsFromLessons)];
                const videos = await manager.query('SELECT id, objectName, coverObjectName FROM videos WHERE id IN (?)', [uniqueVideoIds]);
                for (const video of videos) {
                    try {
                        await this.storageService.deleteFile(video.objectName);
                        if (video.coverObjectName) {
                            await this.storageService.deleteFile(video.coverObjectName);
                        }
                    }
                    catch (error) {
                        this.logger.warn(`删除视频文件失败（可能文件不存在）: ${video.objectName} - ${error.message}`);
                    }
                }
                await manager.query('DELETE FROM videos WHERE id IN (?)', [uniqueVideoIds]);
                this.logger.log(`已删除 ${uniqueVideoIds.length} 个视频记录`);
            }
            const attachments = await manager.query('SELECT id, objectName FROM attachments WHERE courseId = ? AND isDeleted = false', [id]);
            if (attachments.length > 0) {
                for (const att of attachments) {
                    try {
                        await this.storageService.deleteFile(att.objectName);
                    }
                    catch (error) {
                        this.logger.warn(`删除附件文件失败（可能文件不存在）: ${att.objectName} - ${error.message}`);
                    }
                }
                await manager.query('DELETE FROM attachments WHERE courseId = ?', [id]);
                this.logger.log(`已删除 ${attachments.length} 个附件记录`);
            }
            if (lessonIds.length > 0) {
                await manager.query('DELETE FROM lessons WHERE id IN (?)', [lessonIds]);
            }
            if (chapterIds.length > 0) {
                await manager.query('DELETE FROM chapters WHERE id IN (?)', [chapterIds]);
            }
            await manager.query('DELETE FROM course_reviews WHERE courseId = ?', [id]);
            await manager.query('DELETE FROM courses WHERE id = ?', [id]);
            await queryRunner.commitTransaction();
            this.logger.log(`管理端删除课程成功: id=${id}, title=${course.title}`);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`管理端删除课程失败: id=${id} - ${error.message}`, error);
            throw response_dto_1.BusinessException.internalError('删除课程失败，请稍后重试');
        }
        finally {
            await queryRunner.release();
        }
    }
    async checkUserPurchasedCourse(userId, courseId) {
        const record = await this.userCourseRepository.findOne({
            where: { userId, courseId },
        });
        return !!record;
    }
    async checkLessonAccess(userId, courseId, lessonId) {
        const course = await this.findById(courseId);
        if (userId && course.teacherId === userId) {
            return { hasAccess: true, accessType: 'full', previewDuration: 0 };
        }
        if (userId) {
            const purchased = await this.checkUserPurchasedCourse(userId, courseId);
            if (purchased) {
                return { hasAccess: true, accessType: 'full', previewDuration: 0 };
            }
            const userLesson = await this.userLessonRepository.findOne({
                where: { userId, lessonId },
            });
            if (userLesson) {
                return { hasAccess: true, accessType: 'full', previewDuration: 0 };
            }
        }
        const lesson = await this.dataSource.query('SELECT id, isFree, previewDuration, canSinglePurchase, singlePrice FROM lessons WHERE id = ? AND courseId = ?', [lessonId, courseId]);
        if (lesson.length === 0) {
            return { hasAccess: false, accessType: 'none', previewDuration: 0 };
        }
        if (lesson[0].isFree) {
            return { hasAccess: true, accessType: 'full', previewDuration: 0 };
        }
        const duration = lesson[0].previewDuration > 0 ? lesson[0].previewDuration : course.previewDuration;
        if (duration <= 0) {
            return { hasAccess: false, accessType: 'none', previewDuration: 0 };
        }
        return { hasAccess: true, accessType: 'trial', previewDuration: duration };
    }
    async addUserCourse(userId, courseId, price, orderId) {
        const existing = await this.userCourseRepository.findOne({
            where: { userId, courseId },
        });
        if (existing) {
            throw response_dto_1.BusinessException.conflict('用户已购买该课程');
        }
        const record = this.userCourseRepository.create({
            userId,
            courseId,
            price,
            orderId,
        });
        const saved = await this.userCourseRepository.save(record);
        await this.courseRepository.increment({ id: courseId }, 'studentCount', 1);
        return saved;
    }
    async findUserCourses(userId) {
        const userCourses = await this.userCourseRepository.find({
            where: { userId },
            relations: [],
        });
        const courseIds = userCourses.map((uc) => uc.courseId);
        if (courseIds.length === 0)
            return [];
        const coursesList = await this.courseRepository.find({
            where: { id: (0, typeorm_2.In)(courseIds), status: constants_1.CourseStatus.APPROVED },
            relations: ['category'],
        });
        await Promise.all(coursesList.map((item) => this.transformCoverToUrl(item)));
        return coursesList;
    }
    async getTeacherStats(teacherId) {
        const totalCourses = await this.courseRepository.count({
            where: { teacherId },
        });
        const pendingReviewCount = await this.courseRepository.count({
            where: { teacherId, status: constants_1.CourseStatus.PENDING },
        });
        const teacherCourses = await this.courseRepository.find({
            where: { teacherId },
            select: ['id'],
        });
        const courseIds = teacherCourses.map((c) => c.id);
        let totalStudents = 0;
        if (courseIds.length > 0) {
            const studentResult = await this.userCourseRepository
                .createQueryBuilder('uc')
                .select('COUNT(DISTINCT uc.userId)', 'count')
                .where('uc.courseId IN (:...courseIds)', { courseIds })
                .getRawOne();
            totalStudents = Number(studentResult?.count || 0);
        }
        let totalEarnings = 0;
        try {
            const earningResult = await this.dataSource.query('SELECT COALESCE(SUM(actual_amount), 0) as total FROM earnings WHERE teacher_id = ? AND type = ?', [teacherId, 'course_sale']);
            totalEarnings = Number(earningResult[0]?.total || 0);
        }
        catch {
            this.logger.warn('获取教师收益统计失败，可能 earnings 表尚未创建');
        }
        return {
            totalCourses,
            totalStudents,
            pendingReviewCount,
            totalEarnings,
        };
    }
    async getTeacherProducers(teacherId, page = 1, pageSize = 20) {
        const teacherCourses = await this.courseRepository.find({
            where: { teacherId },
            select: ['id', 'title'],
        });
        const courseIds = teacherCourses.map((c) => c.id);
        if (courseIds.length === 0) {
            return {
                items: [],
                meta: { total: 0, page, pageSize, totalPages: 0 },
            };
        }
        const queryBuilder = this.userCourseRepository
            .createQueryBuilder('uc')
            .leftJoin(user_entity_1.User, 'u', 'uc.userId = u.id')
            .leftJoin(course_entity_1.Course, 'c', 'uc.courseId = c.id')
            .where('uc.courseId IN (:...courseIds)', { courseIds })
            .select([
            'uc.id',
            'uc.userId',
            'uc.courseId',
            'uc.createdAt AS purchasedAt',
            'uc.price',
            'u.nickname',
            'u.avatar',
            'c.title AS courseTitle',
        ])
            .orderBy('uc.createdAt', 'DESC');
        const total = await queryBuilder.getCount();
        const items = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getRawMany();
        const formattedItems = items.map((item) => ({
            userId: item.uc_userId,
            nickname: item.u_nickname,
            avatar: item.u_avatar,
            courseId: item.uc_courseId,
            courseTitle: item.c_title,
            price: item.uc_price,
            purchasedAt: item.uc_createdAt,
        }));
        return {
            items: formattedItems,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    validateStatusTransition(currentStatus, targetStatus, role) {
        const validTransitions = {
            [constants_1.CourseStatus.DRAFT]: {
                [constants_1.CourseStatus.PENDING]: [constants_1.Role.TEACHER],
            },
            [constants_1.CourseStatus.PENDING]: {
                [constants_1.CourseStatus.APPROVED]: [constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER],
                [constants_1.CourseStatus.REJECTED]: [constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER],
            },
            [constants_1.CourseStatus.APPROVED]: {
                [constants_1.CourseStatus.OFF_SHELF]: [constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER],
                [constants_1.CourseStatus.PENDING]: [constants_1.Role.TEACHER],
            },
            [constants_1.CourseStatus.REJECTED]: {
                [constants_1.CourseStatus.DRAFT]: [constants_1.Role.TEACHER],
                [constants_1.CourseStatus.PENDING]: [constants_1.Role.TEACHER],
            },
            [constants_1.CourseStatus.OFF_SHELF]: {
                [constants_1.CourseStatus.DRAFT]: [constants_1.Role.TEACHER],
                [constants_1.CourseStatus.PENDING]: [constants_1.Role.TEACHER],
            },
        };
        const allowedRoles = validTransitions[currentStatus]?.[targetStatus];
        if (!allowedRoles) {
            throw response_dto_1.BusinessException.badRequest(`不允许从 ${currentStatus} 状态变更为 ${targetStatus} 状态`);
        }
        if (!allowedRoles.includes(role)) {
            throw response_dto_1.BusinessException.forbidden('当前角色无权执行此状态变更');
        }
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = CoursesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(course_review_entity_1.CourseReview)),
    __param(3, (0, typeorm_1.InjectRepository)(user_course_entity_1.UserCourse)),
    __param(4, (0, typeorm_1.InjectRepository)(user_lesson_entity_1.UserLesson)),
    __param(5, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        storage_service_1.StorageService,
        typeorm_2.DataSource])
], CoursesService);
//# sourceMappingURL=courses.service.js.map