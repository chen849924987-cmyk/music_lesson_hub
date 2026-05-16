import { AdminService } from './admin.service';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<ApiResponse<{
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
    }>>;
    getReviewerWorkload(userId: number, role: string): Promise<ApiResponse<{
        reviewerId: number;
        username: string;
        totalReviews: number;
        approvedCount: number;
        rejectedCount: number;
        lastReviewAt: string | null;
    }[]>>;
}
