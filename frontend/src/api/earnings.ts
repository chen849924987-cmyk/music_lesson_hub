/**
 * 收益 API 层
 * 功能描述：封装收益相关的所有 HTTP 请求，涵盖教师端收益中心和管理端收益看板
 *
 * 后端基础路径：/api/v1/earnings
 */
import { get, post } from './request';

// ============ 类型定义 ============

/** 收益统计数据 */
export interface EarningStats {
  totalEarnings: number;
  balance: number;
  pendingSettlement: number;
  totalWithdrawn: number;
}

/** 平台收益总览（超管用） */
export interface PlatformEarningStats {
  totalRevenue: number;       // 平台总流水（元）
  platformIncome: number;     // 平台分成收入（元）
  teacherEarnings: number;    // 教师总收益（元）
  totalWithdrawn: number;     // 已提现金额（元）
  orderCount: number;         // 付费订单总数
}

/** 每日收益趋势数据点 */
export interface DailyEarningTrend {
  date: string;               // 日期 YYYY-MM-DD
  revenue: number;            // 当日流水（元）
  platformIncome: number;     // 当日平台收入（元）
  teacherEarnings: number;    // 当日教师收益（元）
}

/** 课程收益排行项 */
export interface CourseEarningRank {
  courseId: number;
  courseTitle: string;
  totalAmount: number;        // 总销售金额（元）
  orderCount: number;         // 订单数
}

/** 教师收益排行项 */
export interface TeacherEarningRank {
  teacherId: number;
  teacherName: string;
  totalAmount: number;        // 总收益金额（元）
  orderCount: number;         // 订单数
}

/** 收益明细分页项 */
export interface EarningDetailItem {
  id: number;
  amount: number;
  actualAmount: number;
  type: string;
  status: string;
  remark: string;
  courseTitle: string;
  createdAt: string;
}

/** 提现记录项 */
export interface WithdrawalItem {
  id: number;
  amount: number;
  status: string;
  accountInfo: string;
  remark: string;
  createdAt: string;
  processedAt: string;
}

/** 分页元数据 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ============ 教师端收益 API ============

/**
 * 获取教师收益统计数据
 * GET /api/v1/earnings/stats
 *
 * @returns 收益统计数据（单位：元）
 */
export function getEarningsStats(): Promise<EarningStats> {
  return get('/earnings/stats');
}

/**
 * 获取教师收益明细列表（分页）
 * GET /api/v1/earnings/detail
 *
 * @param params 分页和筛选参数
 * @returns 收益明细列表（含分页）
 */
export function getEarningsDetail(params: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<EarningDetailItem>> {
  return get('/earnings/detail', { params });
}

/**
 * 获取提现记录列表
 * GET /api/v1/earnings/withdrawals
 *
 * @param params 分页参数
 * @returns 提现记录列表（含分页）
 */
export function getWithdrawals(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<WithdrawalItem>> {
  return get('/earnings/withdrawals', { params });
}

/**
 * 申请提现
 * POST /api/v1/earnings/withdrawals
 *
 * @param data 提现参数（金额单位：分，账号信息）
 */
export function applyWithdrawal(data: {
  amount: number;
  accountInfo: string;
}): Promise<void> {
  return post('/earnings/withdrawals', data);
}

// ============ 管理端（超管）收益 API ============

/**
 * 获取平台收益总览（超管用）
 * GET /api/v1/earnings/admin/platform-stats
 *
 * @returns 平台收益统计数据（单位：元）
 */
export function getPlatformEarningStats(): Promise<PlatformEarningStats> {
  return get('/earnings/admin/platform-stats');
}

/**
 * 获取平台收益趋势（超管用）
 * GET /api/v1/earnings/admin/trend
 *
 * @param days 最近N天，默认30
 * @returns 每日收益趋势数组
 */
export function getPlatformEarningTrend(days?: number): Promise<DailyEarningTrend[]> {
  const params = days ? { days } : undefined;
  return get('/earnings/admin/trend', { params });
}

/**
 * 获取课程收益排行榜（超管用）
 * GET /api/v1/earnings/admin/top-courses
 *
 * @param limit 返回条数，默认10
 * @returns 课程收益排行列表
 */
export function getTopEarningCourses(limit?: number): Promise<CourseEarningRank[]> {
  const params = limit ? { limit } : undefined;
  return get('/earnings/admin/top-courses', { params });
}

/**
 * 获取教师收益排行榜（超管用）
 * GET /api/v1/earnings/admin/top-teachers
 *
 * @param limit 返回条数，默认10
 * @returns 教师收益排行列表
 */
export function getTopEarningTeachers(limit?: number): Promise<TeacherEarningRank[]> {
  const params = limit ? { limit } : undefined;
  return get('/earnings/admin/top-teachers', { params });
}
