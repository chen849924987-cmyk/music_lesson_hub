/**
 * 评价 API 层
 *
 * 功能描述：封装课程评价相关的所有 HTTP 请求，包括发表评价、教师回复、评价列表查询等。
 *
 * 后端基础路径：/api/v1/courses/:courseId/evaluations
 *
 * @packageDocumentation
 */
import { get, post } from './request';

// ============ 类型定义 ============

/** 评价信息接口 */
export interface EvaluationInfo {
  id: number;
  courseId: number;
  userId: number;
  rating: number;
  content: string | null;
  replyContent: string | null;
  repliedAt: string | null;
  isVisible: boolean;
  /** 是否为已购用户的评价（已购用户展示"已购"标识，计入总评分） */
  isPurchased: boolean;
  course?: { id: number; title: string };
  user?: { id: number; nickname: string; avatar: string };
  createdAt: string;
  updatedAt: string;
}

/** 创建评价参数 */
export interface CreateEvaluationParams {
  rating: number;
  content?: string;
}

/** 回复评价参数 */
export interface ReplyEvaluationParams {
  replyContent: string;
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

/** 用户是否已评价查询结果 */
export interface CheckEvaluatedResult {
  evaluated: boolean;
  evaluation?: EvaluationInfo;
}

// ============ 评价 API ============

/**
 * 发表课程评价
 * 功能描述：已购制作人对课程发表评价，包含评分和文字内容。
 *
 * @param courseId - 课程ID
 * @param data - 评价参数（评分、文字内容）
 * @returns 创建的评价信息
 */
export function createEvaluation(
  courseId: number,
  data: CreateEvaluationParams,
): Promise<EvaluationInfo> {
  return post(`/courses/${courseId}/evaluations`, data);
}

/**
 * 获取课程评价列表（公开）
 * 功能描述：分页获取指定课程的所有可见评价，无需登录即可访问。
 *
 * @param courseId - 课程ID
 * @param params - 分页参数
 * @returns 评价列表和分页信息
 */
export function getCourseEvaluations(
  courseId: number,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<EvaluationInfo>> {
  return get(`/courses/${courseId}/evaluations`, { params });
}

/**
 * 检查当前用户是否已评价该课程
 * 功能描述：查询当前登录用户是否已对指定课程发表过评价。
 *
 * @param courseId - 课程ID
 * @returns 是否已评价及评价信息
 */
export function checkUserEvaluated(
  courseId: number,
): Promise<CheckEvaluatedResult> {
  return get(`/courses/${courseId}/evaluations/check`);
}

/**
 * 教师回复评价
 * 功能描述：课程教师回复制作人的评价，仅教师身份可调用。
 *
 * @param courseId - 课程ID
 * @param evaluationId - 评价ID
 * @param data - 回复内容
 * @returns 更新后的评价信息
 */
export function replyEvaluation(
  courseId: number,
  evaluationId: number,
  data: ReplyEvaluationParams,
): Promise<EvaluationInfo> {
  return post(`/courses/${courseId}/evaluations/${evaluationId}/reply`, data);
}
