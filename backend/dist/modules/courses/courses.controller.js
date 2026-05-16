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
exports.CoursesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const courses_service_1 = require("./courses.service");
const create_course_dto_1 = require("./dto/create-course.dto");
const update_course_dto_1 = require("./dto/update-course.dto");
const course_query_dto_1 = require("./dto/course-query.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const optional_jwt_guard_1 = require("../../common/guards/optional-jwt.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
let CoursesController = class CoursesController {
    coursesService;
    constructor(coursesService) {
        this.coursesService = coursesService;
    }
    transformPriceToYuan(course) {
        if (course.price !== undefined && course.price !== null)
            course.price = course.price / 100;
        if (course.originalPrice !== undefined && course.originalPrice !== null)
            course.originalPrice = course.originalPrice / 100;
    }
    transformPriceListToYuan(items) {
        items.forEach((item) => this.transformPriceToYuan(item));
    }
    async findPublished(queryDto) {
        const result = await this.coursesService.findPublished(queryDto);
        await Promise.all(result.items.map((item) => this.coursesService.transformCoverToUrl(item)));
        this.transformPriceListToYuan(result.items);
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async findMyCourses(userId, queryDto) {
        const result = await this.coursesService.findTeacherCourses(userId, queryDto);
        await Promise.all(result.items.map((item) => this.coursesService.transformCoverToUrl(item)));
        this.transformPriceListToYuan(result.items);
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async getTeacherStats(userId) {
        const stats = await this.coursesService.getTeacherStats(userId);
        return response_dto_1.ApiResponse.success({ totalCourses: stats.totalCourses, totalStudents: stats.totalStudents, pendingReviewCount: stats.pendingReviewCount, totalEarnings: stats.totalEarnings / 100 });
    }
    async getTeacherProducers(userId, page, pageSize) {
        const result = await this.coursesService.getTeacherProducers(userId, page || 1, pageSize || 20);
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async findAll(queryDto) {
        const result = await this.coursesService.findAll(queryDto);
        await Promise.all(result.items.map((item) => this.coursesService.transformCoverToUrl(item)));
        this.transformPriceListToYuan(result.items);
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async findByIdAdmin(id) {
        const course = await this.coursesService.findById(id, ['category', 'chapters', 'chapters.lessons']);
        await this.coursesService.transformCoverToUrl(course);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course);
    }
    async findPendingReview(queryDto) {
        const result = await this.coursesService.findPendingReview(queryDto);
        await Promise.all(result.items.map((item) => this.coursesService.transformCoverToUrl(item)));
        this.transformPriceListToYuan(result.items);
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async getPendingCourseCount() {
        const count = await this.coursesService.countPendingReview();
        return response_dto_1.ApiResponse.success({ count });
    }
    async getMyPurchasedCourses(userId) {
        const courses = await this.coursesService.findUserCourses(userId);
        this.transformPriceListToYuan(courses);
        return response_dto_1.ApiResponse.success(courses);
    }
    async getCourseDiff(id) {
        const diff = await this.coursesService.getCourseDiff(id);
        return response_dto_1.ApiResponse.success(diff);
    }
    async findById(id) {
        const course = await this.coursesService.findById(id, ['category', 'chapters', 'chapters.lessons']);
        await this.coursesService.transformCoverToUrl(course);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course);
    }
    async getReviewHistory(id) {
        const reviews = await this.coursesService.getReviewHistory(id);
        return response_dto_1.ApiResponse.success(reviews);
    }
    async checkPurchaseStatus(id, userId) {
        const purchased = await this.coursesService.checkUserPurchasedCourse(userId, id);
        return response_dto_1.ApiResponse.success({ purchased });
    }
    async checkLessonAccess(courseId, lessonId, userId) {
        const access = await this.coursesService.checkLessonAccess(userId || null, courseId, lessonId);
        return response_dto_1.ApiResponse.success(access);
    }
    async create(userId, createCourseDto) {
        const course = await this.coursesService.create(userId, createCourseDto);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.created(course, '课程创建成功');
    }
    async update(id, userId, updateCourseDto) {
        const course = await this.coursesService.update(id, userId, updateCourseDto);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course, '课程更新成功');
    }
    async remove(id, userId) {
        await this.coursesService.remove(id, userId);
        return response_dto_1.ApiResponse.success(null, '课程删除成功');
    }
    async updateStatus(id, status, userId, role) {
        const course = await this.coursesService.updateStatus(id, status, userId, role);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course, '课程状态更新成功');
    }
    async uploadCover(id, userId, file) {
        if (!file)
            throw new common_1.BadRequestException('请选择要上传的封面图片');
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype))
            throw new common_1.BadRequestException('仅支持 jpg/png/webp/gif 格式的图片');
        const coverUrl = await this.coursesService.uploadCover(id, userId, file);
        return response_dto_1.ApiResponse.success({ url: coverUrl }, '封面上传成功');
    }
    async submitForReview(id, userId) {
        const course = await this.coursesService.submitForReview(id, userId);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course, '已提交审核');
    }
    async requestOffShelf(id, userId) {
        const course = await this.coursesService.requestOffShelf(id, userId);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course, '下架申请已提交');
    }
    async reviewCourse(id, approved, comment, userId) {
        const course = await this.coursesService.reviewCourse(id, userId, approved, comment);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course, approved ? '审核通过，课程已上架' : '课程已驳回');
    }
    async withdrawReview(id, userId) {
        const course = await this.coursesService.withdrawReview(id, userId);
        this.transformPriceToYuan(course);
        return response_dto_1.ApiResponse.success(course, '已撤回审核申请');
    }
    async adminRemove(id) {
        await this.coursesService.adminRemove(id);
        return response_dto_1.ApiResponse.success(null, '课程已强制删除');
    }
    async setFeatured(id, isRecommended) {
        const course = await this.coursesService.setFeatured(id, isRecommended);
        return response_dto_1.ApiResponse.success(course, isRecommended ? '已设为推荐课程' : '已取消推荐');
    }
};
exports.CoursesController = CoursesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_query_dto_1.CourseQueryDto]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findPublished", null);
__decorate([
    (0, common_1.Get)('teacher'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, course_query_dto_1.CourseQueryDto]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findMyCourses", null);
__decorate([
    (0, common_1.Get)('teacher/stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getTeacherStats", null);
__decorate([
    (0, common_1.Get)('teacher/producers'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getTeacherProducers", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_query_dto_1.CourseQueryDto]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('admin/preview/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findByIdAdmin", null);
__decorate([
    (0, common_1.Get)('pending-review'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_query_dto_1.CourseQueryDto]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findPendingReview", null);
__decorate([
    (0, common_1.Get)('stats/pending-count'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getPendingCourseCount", null);
__decorate([
    (0, common_1.Get)('my/purchased'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getMyPurchasedCourses", null);
__decorate([
    (0, common_1.Get)(':id/diff'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getCourseDiff", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER, constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getReviewHistory", null);
__decorate([
    (0, common_1.Get)(':id/purchase-status'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "checkPurchaseStatus", null);
__decorate([
    (0, common_1.Get)(':courseId/lessons/:lessonId/access'),
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('lessonId', common_1.ParseIntPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "checkLessonAccess", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_course_dto_1.CreateCourseDto]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, update_course_dto_1.UpdateCourseDto]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Number, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/cover'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "uploadCover", null);
__decorate([
    (0, common_1.Post)(':id/submit-review'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "submitForReview", null);
__decorate([
    (0, common_1.Post)(':id/request-off-shelf'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "requestOffShelf", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('approved')),
    __param(2, (0, common_1.Body)('comment')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean, Object, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "reviewCourse", null);
__decorate([
    (0, common_1.Post)(':id/withdraw-review'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "withdrawReview", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "adminRemove", null);
__decorate([
    (0, common_1.Patch)(':id/featured'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN, constants_1.Role.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('isRecommended')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "setFeatured", null);
exports.CoursesController = CoursesController = __decorate([
    (0, common_1.Controller)('courses'),
    __metadata("design:paramtypes", [courses_service_1.CoursesService])
], CoursesController);
//# sourceMappingURL=courses.controller.js.map