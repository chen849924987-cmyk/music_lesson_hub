/**
 * 学习进度 API 层
 *
 * 功能描述：封装学习进度的 HTTP 请求，支持进度更新、断点续播查询和课程总进度统计。
 *
 * 后端基础路径：/api/v1/learning
 */
import { get, post } from './request';

// ============ 类型定义 ============

/** 课时学习进度 */
export interface LessonProgress {
  id?: number;
  lessonId: number;
  progress: number;
  lastPosition: number;
  completed: boolean;
  completedAt: string | null;
}

/** 课程总进度统计 */
export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  startedLessons: number;
  progress: number;
}

/** 课时进度精简信息（用于侧边栏展示） */
export interface LessonProgressBrief {
  lessonId: number;
  progress: number;
  lastPosition: number;
  completed: boolean;
}

/** 更新进度请求参数 */
export interface UpdateProgressParams {
  lessonId: number;
  courseId: number;
  lastPosition: number;
  duration: number;
  progress?: number;
}

// ============ 学习进度 API ============

/**
 * 更新课时学习进度
 *
 * @param params - 学习进度数据（lessonId, courseId, lastPosition, duration, progress?）
 * @returns 更新后的学习进度
 *
 * 调用时机：每30秒定时同步 + 暂停时 + 切换课时时
 */
export function updateProgress(
  params: UpdateProgressParams
): Promise<LessonProgress> {
  return post('/learning/progress', params);
}

/**
 * 获取指定课时的学习进度
 *
 * @param lessonId - 课时ID
 * @returns 学习进度信息（含 lastPosition 用于断点续播）
 *
 * 调用时机：进入课时播放时调用
 */
export function getLessonProgress(
  lessonId: number
): Promise<LessonProgress> {
  return get(`/learning/progress/${lessonId}`);
}

/**
 * 获取课程总学习进度统计
 *
 * @param courseId - 课程ID
 * @returns 课程总进度统计（总课时数 / 已完成数 / 已开始数 / 进度百分比）
 */
export function getCourseProgress(
  courseId: number
): Promise<CourseProgress> {
  return get(`/learning/course/${courseId}`);
}

/**
 * 获取课程所有课时的进度列表
 *
 * @param courseId - 课程ID
 * @returns 课时进度列表（用于侧边栏展示每个课时的完成状态）
 */
export function getCourseLessonProgresses(
  courseId: number
): Promise<LessonProgressBrief[]> {
  return get(`/learning/course/${courseId}/lessons`);
}
