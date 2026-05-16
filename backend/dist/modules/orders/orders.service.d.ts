import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from './entities/cart.entity';
import { CreateOrderDto, OrderQueryDto } from './dto/create-order.dto';
import { Course } from '../courses/entities/course.entity';
import { UserCourse } from '../courses/entities/user-course.entity';
import { UserLesson } from '../courses/entities/user-lesson.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { EarningsService } from '../earnings/earnings.service';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly cartRepository;
    private readonly courseRepository;
    private readonly userCourseRepository;
    private readonly userLessonRepository;
    private readonly lessonRepository;
    private readonly earningsService;
    private readonly dataSource;
    private readonly logger;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, cartRepository: Repository<CartItem>, courseRepository: Repository<Course>, userCourseRepository: Repository<UserCourse>, userLessonRepository: Repository<UserLesson>, lessonRepository: Repository<Lesson>, earningsService: EarningsService, dataSource: DataSource);
    private generateOrderNo;
    createOrder(userId: number, createOrderDto: CreateOrderDto): Promise<Order>;
    private createCourseOrder;
    private createLessonOrder;
    findById(orderId: number): Promise<Order>;
    findUserOrders(userId: number, queryDto: OrderQueryDto): Promise<{
        items: Order[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    getOrderStats(): Promise<{
        total: number;
        pending: number;
        paid: number;
        refunded: number;
        refunding: number;
        cancelled: number;
    }>;
    findAllOrders(queryDto: OrderQueryDto & {
        userId?: number;
    }): Promise<{
        items: Order[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
        stats: {
            total: number;
            pending: number;
            paid: number;
            refunded: number;
            refunding: number;
            cancelled: number;
        };
    }>;
    findByOrderNo(orderNo: string): Promise<Order>;
    cancelOrder(orderId: number, userId: number): Promise<Order>;
    paySuccess(orderId: number, tradeNo: string): Promise<Order>;
    refundOrder(orderId: number, remark?: string): Promise<Order>;
    checkUserPurchased(userId: number, courseId: number): Promise<boolean>;
    addToCart(userId: number, courseId: number, quantity?: number): Promise<CartItem>;
    removeFromCart(userId: number, courseId: number): Promise<void>;
    getCart(userId: number): Promise<any[]>;
    clearCart(userId: number): Promise<void>;
    getCartCount(userId: number): Promise<number>;
}
