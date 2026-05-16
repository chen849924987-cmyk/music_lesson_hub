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
var EarningsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarningsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const earning_entity_1 = require("./entities/earning.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const order_item_entity_1 = require("../orders/entities/order-item.entity");
const course_entity_1 = require("../courses/entities/course.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const constants_1 = require("../../common/constants");
let EarningsService = EarningsService_1 = class EarningsService {
    earningRepository;
    orderRepository;
    orderItemRepository;
    courseRepository;
    teacherRepository;
    dataSource;
    logger = new common_1.Logger(EarningsService_1.name);
    PLATFORM_SHARE_RATE = 0.3;
    constructor(earningRepository, orderRepository, orderItemRepository, courseRepository, teacherRepository, dataSource) {
        this.earningRepository = earningRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.courseRepository = courseRepository;
        this.teacherRepository = teacherRepository;
        this.dataSource = dataSource;
    }
    async createEarningsFromOrder(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['items'],
        });
        if (!order || order.status !== constants_1.OrderStatus.PAID) {
            this.logger.warn(`订单 ${orderId} 未支付或不存在，跳过收益创建`);
            return;
        }
        const items = order.items || await this.orderItemRepository.find({ where: { orderId } });
        if (items.length === 0) {
            this.logger.warn(`订单 ${orderId} 无明细项，跳过收益创建`);
            return;
        }
        const courseIds = [...new Set(items.map((item) => item.courseId))];
        const courses = await this.courseRepository.find({
            where: courseIds.map((id) => ({ id })),
            select: ['id', 'teacherId', 'title'],
        });
        const courseMap = new Map(courses.map((c) => [c.id, c]));
        const earningsByTeacher = new Map();
        for (const item of items) {
            const course = courseMap.get(item.courseId);
            if (!course) {
                this.logger.warn(`课程 ${item.courseId} 不存在，跳过收益项`);
                continue;
            }
            if (!course.teacherId) {
                this.logger.warn(`课程 ${item.courseId} 无归属教师，跳过收益项`);
                continue;
            }
            const teacherId = course.teacherId;
            if (!earningsByTeacher.has(teacherId)) {
                earningsByTeacher.set(teacherId, { teacherId, totalAmount: 0, details: [] });
            }
            const entry = earningsByTeacher.get(teacherId);
            entry.totalAmount += item.price;
            entry.details.push({
                courseId: item.courseId,
                courseTitle: course.title,
                price: item.price,
                orderItemId: item.id,
            });
        }
        if (earningsByTeacher.size === 0) {
            this.logger.warn(`订单 ${orderId} 无有效收益项，跳过`);
            return;
        }
        await this.dataSource.transaction(async (manager) => {
            for (const [, entry] of earningsByTeacher) {
                const platformShare = Math.round(entry.totalAmount * this.PLATFORM_SHARE_RATE);
                const actualAmount = entry.totalAmount - platformShare;
                const earning = this.earningRepository.create({
                    teacherId: entry.teacherId,
                    orderId: order.id,
                    courseId: entry.details[0].courseId,
                    courseTitle: entry.details.length === 1
                        ? entry.details[0].courseTitle
                        : `${entry.details[0].courseTitle} 等 ${entry.details.length} 门课程`,
                    amount: entry.totalAmount,
                    platformShare,
                    actualAmount,
                    type: 'course_sale',
                    status: constants_1.EarningStatus.SETTLED,
                    remark: `订单 ${order.orderNo} 支付完成`,
                });
                await manager.save(earning_entity_1.Earning, earning);
                await manager
                    .createQueryBuilder()
                    .update(teacher_entity_1.Teacher)
                    .set({
                    totalEarnings: () => `totalEarnings + ${entry.totalAmount}`,
                    withdrawableBalance: () => `withdrawableBalance + ${actualAmount}`,
                })
                    .where('id = :teacherId', { teacherId: entry.teacherId })
                    .execute();
            }
        });
        this.logger.log(`订单 ${order.orderNo} 收益记录创建完成，共 ${earningsByTeacher.size} 位教师`);
    }
    async deductEarningsFromRefund(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['items'],
        });
        if (!order || order.status !== constants_1.OrderStatus.REFUNDED) {
            this.logger.warn(`订单 ${orderId} 未退款或不存在，跳过收益扣减`);
            return;
        }
        const earnings = await this.earningRepository.find({ where: { orderId } });
        if (earnings.length === 0) {
            this.logger.warn(`订单 ${orderId} 无原有收益记录，跳过扣减`);
            return;
        }
        await this.dataSource.transaction(async (manager) => {
            for (const earning of earnings) {
                const deductRecord = this.earningRepository.create({
                    teacherId: earning.teacherId,
                    orderId: order.id,
                    courseId: earning.courseId,
                    courseTitle: earning.courseTitle,
                    amount: -earning.amount,
                    platformShare: -earning.platformShare,
                    actualAmount: -earning.actualAmount,
                    type: 'refund',
                    status: constants_1.EarningStatus.SETTLED,
                    remark: `订单 ${order.orderNo} 退款，扣减收益`,
                });
                await manager.save(earning_entity_1.Earning, deductRecord);
                await manager
                    .createQueryBuilder()
                    .update(teacher_entity_1.Teacher)
                    .set({
                    totalEarnings: () => `totalEarnings - ${earning.amount}`,
                    withdrawableBalance: () => `withdrawableBalance - ${earning.actualAmount}`,
                })
                    .where('id = :teacherId', { teacherId: earning.teacherId })
                    .execute();
            }
        });
        this.logger.log(`订单 ${order.orderNo} 收益扣减完成，共 ${earnings.length} 条记录`);
    }
    async getTeacherEarningStats(teacherId) {
        const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
        if (!teacher) {
            throw new common_1.NotFoundException('教师信息不存在');
        }
        return {
            totalEarnings: Number(teacher.totalEarnings),
            balance: Number(teacher.withdrawableBalance),
            pendingSettlement: 0,
            totalWithdrawn: Number(teacher.withdrawnAmount),
        };
    }
    async getTeacherEarningDetail(teacherId, params) {
        const { page = constants_1.PAGINATION.DEFAULT_PAGE, pageSize = constants_1.PAGINATION.DEFAULT_PAGE_SIZE, startDate, endDate } = params;
        const queryBuilder = this.earningRepository
            .createQueryBuilder('earning')
            .where('earning.teacherId = :teacherId', { teacherId })
            .orderBy('earning.createdAt', 'DESC');
        if (startDate) {
            queryBuilder.andWhere('earning.createdAt >= :startDate', { startDate: new Date(startDate) });
        }
        if (endDate) {
            queryBuilder.andWhere('earning.createdAt <= :endDate', { endDate: new Date(endDate + 'T23:59:59') });
        }
        const [items, total] = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
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
    async getPlatformEarningStats() {
        const revenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
            .where('order.status IN (:...statuses)', { statuses: [constants_1.OrderStatus.PAID, constants_1.OrderStatus.REFUNDED] })
            .getRawOne();
        const totalRevenue = Number(revenueResult?.total || 0);
        const orderCount = await this.orderRepository.count({
            where: { status: constants_1.OrderStatus.PAID },
        });
        const platformResult = await this.earningRepository
            .createQueryBuilder('earning')
            .select('COALESCE(SUM(earning.platformShare), 0)', 'total')
            .where('earning.type = :type', { type: 'course_sale' })
            .getRawOne();
        const platformIncome = Number(platformResult?.total || 0);
        const teacherResult = await this.earningRepository
            .createQueryBuilder('earning')
            .select('COALESCE(SUM(earning.actualAmount), 0)', 'total')
            .where('earning.type = :type', { type: 'course_sale' })
            .getRawOne();
        const teacherEarnings = Number(teacherResult?.total || 0);
        const withdrawalResult = await this.teacherRepository
            .createQueryBuilder('teacher')
            .select('COALESCE(SUM(teacher.withdrawnAmount), 0)', 'total')
            .getRawOne();
        const totalWithdrawn = Number(withdrawalResult?.total || 0);
        return {
            totalRevenue,
            platformIncome,
            teacherEarnings,
            totalWithdrawn,
            orderCount,
        };
    }
    async getPlatformEarningTrend(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const earnings = await this.earningRepository
            .createQueryBuilder('earning')
            .select([
            'DATE(earning.createdAt) as date',
            'COALESCE(SUM(CASE WHEN earning.type = \'course_sale\' THEN earning.amount ELSE 0 END), 0) as revenue',
            'COALESCE(SUM(CASE WHEN earning.type = \'course_sale\' THEN earning.platformShare ELSE 0 END), 0) as platformIncome',
            'COALESCE(SUM(CASE WHEN earning.type = \'course_sale\' THEN earning.actualAmount ELSE 0 END), 0) as teacherEarnings',
        ])
            .where('earning.createdAt >= :startDate', { startDate })
            .andWhere('earning.type = :type', { type: 'course_sale' })
            .groupBy('DATE(earning.createdAt)')
            .orderBy('DATE(earning.createdAt)', 'ASC')
            .getRawMany();
        return earnings.map((e) => ({
            date: e.date || e.earning_date || '',
            revenue: Number(e.revenue ?? e.earning_revenue ?? 0),
            platformIncome: Number(e.platformIncome ?? e.earning_platformIncome ?? 0),
            teacherEarnings: Number(e.teacherEarnings ?? e.earning_teacherEarnings ?? 0),
        }));
    }
    async getTopEarningCourses(limit = 10) {
        const results = await this.earningRepository
            .createQueryBuilder('earning')
            .select([
            'earning.courseId as courseId',
            'earning.courseTitle as courseTitle',
            'COALESCE(SUM(earning.amount), 0) as totalAmount',
            'COUNT(DISTINCT earning.orderId) as orderCount',
        ])
            .where('earning.type = :type', { type: 'course_sale' })
            .groupBy('earning.courseId')
            .addGroupBy('earning.courseTitle')
            .orderBy('totalAmount', 'DESC')
            .limit(limit)
            .getRawMany();
        return results.map((r) => ({
            courseId: r.courseId,
            courseTitle: r.courseTitle,
            totalAmount: Number(r.totalAmount) || 0,
            orderCount: Number(r.orderCount) || 0,
        }));
    }
    async getTopEarningTeachers(limit = 10) {
        const results = await this.earningRepository
            .createQueryBuilder('earning')
            .select([
            'earning.teacherId as teacherId',
            'COALESCE(SUM(earning.amount), 0) as totalAmount',
        ])
            .where('earning.type = :type', { type: 'course_sale' })
            .groupBy('earning.teacherId')
            .orderBy('totalAmount', 'DESC')
            .limit(limit)
            .getRawMany();
        if (results.length === 0)
            return [];
        const teacherIds = results.map((r) => r.teacherId);
        const teachers = await this.teacherRepository.find({
            where: teacherIds.map((id) => ({ id })),
            select: ['id', 'realName'],
        });
        const teacherMap = new Map(teachers.map((t) => [t.id, t.realName]));
        return results.map((r) => ({
            teacherId: r.teacherId,
            realName: teacherMap.get(r.teacherId) || '未知教师',
            totalAmount: Number(r.totalAmount) || 0,
        }));
    }
};
exports.EarningsService = EarningsService;
exports.EarningsService = EarningsService = EarningsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(earning_entity_1.Earning)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(3, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(4, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], EarningsService);
//# sourceMappingURL=earnings.service.js.map