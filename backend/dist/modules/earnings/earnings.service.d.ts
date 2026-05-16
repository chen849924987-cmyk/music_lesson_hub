import { Repository, DataSource } from 'typeorm';
import { Earning } from './entities/earning.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Course } from '../courses/entities/course.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
export declare class EarningsService {
    private readonly earningRepository;
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly courseRepository;
    private readonly teacherRepository;
    private readonly dataSource;
    private readonly logger;
    private readonly PLATFORM_SHARE_RATE;
    constructor(earningRepository: Repository<Earning>, orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, courseRepository: Repository<Course>, teacherRepository: Repository<Teacher>, dataSource: DataSource);
    createEarningsFromOrder(orderId: number): Promise<void>;
    deductEarningsFromRefund(orderId: number): Promise<void>;
    getTeacherEarningStats(teacherId: number): Promise<{
        totalEarnings: number;
        balance: number;
        pendingSettlement: number;
        totalWithdrawn: number;
    }>;
    getTeacherEarningDetail(teacherId: number, params: {
        page?: number;
        pageSize?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        items: Earning[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    getPlatformEarningStats(): Promise<{
        totalRevenue: number;
        platformIncome: number;
        teacherEarnings: number;
        totalWithdrawn: number;
        orderCount: number;
    }>;
    getPlatformEarningTrend(days?: number): Promise<{
        date: string;
        revenue: number;
        platformIncome: number;
        teacherEarnings: number;
    }[]>;
    getTopEarningCourses(limit?: number): Promise<{
        courseId: number;
        courseTitle: string;
        totalAmount: number;
        orderCount: number;
    }[]>;
    getTopEarningTeachers(limit?: number): Promise<{
        teacherId: number;
        realName: string;
        totalAmount: number;
    }[]>;
}
