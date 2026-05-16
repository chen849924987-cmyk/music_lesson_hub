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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const course_entity_1 = require("../courses/entities/course.entity");
const course_review_entity_1 = require("../courses/entities/course-review.entity");
const attachment_entity_1 = require("../attachments/entities/attachment.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const constants_1 = require("../../common/constants");
let AdminService = class AdminService {
    userRepository;
    teacherRepository;
    courseRepository;
    courseReviewRepository;
    attachmentRepository;
    orderRepository;
    constructor(userRepository, teacherRepository, courseRepository, courseReviewRepository, attachmentRepository, orderRepository) {
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.courseRepository = courseRepository;
        this.courseReviewRepository = courseReviewRepository;
        this.attachmentRepository = attachmentRepository;
        this.orderRepository = orderRepository;
    }
    async getStats() {
        const totalUsers = await this.userRepository.count();
        const totalTeachers = await this.teacherRepository.count();
        const totalStudents = await this.userRepository.count({
            where: { role: 'student' },
        });
        const totalCourses = await this.courseRepository.count({
            where: { status: 'approved' },
        });
        const pendingCourses = await this.courseRepository.count({
            where: { status: 'pending' },
        });
        const pendingAttachments = await this.attachmentRepository.count({
            where: { status: 'pending' },
        });
        const totalOrders = await this.orderRepository.count();
        const paidOrderCount = await this.orderRepository.count({
            where: { status: constants_1.OrderStatus.PAID },
        });
        const revenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
            .where('order.status IN (:...statuses)', {
            statuses: [constants_1.OrderStatus.PAID, constants_1.OrderStatus.REFUNDED],
        })
            .getRawOne();
        const totalRevenue = Number(revenueResult?.total || 0);
        const teacherResult = await this.teacherRepository
            .createQueryBuilder('teacher')
            .select('COALESCE(SUM(teacher.totalEarnings), 0)', 'total')
            .getRawOne();
        const totalEarnings = Number(teacherResult?.total || 0);
        return {
            totalUsers,
            totalTeachers,
            totalStudents,
            totalCourses,
            pendingCourses,
            pendingAttachments,
            totalOrders,
            paidOrderCount,
            totalRevenue,
            totalEarnings,
        };
    }
    async getReviewerWorkload(currentUserId, isAdmin) {
        const queryBuilder = this.courseReviewRepository
            .createQueryBuilder('cr')
            .leftJoin(user_entity_1.User, 'u', 'cr.reviewerId = u.id')
            .select([
            'cr.reviewerId AS reviewerId',
            'u.username AS username',
            'COUNT(*) AS totalReviews',
            'SUM(CASE WHEN cr.action = \'approved\' THEN 1 ELSE 0 END) AS approvedCount',
            'SUM(CASE WHEN cr.action = \'rejected\' THEN 1 ELSE 0 END) AS rejectedCount',
            'MAX(cr.createdAt) AS lastReviewAt',
        ])
            .groupBy('cr.reviewerId')
            .addGroupBy('u.username')
            .orderBy('totalReviews', 'DESC');
        if (!isAdmin && currentUserId) {
            queryBuilder.andWhere('cr.reviewerId = :currentUserId', { currentUserId });
        }
        const result = await queryBuilder.getRawMany();
        return result.map((item) => ({
            reviewerId: Number(item.reviewerId),
            username: item.username || '未知用户',
            totalReviews: Number(item.totalReviews),
            approvedCount: Number(item.approvedCount),
            rejectedCount: Number(item.rejectedCount),
            lastReviewAt: item.lastReviewAt || null,
        }));
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(2, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(3, (0, typeorm_1.InjectRepository)(course_review_entity_1.CourseReview)),
    __param(4, (0, typeorm_1.InjectRepository)(attachment_entity_1.Attachment)),
    __param(5, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map