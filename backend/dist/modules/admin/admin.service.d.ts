import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseReview } from '../courses/entities/course-review.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Order } from '../orders/entities/order.entity';
export declare class AdminService {
    private readonly userRepository;
    private readonly teacherRepository;
    private readonly courseRepository;
    private readonly courseReviewRepository;
    private readonly attachmentRepository;
    private readonly orderRepository;
    constructor(userRepository: Repository<User>, teacherRepository: Repository<Teacher>, courseRepository: Repository<Course>, courseReviewRepository: Repository<CourseReview>, attachmentRepository: Repository<Attachment>, orderRepository: Repository<Order>);
    getStats(): Promise<{
        totalUsers: number;
        totalTeachers: number;
        totalStudents: number;
        totalCourses: number;
        pendingCourses: number;
        pendingAttachments: number;
        totalOrders: number;
        paidOrderCount: number;
        totalRevenue: number;
        totalEarnings: number;
    }>;
    getReviewerWorkload(currentUserId?: number, isAdmin?: boolean): Promise<{
        reviewerId: number;
        username: string;
        totalReviews: number;
        approvedCount: number;
        rejectedCount: number;
        lastReviewAt: string | null;
    }[]>;
}
