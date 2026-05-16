/**
 * 管理端统计控制器
 *
 * 功能描述：提供超管后台统计数据相关的接口，包括控制台总览统计和审核员工作量统计。
 *
 * 接口权限说明：
 * - GET /admin/stats              → 超管/审核员/运营，控制台统计数据
 * - GET /admin/reviewer-workload  → 超管/审核员，审核员工作量统计（v4.1 新增）
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 获取超管控制台统计数据
   * GET /api/v1/admin/stats
   *
   * @returns 用户总数、教师总数、课程总数、待审核课程数、待审核附件数
   */
  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER, Role.OPERATOR)
  async getStats() {
    const stats = await this.adminService.getStats();
    return ApiResponse.success(stats);
  }

  /**
   * 获取审核员工作量统计
   * GET /api/v1/admin/reviewer-workload
   *
   * @returns 每位审核员的统计：总审核次数、通过数、驳回数、最近审核时间
   *
   * @description 基于 course_reviews 表汇总。
   *              超管可查看全部审核员的统计。
   *              审核员只能查看自己的统计信息。
   *              v4.1 新增功能。
   */
  @Get('reviewer-workload')
  @Roles(Role.SUPER_ADMIN, Role.REVIEWER)
  async getReviewerWorkload(
    @CurrentUser('sub') userId: number,
    @CurrentUser('role') role: string,
  ) {
    const isAdmin = role === Role.SUPER_ADMIN;
    const workload = await this.adminService.getReviewerWorkload(userId, isAdmin);
    return ApiResponse.success(workload);
  }
}
