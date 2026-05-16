/**
 * 附件管理 API
 * 功能描述：提供课程附件（课件、乐谱等）的 RESTful API 调用方法
 * 包括附件上传、列表查询、下载、删除等操作
 */

import { get, patch, del } from './request';

/** 附件类型枚举（需与后端 AttachmentType 保持一致） */
export enum AttachmentType {
  /** 课件 */
  COURSEWARE = 'courseware',
  /** 乐谱 */
  SCORE = 'score',
  /** 其他 */
  OTHER = 'other',
}

/** 附件审核状态枚举（需与后端 AttachmentStatus 保持一致） */
export enum AttachmentStatus {
  /** 待审核 */
  PENDING = 'pending',
  /** 已通过 */
  APPROVED = 'approved',
  /** 已驳回 */
  REJECTED = 'rejected',
}

/** 附件信息 */
export interface AttachmentInfo {
  id: number;
  userId: number;
  courseId: number;
  /** 关联的课时ID（系列课程的课件挂在具体课时下） */
  lessonId?: number | null;
  originalName: string;
  objectName: string;
  fileSize: number;
  mimeType: string;
  attachmentType: AttachmentType;
  status: AttachmentStatus;
  reviewComment?: string;
  reviewerId?: number;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** 来源课程标题（联表查询填充） */
  courseTitle?: string;
  /** 课程类型：single-单课程 series-系列课程 */
  courseType?: string;
  /** 来源课时标题（系列课的课时级附件联表填充） */
  lessonTitle?: string;
  /** 章节标题（系列课课时所属章节） */
  chapterTitle?: string;
}

/** 附件列表响应 */
export interface AttachmentListResponse {
  items: AttachmentInfo[];
  /** 分页元数据 */
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  /** 兼容旧接口没有 meta 的情况，直接取 total */
  total?: number;
}

/** 附件上传参数 */
export interface UploadAttachmentParams {
  /** 关联的课程ID（通过 multipart/form-data 提交） */
  courseId: number;
  /** 附件类型（可选，默认为 other） */
  attachmentType?: AttachmentType;
  /** 关联的课时ID（可选，系列课程的课件应挂到具体课时下） */
  lessonId?: number;
}

/** 附件类型的中文标签映射 */
export const AttachmentTypeLabels: Record<AttachmentType, string> = {
  [AttachmentType.COURSEWARE]: '课件',
  [AttachmentType.SCORE]: '乐谱',
  [AttachmentType.OTHER]: '其他',
};

/** 附件审核状态的中文标签映射 */
export const AttachmentStatusLabels: Record<AttachmentStatus, string> = {
  [AttachmentStatus.PENDING]: '待审核',
  [AttachmentStatus.APPROVED]: '已通过',
  [AttachmentStatus.REJECTED]: '已驳回',
};

/**
 * 上传附件文件
 * 功能描述：通过 multipart/form-data 上传附件文件，上传后自动创建附件记录（待审核状态）
 * @param file - 要上传的文件（File 对象）
 * @param params - 上传参数（课程ID、附件类型等）
 * @param onProgress - 上传进度回调函数（百分比 0-100）
 * @returns 创建的附件记录
 */
export async function uploadAttachment(
  file: File,
  params: UploadAttachmentParams,
  onProgress?: (progress: number) => void,
): Promise<AttachmentInfo> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('courseId', String(params.courseId));
  if (params.attachmentType) {
    formData.append('attachmentType', params.attachmentType);
  }
  if (params.lessonId) {
    formData.append('lessonId', String(params.lessonId));
  }

  // 使用 XMLHttpRequest 实现上传进度监听
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/v1/attachments/upload`);

    // 注入 Token
    const token = localStorage.getItem('accessToken');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response.data);
        } else {
          reject(new Error(response.message || '上传失败'));
        }
      } catch {
        reject(new Error('解析响应失败'));
      }
    };

    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.send(formData);
  });
}

/**
 * 获取指定课程的所有附件列表
 * @param courseId - 课程ID
 * @returns 附件列表
 */
export async function getCourseAttachments(courseId: number): Promise<AttachmentInfo[]> {
  return get(`/attachments/course/${courseId}`);
}

/**
 * 获取指定课时的所有附件列表
 * @param lessonId - 课时ID
 * @returns 附件列表
 */
export async function getLessonAttachments(lessonId: number): Promise<AttachmentInfo[]> {
  return get(`/attachments/lesson/${lessonId}`);
}

/**
 * 获取当前教师的附件列表（分页）
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @returns 附件列表及总数
 */
export async function getMyAttachments(
  page: number = 1,
  pageSize: number = 20,
): Promise<AttachmentListResponse> {
  return get(`/attachments/my?page=${page}&pageSize=${pageSize}`);
}

/**
 * 获取附件下载地址（签名URL，有时效性）
 * 功能描述：需要附件已审核通过（状态为 APPROVED），普通学员和教师使用此接口
 * @param id - 附件ID
 * @returns 包含临时下载URL的对象
 */
export async function getAttachmentDownloadUrl(id: number): Promise<{ url: string }> {
  return get(`/attachments/${id}/download-url`);
}

/**
 * 获取附件预览地址（审核专用，不要求审核状态）
 * 功能描述：审核员/管理员在审核附件时预览文件内容，不校验附件是否已审核通过
 *          因为预览时附件还处于待审核状态
 * @param id - 附件ID
 * @returns 包含临时预览URL的对象
 */
export async function getAttachmentPreviewUrl(id: number): Promise<{ url: string }> {
  return get(`/attachments/${id}/preview-url`);
}

/**
 * 获取待审核附件列表（带来源信息，审核员/管理员使用）
 * 功能描述：联查课程和课时信息，用于在附件审核页面标注来源
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @returns 带来源信息的待审核附件列表及总数
 */
export async function getPendingAttachmentsWithSource(
  page: number = 1,
  pageSize: number = 20,
): Promise<AttachmentListResponse> {
  return get(`/attachments/pending/with-source?page=${page}&pageSize=${pageSize}`);
}

/**
 * 获取所有待审核附件列表（分页，审核员/管理员使用）
 * @param page - 页码（默认 1）
 * @param pageSize - 每页条数（默认 20）
 * @returns 待审核附件列表及总数
 */
export async function getPendingAttachments(
  page: number = 1,
  pageSize: number = 20,
): Promise<AttachmentListResponse> {
  return get(`/attachments/pending?page=${page}&pageSize=${pageSize}`);
}

/**
 * 获取待审核附件数量（审核员控制台用）
 * @returns 待审核附件数量
 */
export async function getPendingAttachmentCount(): Promise<{ count: number }> {
  return get('/attachments/stats/pending-count');
}

/**
 * 审核附件（通过/驳回）
 * @param id - 附件ID
 * @param status - 审核结果（approved-通过 rejected-驳回）
 * @param reviewComment - 审核意见（驳回时必填）
 */
export async function reviewAttachment(
  id: number,
  status: AttachmentStatus.APPROVED | AttachmentStatus.REJECTED,
  reviewComment?: string,
): Promise<AttachmentInfo> {
  return patch(`/attachments/${id}/review`, {
    status,
    reviewComment: reviewComment || '',
  });
}

/**
 * 删除附件（软删除）
 * @param id - 附件ID
 */
export async function deleteAttachment(id: number): Promise<void> {
  return del(`/attachments/${id}`);
}

/**
 * 格式化文件大小
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的文件大小字符串，如 "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '未知大小';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * 获取附件类型对应的图标（SVG路径或emoji）
 * @param type - 附件类型
 * @returns 图标标识
 */
export function getAttachmentTypeIcon(type: AttachmentType): string {
  switch (type) {
    case AttachmentType.COURSEWARE:
      return '📄';
    case AttachmentType.SCORE:
      return '🎵';
    case AttachmentType.OTHER:
      return '📎';
    default:
      return '📎';
  }
}
