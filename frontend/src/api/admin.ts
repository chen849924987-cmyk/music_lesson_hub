/**
 * 管理端 API 层
 * 功能描述：封装超管后台相关的所有 HTTP 请求，包括统计数据、用户管理、教师管理等
 *
 * 后端基础路径：/api/v1/admin, /api/v1/users, /api/v1/teachers
 */
import { get, patch, del, post } from './request';
import type { PaginatedResponse } from './course';

// ============ 类型定义 ============

/** 控制台统计数据接口 */
export interface AdminStats {
  /** 用户总数 */
  totalUsers: number;
  /** 教师总数 */
  totalTeachers: number;
  /** 制作人（学生）总数 */
  totalStudents: number;
  /** 已上架课程总数 */
  totalCourses: number;
  /** 待审核课程数 */
  pendingCourses: number;
  /** 待审核附件数 */
  pendingAttachments: number;
  /** 总订单数 */
  totalOrders: number;
  /** 已支付订单数 */
  paidOrderCount: number;
  /** 总流水（分） */
  totalRevenue: number;
  /** 教师总收益（分） */
  totalEarnings: number;
}

/** 审核员工作量统计接口（v4.1 新增） */
export interface ReviewerWorkload {
  /** 审核员用户ID */
  reviewerId: number;
  /** 审核员用户名 */
  username: string;
  /** 总审核次数 */
  totalReviews: number;
  /** 通过数 */
  approvedCount: number;
  /** 驳回数 */
  rejectedCount: number;
  /** 最近审核时间 */
  lastReviewAt: string | null;
}

/** 用户信息接口（管理端视图） */
export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 教师信息接口（管理端视图） */
export interface TeacherInfo {
  id: number;
  userId: number;
  realName: string;
  introduction: string;
  specialties: string;
  avatar: string;
  contactInfo: string;
  paymentAccount: string;
  isVerified: boolean;
  courseCount: number;
  studentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  /** 关联的用户信息 */
  user?: {
    id: number;
    username: string;
    nickname: string;
    email: string;
  };
}

// ============ 统计 API ============

/**
 * 获取管理端控制台统计数据
 * GET /api/v1/admin/stats
 * @returns 控制台统计数据
 */
export function getAdminStats(): Promise<AdminStats> {
  return get('/admin/stats');
}

/**
 * 获取审核员工作量统计
 * GET /api/v1/admin/reviewer-workload
 * @returns 每位审核员的审核工作量汇总
 *
 * @description v4.1 新增功能，超管和审核员均可查看
 */
export function getReviewerWorkload(): Promise<ReviewerWorkload[]> {
  return get('/admin/reviewer-workload');
}

// ============ 用户管理 API ============

/**
 * 获取用户列表（管理端）
 * GET /api/v1/users
 * @param params 查询参数（分页、角色筛选、关键词搜索）
 * @returns 用户列表（含分页）
 */
export function getUsers(params: {
  page?: number;
  pageSize?: number;
  role?: string;
  keyword?: string;
}): Promise<PaginatedResponse<UserInfo>> {
  return get('/users', { params });
}

/**
 * 切换用户启用/禁用状态
 * PATCH /api/v1/users/:id/toggle
 * @param id 用户ID
 * @returns 更新后的用户信息
 */
export function toggleUserActive(id: number): Promise<UserInfo> {
  return patch(`/users/${id}/toggle`);
}

/**
 * 删除用户（超级管理员专用）
 * DELETE /api/v1/users/:id
 * @param id 用户ID
 */
export function deleteUser(id: number): Promise<void> {
  return del(`/users/${id}`);
}

/**
 * 创建审核员/运营管理员账号（超级管理员专用）
 * POST /api/v1/auth/accounts/reviewer 或 POST /api/v1/auth/accounts/operator
 * @param params 账号信息
 * @returns 创建的用户信息
 */
export function createAccount(params: {
  username: string;
  password: string;
  role: 'reviewer' | 'operator';
}): Promise<{ id: number; username: string; role: string }> {
  const endpoint = params.role === 'reviewer' ? '/auth/accounts/reviewer' : '/auth/accounts/operator';
  return post(endpoint, {
    username: params.username,
    password: params.password,
  });
}

// ============ 教师管理 API ============

/**
 * 获取教师列表（管理端）
 * GET /api/v1/teachers
 * @param params 分页参数
 * @returns 教师列表（含分页）
 */
export function getTeachers(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<TeacherInfo>> {
  return get('/teachers', { params });
}

/**
 * 审核教师认证（通过/取消认证）
 * PATCH /api/v1/teachers/:id/review
 * @param id 教师记录ID
 * @param approved true=通过认证，false=取消认证
 * @returns 更新后的教师信息
 */
export function reviewTeacher(
  id: number,
  approved: boolean,
): Promise<TeacherInfo> {
  return patch(`/teachers/${id}/review`, { approved });
}
