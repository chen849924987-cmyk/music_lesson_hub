import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EarningsService } from './earnings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';
import { TeachersService } from '../teachers/teachers.service';

/**
 * 收益控制器
 * 功能描述：处理教师收益查询和超管平台收益统计的接口
 *
 * 接口权限说明：
 * - 教师端接口 → 需要 TEACHER 角色
 * - 管理端接口 → 需要 SUPER_ADMIN 角色
 *
 * 前端已有对应的 API 层（course.ts 中的 getEarningsStats/getEarningsDetail 等），
 * 但此前从未实际实现，现在补全。
 */
@Controller('earnings')
export class EarningsController {
  constructor(
    private readonly earningsService: EarningsService,
    private readonly teachersService: TeachersService,
  ) {}

  /**
   * 获取当前教师的收益统计数据
   * GET /api/v1/earnings/stats
   *
   * 功能描述：返回教师的收益概览（总收入、可提现余额、已提现金额）
   *          前端通过 getEarningsStats() 调用此接口
   */
  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async getTeacherStats(@CurrentUser('sub') userId: number) {
    const teacher = await this.teachersService.findByUserId(userId);
    const stats = await this.earningsService.getTeacherEarningStats(teacher.id);
    // 将分转换为元（前端展示用）
    return ApiResponse.success({
      totalEarnings: stats.totalEarnings / 100,
      balance: stats.balance / 100,
      pendingSettlement: stats.pendingSettlement / 100,
      totalWithdrawn: stats.totalWithdrawn / 100,
    });
  }

  /**
   * 获取教师的收益明细列表（分页）
   * GET /api/v1/earnings/detail
   *
   * 功能描述：返回教师的收益流水记录，支持按时间范围筛选
   *          前端通过 getEarningsDetail() 调用此接口
   *
   * @param page 页码
   * @param pageSize 每页条数
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   */
  @Get('detail')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async getEarningDetail(
    @CurrentUser('sub') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const teacher = await this.teachersService.findByUserId(userId);
    const result = await this.earningsService.getTeacherEarningDetail(teacher.id, {
      page,
      pageSize,
      startDate,
      endDate,
    });
    // 将金额从分转换为元
    const items = result.items.map((item: any) => ({
      ...item,
      amount: item.amount / 100,
      actualAmount: item.actualAmount / 100,
      platformShare: item.platformShare / 100,
    }));
    return ApiResponse.successWithPagination(items, result.meta);
  }

  /**
   * 获取教师的提现记录列表
   * GET /api/v1/earnings/withdrawals
   *
   * 功能描述：返回教师的提现申请记录（当前返回空列表，提现功能在 v5.1 实现）
   *          前端通过 getWithdrawals() 调用此接口
   */
  @Get('withdrawals')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async getWithdrawals(
    @CurrentUser('sub') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    // 提现功能在后续版本实现，当前返回空列表
    return ApiResponse.successWithPagination([], {
      total: 0,
      page: page || 1,
      pageSize: pageSize || 20,
      totalPages: 0,
    });
  }

  // ================================================================
  // 超管统计接口
  // ================================================================

  /**
   * 获取平台收益总览（超管用）
   * GET /api/v1/earnings/admin/platform-stats
   *
   * 功能描述：返回平台整体收益数据，包括总流水、平台分成收入、教师总收益等
   */
  @Get('admin/platform-stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async getPlatformStats() {
    const stats = await this.earningsService.getPlatformEarningStats();
    // 将分转换为元
    return ApiResponse.success({
      totalRevenue: stats.totalRevenue / 100,
      platformIncome: stats.platformIncome / 100,
      teacherEarnings: stats.teacherEarnings / 100,
      totalWithdrawn: stats.totalWithdrawn / 100,
      orderCount: stats.orderCount,
    });
  }

  /**
   * 获取平台收益趋势（超管用）
   * GET /api/v1/earnings/admin/trend
   *
   * 功能描述：返回最近N天的每日收益数据，用于管理端收益趋势图表展示
   *
   * @param days 最近N天，默认30
   */
  @Get('admin/trend')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async getPlatformTrend(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    const trend = await this.earningsService.getPlatformEarningTrend(days || 30);
    // 将分转换为元
    return ApiResponse.success(
      trend.map((item) => ({
        ...item,
        revenue: item.revenue / 100,
        platformIncome: item.platformIncome / 100,
        teacherEarnings: item.teacherEarnings / 100,
      })),
    );
  }

  /**
   * 获取课程收益排行榜（超管用）
   * GET /api/v1/earnings/admin/top-courses
   *
   * 功能描述：按课程维度统计收益，返回收益最高的课程列表
   *
   * @param limit 返回条数，默认10
   */
  @Get('admin/top-courses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async getTopCourses(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    const topCourses = await this.earningsService.getTopEarningCourses(limit || 10);
    // 将分转换为元
    return ApiResponse.success(
      topCourses.map((item) => ({
        ...item,
        totalAmount: item.totalAmount / 100,
      })),
    );
  }

  /**
   * 获取教师收益排行榜（超管用）
   * GET /api/v1/earnings/admin/top-teachers
   *
   * 功能描述：按教师维度统计收益，返回收益最高的教师列表
   *
   * @param limit 返回条数，默认10
   */
  @Get('admin/top-teachers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async getTopTeachers(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    const topTeachers = await this.earningsService.getTopEarningTeachers(limit || 10);
    // 将分转换为元
    return ApiResponse.success(
      topTeachers.map((item) => ({
        ...item,
        totalAmount: item.totalAmount / 100,
      })),
    );
  }
}
