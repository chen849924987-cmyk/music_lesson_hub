import { EarningsService } from './earnings.service';
import { ApiResponse } from '../../common/dto/response.dto';
import { TeachersService } from '../teachers/teachers.service';
import { CreateWithdrawalDto, ReviewWithdrawalDto } from './dto/create-withdrawal.dto';
export declare class EarningsController {
    private readonly earningsService;
    private readonly teachersService;
    constructor(earningsService: EarningsService, teachersService: TeachersService);
    getTeacherStats(userId: number): Promise<ApiResponse<{
        totalEarnings: number;
        balance: number;
        pendingSettlement: number;
        totalWithdrawn: number;
        paymentAccount: string;
        bankAccount: string;
        bankBranch: string;
    }>>;
    getEarningDetail(userId: number, page?: number, pageSize?: number, startDate?: string, endDate?: string): Promise<ApiResponse<{
        items: any[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    applyWithdrawal(userId: number, dto: CreateWithdrawalDto): Promise<ApiResponse<{
        id: number;
        amount: number;
        accountInfo: string;
        status: string;
        createdAt: Date;
    }>>;
    getWithdrawals(userId: number, page?: number, pageSize?: number): Promise<ApiResponse<{
        items: any[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    getAllWithdrawals(page?: number, pageSize?: number, status?: string): Promise<ApiResponse<{
        items: any[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    reviewWithdrawal(id: number, userId: number, dto: ReviewWithdrawalDto): Promise<ApiResponse<{
        id: number;
        status: string;
        amount: number;
        remark: string;
        processedAt: Date;
    }>>;
    getPendingWithdrawalCount(): Promise<ApiResponse<{
        count: number;
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
