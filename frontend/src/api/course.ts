/**
 * 课程 API 层
 * 功能描述：封装课程相关的所有 HTTP 请求，覆盖三端（教师端/管理端/客户端）的接口调用
 *
 * 后端基础路径：/api/v1/courses
 */
import { get, post, put, del, patch } from './request';

// ============ 类型定义 ============

/** 课程状态：draft-草稿 pending-待审核 approved-已上架 rejected-已驳回 off_shelf-已下架 */
export type CourseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'off_shelf';

/** 课程类型：single-单课程 series-系列课程 */
export type CourseType = 'single' | 'series';

/** 课程基础信息接口 */
export interface CourseInfo {
  id: number;
  title: string;
  cover: string;
  description: string;
  categoryId: number;
  category?: { id: number; name: string };
  teacherId: number;
  courseType: CourseType;
  price: number;
  originalPrice: number;
  status: CourseStatus;
  previewDuration: number;
  trailerVideoId?: number;
  tags: string;
  studentCount: number;
  rating: number;
  reviewCount: number;
  isRecommended: boolean;
  sortOrder: number;
  chapters?: ChapterInfo[];
  /** 审核评论（驳回原因） */
  reviewComment?: string;
  /** 审核员ID */
  reviewerId?: number;
  /** 审核时间 */
  reviewedAt?: string;
  /** 待编辑标记（已上架课程编辑后标记） */
  pendingEdit?: boolean;
  /** 待下架标记（待审核下架申请） */
  pendingOffShelf?: boolean;
  /** 推荐/置顶标记 */
  isFeatured?: boolean;
  /** 课时数量（列表接口返回，后端通过 loadRelationCountAndMap 填充） */
  lessonCount?: number;
  /** 课时列表（详情接口返回） */
  lessons?: { length: number } | any[];
  createdAt: string;
  updatedAt: string;
}

/** 章节信息接口 */
export interface ChapterInfo {
  id: number;
  courseId: number;
  title: string;
  description: string;
  sortOrder: number;
  lessons?: LessonInfo[];
  createdAt: string;
  updatedAt: string;
}

/** 课时信息接口 */
export interface LessonInfo {
  id: number;
  chapterId: number;
  title: string;
  description: string;
  duration: number;
  videoId: number;
  videoUrl: string;
  sortOrder: number;
  isFree: boolean;
  /** 是否支持单独购买（仅系列课有效） */
  canSinglePurchase?: boolean;
  /** 单独购买价格（单位：分） */
  singlePrice?: number;
  createdAt: string;
  updatedAt: string;
}

/** 分类信息接口 */
export interface CategoryInfo {
  id: number;
  name: string;
  icon: string;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/** 创建课程参数 */
export interface CreateCourseParams {
  title: string;
  cover?: string;
  description?: string;
  categoryId: number;
  courseType: CourseType;
  price?: number;
  originalPrice?: number;
  previewDuration?: number;
  trailerUrl?: string;
  tags?: string;
}

/** 更新课程参数 */
export interface UpdateCourseParams extends Partial<CreateCourseParams> {}

/** 创建章节参数 */
export interface CreateChapterParams {
  title: string;
  description?: string;
  sortOrder?: number;
}

/** 更新章节参数 */
export interface UpdateChapterParams extends Partial<CreateChapterParams> {}

/** 创建课时参数（系列课程下需要 chapterId，单课程不需要） */
export interface CreateLessonParams {
  title: string;
  description?: string;
  duration?: number;
  videoId?: number;
  sortOrder?: number;
  isFree?: boolean;
  /** 是否支持单独购买（仅系列课有效） */
  canSinglePurchase?: boolean;
  /** 单独购买价格（单位：元，仅 canSinglePurchase=true 时有效） */
  singlePrice?: number;
  /** 章节ID（系列课程必填，单课程不传） */
  chapterId?: number;
}

/** 更新课时参数 */
export interface UpdateLessonParams extends Partial<CreateLessonParams> {}

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

/** 课程查询参数（status 允许空字符串表示"全部"） */
export interface CourseQuery {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  courseType?: CourseType;
  status?: CourseStatus | '';
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ============ 分类 API ============

/**
 * 获取所有分类列表
 * @returns 分类列表
 */
export function getCategories(): Promise<CategoryInfo[]> {
  return get('/categories');
}

/**
 * 获取分类分页列表（管理端）
 * @param params 分页参数
 * @returns 分类列表（含分页）
 */
export function getCategoriesPage(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<CategoryInfo>> {
  return get('/categories/page', { params });
}

/**
 * 管理端强制删除课程（超级管理员专用）
 * 功能描述：管理端删除课程，会级联删除课程下的所有关联数据（章节、课时、视频、附件）
 * @param id 课程ID
 */
export function adminDeleteCourse(id: number): Promise<void> {
  return del(`/courses/admin/${id}`);
}

/**
 * 更新分类（管理端）
 * @param id 分类ID
 * @param data 更新数据
 * @returns 更新后的分类
 */
export function updateCategory(
  id: number,
  data: { name?: string; icon?: string; sortOrder?: number; status?: number }
): Promise<CategoryInfo> {
  return put(`/categories/${id}`, data);
}

/**
 * 删除分类（管理端）
 * @param id 分类ID
 */
export function deleteCategory(id: number): Promise<void> {
  return del(`/categories/${id}`);
}

// ============ 课程 API（公开/客户端） ============

/**
 * 获取已上架课程列表（公开接口）
 * @param params 查询参数
 * @returns 课程列表（含分页）
 */
export function getPublishedCourses(
  params: CourseQuery
): Promise<PaginatedResponse<CourseInfo>> {
  return get('/courses', { params });
}

/**
 * 获取课程详情（公开接口）
 * @param id 课程ID
 * @returns 课程详情（含章节、课时）
 */
export function getCourseDetail(id: number): Promise<CourseInfo> {
  return get(`/courses/${id}`);
}

// ============ 课程 API（教师端） ============

/**
 * 获取我的课程列表（教师端）
 * @param params 查询参数
 * @returns 课程列表（含分页）
 */
export function getMyCourses(
  params: CourseQuery
): Promise<PaginatedResponse<CourseInfo>> {
  return get('/courses/teacher', { params });
}

/**
 * 创建课程（教师端）
 * @param data 课程数据
 * @returns 创建的课程信息
 */
export function createCourse(data: CreateCourseParams): Promise<CourseInfo> {
  return post('/courses', data);
}

/**
 * 更新课程（教师端）
 * @param id 课程ID
 * @param data 更新数据
 * @returns 更新后的课程信息
 */
export function updateCourse(
  id: number,
  data: UpdateCourseParams
): Promise<CourseInfo> {
  return put(`/courses/${id}`, data);
}

/**
 * 删除课程（教师端）
 * @param id 课程ID
 */
export function deleteCourse(id: number): Promise<void> {
  return del(`/courses/${id}`);
}

/**
 * 更新课程状态
 * @param id 课程ID
 * @param status 目标状态
 * @returns 更新后的课程信息
 */
export function updateCourseStatus(
  id: number,
  status: CourseStatus
): Promise<CourseInfo> {
  return patch(`/courses/${id}/status`, { status });
}

/**
 * 申请下架课程（教师端）
 * 功能描述：教师从已上架课程点击下架，提交下架申请（走审核流程）
 * @param id 课程ID
 * @returns 更新后的课程信息（状态变为 pending）
 */
export function requestOffShelf(id: number): Promise<CourseInfo> {
  return post(`/courses/${id}/request-off-shelf`);
}

/**
 * 撤回审核申请（教师端）
 * 功能描述：教师撤回处于待审核状态的课程申请，根据申请类型回到对应状态
 *          - 新创建课程 → 草稿
 *          - 编辑修改课程 → 恢复已上架
 *          - 申请下架课程 → 恢复已上架
 * @param id 课程ID
 * @returns 更新后的课程信息
 */
export function withdrawReview(id: number): Promise<CourseInfo> {
  return post(`/courses/${id}/withdraw-review`);
}

// ============ 课程 API（管理端） ============

/**
 * 获取所有课程列表（管理端）
 * @param params 查询参数
 * @returns 课程列表（含分页）
 */
export function getAllCourses(
  params: CourseQuery
): Promise<PaginatedResponse<CourseInfo>> {
  return get('/courses/admin', { params });
}

// ============ 章节 API（教师端） ============

/**
 * 获取课程的章节列表
 * @param courseId 课程ID
 * @returns 章节列表
 */
export function getChapters(courseId: number): Promise<ChapterInfo[]> {
  return get(`/courses/${courseId}/chapters`);
}

/**
 * 创建章节
 * @param courseId 课程ID
 * @param data 章节数据
 * @returns 创建的章节信息
 */
export function createChapter(
  courseId: number,
  data: CreateChapterParams
): Promise<ChapterInfo> {
  return post(`/courses/${courseId}/chapters`, data);
}

/**
 * 更新章节
 * @param courseId 课程ID
 * @param chapterId 章节ID
 * @param data 更新数据
 * @returns 更新后的章节信息
 */
export function updateChapter(
  courseId: number,
  chapterId: number,
  data: UpdateChapterParams
): Promise<ChapterInfo> {
  return put(`/courses/${courseId}/chapters/${chapterId}`, data);
}

/**
 * 删除章节
 * @param courseId 课程ID
 * @param chapterId 章节ID
 */
export function deleteChapter(
  courseId: number,
  chapterId: number
): Promise<void> {
  return del(`/courses/${courseId}/chapters/${chapterId}`);
}

/**
 * 更新章节排序
 * @param courseId 课程ID
 * @param chapterIds 排序后的章节ID数组
 */
export function reorderChapters(
  courseId: number,
  chapterIds: number[]
): Promise<void> {
  return put(`/courses/${courseId}/chapters/reorder`, { chapterIds });
}

// ============ 课时 API（教师端） ============

/**
 * 获取章节的课时列表
 * @param courseId 课程ID
 * @param chapterId 章节ID
 * @returns 课时列表
 */
export function getLessons(
  courseId: number,
  chapterId: number
): Promise<LessonInfo[]> {
  return get(`/courses/${courseId}/chapters/${chapterId}/lessons`);
}

/**
 * 创建课时（系列课程，关联章节）
 * @param courseId 课程ID
 * @param chapterId 章节ID
 * @param data 课时数据
 * @returns 创建的课时信息
 */
export function createLesson(
  courseId: number,
  chapterId: number,
  data: CreateLessonParams
): Promise<LessonInfo> {
  return post(`/courses/${courseId}/chapters/${chapterId}/lessons`, data);
}

/**
 * 获取课程下所有课时（不区分章节）
 * 功能描述：主要用于单课程场景，获取课程直接关联的课时列表
 * @param courseId 课程ID
 * @returns 课时列表
 */
export function getCourseLessons(courseId: number): Promise<LessonInfo[]> {
  return get(`/courses/${courseId}/lessons`);
}

/**
 * 为单课程创建课时（不关联章节）
 * 功能描述：单课程只有一个课时，直接挂在课程下，无需章节
 * @param courseId 课程ID
 * @param data 课时数据（不需要 chapterId）
 * @returns 创建的课时信息
 */
export function createCourseLesson(
  courseId: number,
  data: Omit<CreateLessonParams, 'chapterId'>
): Promise<LessonInfo> {
  return post(`/courses/${courseId}/lessons`, data);
}

/**
 * 更新单课程的课时（不关联章节）
 * 功能描述：更新课程直接关联的课时，用于单课程场景
 * @param courseId 课程ID
 * @param lessonId 课时ID
 * @param data 更新数据
 * @returns 更新后的课时信息
 */
export function updateCourseLesson(
  courseId: number,
  lessonId: number,
  data: Omit<UpdateLessonParams, 'chapterId'>
): Promise<LessonInfo> {
  return put(`/courses/${courseId}/lessons/${lessonId}`, data);
}

/**
 * 更新课时
 * @param courseId 课程ID
 * @param chapterId 章节ID
 * @param lessonId 课时ID
 * @param data 更新数据
 * @returns 更新后的课时信息
 */
export function updateLesson(
  courseId: number,
  chapterId: number,
  lessonId: number,
  data: UpdateLessonParams
): Promise<LessonInfo> {
  return put(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, data);
}

/**
 * 删除课时
 * @param courseId 课程ID
 * @param chapterId 章节ID
 * @param lessonId 课时ID
 */
export function deleteLesson(
  courseId: number,
  chapterId: number,
  lessonId: number
): Promise<void> {
  return del(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`);
}

/**
 * 更新课时排序
 * @param courseId 课程ID
 * @param chapterId 章节ID
 * @param lessonIds 排序后的课时ID数组
 */
export function reorderLessons(
  courseId: number,
  chapterId: number,
  lessonIds: number[]
): Promise<void> {
  return put(`/courses/${courseId}/chapters/${chapterId}/lessons/reorder`, { lessonIds });
}

// ============ 视频 API（用于课时关联） ============

/**
 * 上传视频文件
 * @param file 视频文件
 * @param config 上传配置（含进度回调）
 * @returns 上传后的视频信息
 */
export async function uploadVideo(
  file: File,
  config?: {
    onProgress?: (percent: number) => void;
  }
): Promise<{
  id: number;
  originalName: string;
  fileSize: number;
  mimeType: string;
  duration: number;
}> {
  const formData = new FormData();
  formData.append('file', file);

  // 使用 axios 实例直接上传（需要支持 multipart/form-data）
  const axios = (await import('./request')).default;
  return axios.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (config?.onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        config.onProgress(percent);
      }
    },
  }) as any;
}

/**
 * 获取我的视频列表
 * @param params 分页参数
 * @returns 视频列表
 */
export function getMyVideos(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<any>> {
  return get('/videos/my', { params });
}

/**
 * 获取视频播放地址（临时签名URL）
 * @param id 视频ID
 * @returns 临时播放URL
 */
export function getVideoPlayUrl(id: number): Promise<{ url: string }> {
  return get(`/videos/${id}/play-url`);
}

/**
 * 删除视频
 * @param id 视频ID
 */
export function deleteVideo(id: number): Promise<void> {
  return del(`/videos/${id}`);
}

// ============ 审核 API（管理端） ============

/**
 * 获取待审核的课程列表（审核员用）
 * @param params 分页参数
 * @returns 待审核课程列表
 */
export function getPendingReviews(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<CourseInfo>> {
  return get('/courses/pending-review', { params });
}

/**
 * 获取待审核课程数量（审核员控制台用）
 * @returns 待审核课程数量
 */
export function getPendingCourseCount(): Promise<{ count: number }> {
  return get('/courses/stats/pending-count');
}

/**
 * 审核课程（通过/驳回）
 * @param id 课程ID
 * @param data 审核参数
 * @returns 更新后的课程信息
 */
export function reviewCourse(
  id: number,
  data: { approved: boolean; comment?: string }
): Promise<CourseInfo> {
  return post(`/courses/${id}/review`, data);
}

/**
 * 获取课程的审核历史记录
 * @param id 课程ID
 * @returns 审核历史列表
 */
export function getReviewHistory(id: number): Promise<any[]> {
  return get(`/courses/${id}/reviews`);
}

// ============ 推荐/置顶 API（管理端） ============

/**
 * 设置课程推荐/置顶
 * @param id 课程ID
 * @param isRecommended 是否推荐
 * @returns 更新后的课程信息
 */
export function setCourseFeatured(
  id: number,
  isRecommended: boolean
): Promise<CourseInfo> {
  return patch(`/courses/${id}/featured`, { isRecommended });
}

// ============ 课程购买与播放相关 API ==========

/**
 * 检查用户是否已购买课程
 * @param id 课程ID
 * @returns 是否已购买
 */
export function checkCoursePurchased(id: number): Promise<{ purchased: boolean }> {
  return get(`/courses/${id}/purchase-status`);
}

/**
 * 获取已购买课程列表（制作人端）
 * @returns 已购买的课程列表
 */
export function getPurchasedCourses(): Promise<CourseInfo[]> {
  return get('/courses/my/purchased');
}

/**
 * 检查课时播放权限
 * @param courseId 课程ID
 * @param lessonId 课时ID
 * @returns 播放权限信息
 */
export function checkLessonAccess(
  courseId: number,
  lessonId: number,
): Promise<{
  hasAccess: boolean;
  accessType: 'full' | 'trial' | 'none';
  previewDuration: number;
}> {
  return get(`/courses/${courseId}/lessons/${lessonId}/access`);
}

/**
 * 获取课程变更对比数据（审核员用）
 * @param id 课程ID
 * @returns 变更字段列表（字段名、标签、旧值、新值）
 *
 * @description 对比课程当前数据与 previousData 快照，返回哪些字段被修改了
 */
export function getCourseDiff(id: number): Promise<{ field: string; label: string; oldValue: string; newValue: string }[]> {
  return get(`/courses/${id}/diff`);
}

// ============ v2.8: 教师仪表盘 & 制作人管理 API ============

/**
 * 获取教师仪表盘统计数据（v2.8）
 * @returns 仪表盘统计数据
 */
export function getTeacherStats(): Promise<{
  totalCourses: number;
  totalStudents: number;
  pendingReviewCount: number;
  totalEarnings: number;
}> {
  return get('/courses/teacher/stats');
}

/**
 * 获取已购课制作人列表（教师端 v2.8）
 * @param params 分页参数
 * @returns 制作人列表（含分页）
 */
export function getTeacherProducers(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<{
  userId: number;
  nickname: string;
  avatar: string;
  courseId: number;
  courseTitle: string;
  price: number;
  purchasedAt: string;
}>> {
  return get('/courses/teacher/producers', { params });
}

// ============ 收益 API（v2.8） ============

/**
 * 获取教师收益统计数据（v2.8）
 * 功能描述：返回教师的收益概览，包括总收入、可提现余额、待结算金额等
 * @returns 收益统计数据
 */
export interface EarningsStats {
  totalEarnings: number;
  balance: number;
  pendingSettlement: number;
  totalWithdrawn: number;
  paymentAccount: string;
  bankAccount: string;
  bankBranch: string;
}

export function getEarningsStats(): Promise<EarningsStats> {
  return get('/earnings/stats');
}

/**
 * 获取收益明细列表（v2.8）
 * @param params 分页和筛选参数
 * @returns 收益明细列表（含分页）
 */
export function getEarningsDetail(params: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<{
  id: number;
  amount: number;
  actualAmount: number;
  type: string;
  status: string;
  remark: string;
  courseTitle: string;
  createdAt: string;
}>> {
  return get('/earnings/detail', { params });
}

/**
 * 获取提现记录列表（v2.8）
 * @param params 分页参数
 * @returns 提现记录列表（含分页）
 */
export function getWithdrawals(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<{
  id: number;
  amount: number;
  status: string;
  accountInfo: string;
  remark: string;
  createdAt: string;
  processedAt: string;
}>> {
  return get('/earnings/withdrawals', { params });
}

/**
 * 申请提现（v5.1）
 * 功能描述：教师发起提现申请。
 *          教师只需输入提现金额，收款账号从教师个人设置中自动读取。
 * @param data 提现参数（仅需金额）
 * @returns 提现申请结果
 */
export function applyWithdrawal(data: {
  amount: number;
}): Promise<void> {
  return post('/earnings/withdrawals', data);
}

// ============ 教师设置 API（v2.8） ============

/**
 * 更新教师设置（v2.8）
 * 功能描述：更新教师的个人设置，包括收款账号等信息
 * @param data 设置数据
 * @returns 更新后的教师信息
 */
export function updateTeacherSettings(data: {
  paymentAccount?: string;
  bankAccount?: string;
  bankBranch?: string;
  notificationEnabled?: boolean;
}): Promise<void> {
  return put('/teachers/settings', data);
}

// ============ 视频试看 API ============

/**
 * 获取视频试看播放地址
 * @param id 视频ID
 * @param previewDuration 试看时长（秒），默认300
 * @returns 临时播放URL和试看时长
 */
export function getVideoPreviewUrl(
  id: number,
  previewDuration?: number
): Promise<{ url: string; previewDuration: number }> {
  const params = previewDuration ? { previewDuration } : undefined;
  return get(`/videos/${id}/preview-url`, { params });
}
