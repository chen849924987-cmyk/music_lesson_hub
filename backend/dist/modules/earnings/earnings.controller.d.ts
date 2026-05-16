import { EarningsService } from './earnings.service';
import { ApiResponse } from '../../common/dto/response.dto';
import { TeachersService } from '../teachers/teachers.service';
export declare class EarningsController {
    private readonly earningsService;
    private readonly teachersService;
    constructor(earningsService: EarningsService, teachersService: TeachersService);
    getTeacherStats(userId: number): Promise<ApiResponse<{
        totalEarnings: number;
        balance: number;
        pendingSettlement: number;
        totalWithdrawn: number;
    }>>;
    getEarningDetail(userId: number, page?: number, pageSize?: number, startDate?: string, endDate?: string): Promise<ApiResponse<{
        items: any[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    getWithdrawals(userId: number, page?: number, pageSize?: number): Promise<ApiResponse<{
        items: never[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    getPlatformStats(): Promise<ApiResponse<{
        totalRevenue: number;
        platformIncome: number;
        teacherEarnings: number;
        totalWithdrawn: number;
        orderCount: number;
    }>>;
    getPlatformTrend(days?: number): Promise<ApiResponse<{
        revenue: number;
        platformIncome: number;
        teacherEarnings: number;
        date: string;
    }[]>>;
    getTopCourses(limit?: number): Promise<ApiResponse<{
        totalAmount: number;
        courseId: number;
        courseTitle: string;
        orderCount: number;
    }[]>>;
    getTopTeachers(limit?: number): Promise<ApiResponse<{
        totalAmount: number;
        teacherId: number;
        realName: string;
    }[]>>;
}
