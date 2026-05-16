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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const cart_entity_1 = require("./entities/cart.entity");
const course_entity_1 = require("../courses/entities/course.entity");
const user_course_entity_1 = require("../courses/entities/user-course.entity");
const user_lesson_entity_1 = require("../courses/entities/user-lesson.entity");
const lesson_entity_1 = require("../courses/entities/lesson.entity");
const earnings_service_1 = require("../earnings/earnings.service");
const constants_1 = require("../../common/constants");
let OrdersService = OrdersService_1 = class OrdersService {
    orderRepository;
    orderItemRepository;
    cartRepository;
    courseRepository;
    userCourseRepository;
    userLessonRepository;
    lessonRepository;
    earningsService;
    dataSource;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(orderRepository, orderItemRepository, cartRepository, courseRepository, userCourseRepository, userLessonRepository, lessonRepository, earningsService, dataSource) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.courseRepository = courseRepository;
        this.userCourseRepository = userCourseRepository;
        this.userLessonRepository = userLessonRepository;
        this.lessonRepository = lessonRepository;
        this.earningsService = earningsService;
        this.dataSource = dataSource;
    }
    generateOrderNo() {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, '0');
        return `ORD${timestamp}${random}`;
    }
    async createOrder(userId, createOrderDto) {
        const { courseIds, lessonIds } = createOrderDto;
        if ((!courseIds || courseIds.length === 0) && (!lessonIds || lessonIds.length === 0)) {
            throw new common_1.BadRequestException('请提供要购买的课程（courseIds）或课时（lessonIds）');
        }
        if (lessonIds && lessonIds.length > 0) {
            return this.createLessonOrder(userId, lessonIds);
        }
        return this.createCourseOrder(userId, courseIds);
    }
    async createCourseOrder(userId, courseIds) {
        const courses = await this.courseRepository.find({
            where: { id: (0, typeorm_2.In)(courseIds) },
        });
        if (courses.length !== courseIds.length) {
            const foundIds = courses.map((c) => c.id);
            const missingIds = courseIds.filter((id) => !foundIds.includes(id));
            throw new common_1.BadRequestException(`课程不存在，缺失ID：${missingIds.join(', ')}`);
        }
        const offlineCourses = courses.filter((c) => c.status !== 'approved');
        if (offlineCourses.length > 0) {
            throw new common_1.BadRequestException(`以下课程未上架，无法购买：${offlineCourses.map((c) => c.title).join('、')}`);
        }
        const purchasedCourses = await this.userCourseRepository.find({
            where: { userId, courseId: (0, typeorm_2.In)(courseIds) },
        });
        if (purchasedCourses.length > 0) {
            const purchasedIds = purchasedCourses.map((c) => c.courseId);
            const duplicateTitles = courses
                .filter((c) => purchasedIds.includes(c.id))
                .map((c) => c.title);
            throw new common_1.ConflictException(`您已购买以下课程，请勿重复购买：${duplicateTitles.join('、')}`);
        }
        const totalAmount = courses.reduce((sum, course) => sum + course.price, 0);
        if (totalAmount <= 0) {
            throw new common_1.BadRequestException('免费课程无需下单，请直接开始学习');
        }
        const orderType = courses.length === 1 ? constants_1.OrderType.SINGLE_COURSE : constants_1.OrderType.SERIES_COURSE;
        const expiredAt = new Date(Date.now() + 30 * 60 * 1000);
        const order = await this.dataSource.transaction(async (manager) => {
            const orderData = this.orderRepository.create({
                orderNo: this.generateOrderNo(),
                userId,
                totalAmount,
                status: constants_1.OrderStatus.PENDING,
                orderType,
                expiredAt,
            });
            const savedOrder = await manager.save(order_entity_1.Order, orderData);
            const orderItems = courses.map((course) => this.orderItemRepository.create({
                orderId: savedOrder.id,
                courseId: course.id,
                courseTitle: course.title,
                price: course.price,
                quantity: 1,
            }));
            await manager.save(order_item_entity_1.OrderItem, orderItems);
            await manager.delete(cart_entity_1.CartItem, {
                userId,
                courseId: (0, typeorm_2.In)(courseIds),
            });
            return savedOrder;
        });
        return this.findById(order.id);
    }
    async createLessonOrder(userId, lessonIds) {
        const lessons = await this.lessonRepository.find({
            where: { id: (0, typeorm_2.In)(lessonIds) },
            relations: ['chapter'],
        });
        if (lessons.length !== lessonIds.length) {
            const foundIds = lessons.map((l) => l.id);
            const missingIds = lessonIds.filter((id) => !foundIds.includes(id));
            throw new common_1.BadRequestException(`课时不存在，缺失ID：${missingIds.join(', ')}`);
        }
        const courseIds = lessons.map((l) => l.courseId);
        const uniqueCourseIds = [...new Set(courseIds)];
        if (uniqueCourseIds.length > 1) {
            throw new common_1.BadRequestException('暂不支持不同课程的课时混合购买，请分别下单');
        }
        const courseId = uniqueCourseIds[0];
        const course = await this.courseRepository.findOne({ where: { id: courseId } });
        if (!course) {
            throw new common_1.BadRequestException('课程不存在');
        }
        if (course.status !== 'approved') {
            throw new common_1.BadRequestException('该课程未上架，无法购买其中的课时');
        }
        if (course.courseType !== 'series') {
            throw new common_1.BadRequestException('只有系列课支持课时单独购买');
        }
        const unsupportedLessons = lessons.filter((l) => !l.canSinglePurchase);
        if (unsupportedLessons.length > 0) {
            throw new common_1.BadRequestException(`以下课时不支持单独购买：${unsupportedLessons.map((l) => l.title).join('、')}`);
        }
        const purchasedLessons = await this.userLessonRepository.find({
            where: { userId, lessonId: (0, typeorm_2.In)(lessonIds) },
        });
        if (purchasedLessons.length > 0) {
            const purchasedIds = purchasedLessons.map((l) => l.lessonId);
            const duplicateTitles = lessons
                .filter((l) => purchasedIds.includes(l.id))
                .map((l) => l.title);
            throw new common_1.ConflictException(`您已购买以下课时，请勿重复购买：${duplicateTitles.join('、')}`);
        }
        const hasFullCourse = await this.userCourseRepository.findOne({
            where: { userId, courseId },
        });
        if (hasFullCourse) {
            throw new common_1.ConflictException('您已购买该课程，无需单独购买课时');
        }
        let totalAmount = 0;
        for (const lesson of lessons) {
            if (lesson.singlePrice <= 0) {
                throw new common_1.BadRequestException(`课时《${lesson.title}》的单独购买价格未设置`);
            }
            totalAmount += lesson.singlePrice;
        }
        const expiredAt = new Date(Date.now() + 30 * 60 * 1000);
        const order = await this.dataSource.transaction(async (manager) => {
            const orderData = this.orderRepository.create({
                orderNo: this.generateOrderNo(),
                userId,
                totalAmount,
                status: constants_1.OrderStatus.PENDING,
                orderType: constants_1.OrderType.SINGLE_LESSON,
                expiredAt,
            });
            const savedOrder = await manager.save(order_entity_1.Order, orderData);
            const orderItems = lessons.map((lesson) => this.orderItemRepository.create({
                orderId: savedOrder.id,
                courseId: lesson.courseId,
                lessonId: lesson.id,
                courseTitle: course.title,
                lessonTitle: lesson.title,
                price: lesson.singlePrice,
                quantity: 1,
            }));
            await manager.save(order_item_entity_1.OrderItem, orderItems);
            return savedOrder;
        });
        return this.findById(order.id);
    }
    async findById(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        return order;
    }
    async findUserOrders(userId, queryDto) {
        const { page = constants_1.PAGINATION.DEFAULT_PAGE, pageSize = constants_1.PAGINATION.DEFAULT_PAGE_SIZE, status, } = queryDto;
        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .where('order.userId = :userId', { userId })
            .orderBy('order.createdAt', 'DESC');
        if (status) {
            queryBuilder.andWhere('order.status = :status', { status });
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
    async getOrderStats() {
        const total = await this.orderRepository.count();
        const pending = await this.orderRepository.count({ where: { status: constants_1.OrderStatus.PENDING } });
        const paid = await this.orderRepository.count({ where: { status: constants_1.OrderStatus.PAID } });
        const refunded = await this.orderRepository.count({ where: { status: constants_1.OrderStatus.REFUNDED } });
        const refunding = await this.orderRepository.count({ where: { status: constants_1.OrderStatus.REFUNDING } });
        const cancelled = await this.orderRepository.count({ where: { status: constants_1.OrderStatus.CANCELLED } });
        return { total, pending, paid, refunded, refunding, cancelled };
    }
    async findAllOrders(queryDto) {
        const { page = constants_1.PAGINATION.DEFAULT_PAGE, pageSize = constants_1.PAGINATION.DEFAULT_PAGE_SIZE, status, userId, } = queryDto;
        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.user', 'user')
            .orderBy('order.createdAt', 'DESC');
        if (status) {
            queryBuilder.andWhere('order.status = :status', { status });
        }
        if (userId) {
            queryBuilder.andWhere('order.userId = :userId', { userId });
        }
        const [items, total] = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        const stats = await this.getOrderStats();
        return {
            items,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
            stats,
        };
    }
    async findByOrderNo(orderNo) {
        const order = await this.orderRepository.findOne({
            where: { orderNo },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.NotFoundException('订单不存在');
        }
        return order;
    }
    async cancelOrder(orderId, userId) {
        const order = await this.findById(orderId);
        if (order.userId !== userId) {
            throw new common_1.ForbiddenException('无权操作此订单');
        }
        if (order.status !== constants_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('仅待支付状态的订单可以取消');
        }
        order.status = constants_1.OrderStatus.CANCELLED;
        return this.orderRepository.save(order);
    }
    async paySuccess(orderId, tradeNo) {
        const order = await this.findById(orderId);
        if (order.status !== constants_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('订单状态异常，无法完成支付');
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.update(order_entity_1.Order, orderId, {
                status: constants_1.OrderStatus.PAID,
                tradeNo,
                paidAt: new Date(),
            });
            const items = await this.orderItemRepository.find({
                where: { orderId },
            });
            if (order.orderType === constants_1.OrderType.SINGLE_LESSON) {
                const userLessons = items.map((item) => this.userLessonRepository.create({
                    userId: order.userId,
                    lessonId: item.lessonId,
                    courseId: item.courseId,
                    orderId: order.id,
                    price: item.price,
                }));
                await manager.save(user_lesson_entity_1.UserLesson, userLessons);
            }
            else {
                const userCourses = items.map((item) => this.userCourseRepository.create({
                    userId: order.userId,
                    courseId: item.courseId,
                    orderId: order.id,
                    price: item.price,
                }));
                await manager.save(user_course_entity_1.UserCourse, userCourses);
            }
        });
        try {
            await this.earningsService.createEarningsFromOrder(orderId);
        }
        catch (error) {
            this.logger.error(`创建收益记录失败（订单 ${orderId}）: ${error.message}`);
        }
        return this.findById(orderId);
    }
    async refundOrder(orderId, remark) {
        const order = await this.findById(orderId);
        if (order.status !== constants_1.OrderStatus.PAID) {
            throw new common_1.BadRequestException('仅已支付的订单可以退款');
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.update(order_entity_1.Order, orderId, {
                status: constants_1.OrderStatus.REFUNDED,
                remark: remark || '管理员退款',
            });
            const items = await this.orderItemRepository.find({
                where: { orderId },
            });
            if (order.orderType === constants_1.OrderType.SINGLE_LESSON) {
                const lessonIds = items.map((item) => item.lessonId);
                await manager.delete(user_lesson_entity_1.UserLesson, {
                    userId: order.userId,
                    lessonId: (0, typeorm_2.In)(lessonIds),
                });
            }
            else {
                const courseIds = items.map((item) => item.courseId);
                await manager.delete(user_course_entity_1.UserCourse, {
                    userId: order.userId,
                    courseId: (0, typeorm_2.In)(courseIds),
                });
            }
        });
        try {
            await this.earningsService.deductEarningsFromRefund(orderId);
        }
        catch (error) {
            this.logger.error(`扣减收益记录失败（订单 ${orderId}）: ${error.message}`);
        }
        return this.findById(orderId);
    }
    async checkUserPurchased(userId, courseId) {
        const count = await this.userCourseRepository.count({
            where: { userId, courseId },
        });
        return count > 0;
    }
    async addToCart(userId, courseId, quantity = 1) {
        const course = await this.courseRepository.findOne({ where: { id: courseId } });
        if (!course) {
            throw new common_1.NotFoundException('课程不存在');
        }
        if (course.status !== 'approved') {
            throw new common_1.BadRequestException('该课程暂未上架，无法加入购物车');
        }
        const existing = await this.cartRepository.findOne({
            where: { userId, courseId },
        });
        if (existing) {
            throw new common_1.ConflictException('该课程已在购物车中');
        }
        const cartItem = this.cartRepository.create({ userId, courseId, quantity });
        return this.cartRepository.save(cartItem);
    }
    async removeFromCart(userId, courseId) {
        const result = await this.cartRepository.delete({ userId, courseId });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('购物车中未找到该课程');
        }
    }
    async getCart(userId) {
        const cartItems = await this.cartRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        if (cartItems.length === 0) {
            return [];
        }
        const courseIds = cartItems.map((item) => item.courseId);
        const courses = await this.courseRepository.find({
            where: { id: (0, typeorm_2.In)(courseIds) },
        });
        const courseMap = new Map(courses.map((c) => [c.id, c]));
        return cartItems.map((item) => {
            const course = courseMap.get(item.courseId);
            return {
                id: item.id,
                courseId: item.courseId,
                quantity: item.quantity,
                createdAt: item.createdAt,
                course: course
                    ? {
                        id: course.id,
                        title: course.title,
                        cover: course.cover,
                        price: course.price,
                        courseType: course.courseType,
                    }
                    : null,
            };
        });
    }
    async clearCart(userId) {
        await this.cartRepository.delete({ userId });
    }
    async getCartCount(userId) {
        return this.cartRepository.count({ where: { userId } });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(cart_entity_1.CartItem)),
    __param(3, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(4, (0, typeorm_1.InjectRepository)(user_course_entity_1.UserCourse)),
    __param(5, (0, typeorm_1.InjectRepository)(user_lesson_entity_1.UserLesson)),
    __param(6, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => earnings_service_1.EarningsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        earnings_service_1.EarningsService,
        typeorm_2.DataSource])
], OrdersService);
//# sourceMappingURL=orders.service.js.map