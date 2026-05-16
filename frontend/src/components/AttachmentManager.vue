<!--
 * AttachmentManager - 课程附件管理器组件
 *
 * 功能描述：提供课程附件（课件、乐谱等）的上传、列表展示、下载、删除等功能
 *          附件审核状态独立展示，未审核通过的附件不对外展示但教师端可见
 *
 * 设计参考：Vuestic UI 设计规范，使用 --va-* CSS 变量实现双主题适配
 *
 * @param {number} courseId - 课程ID（必传）
 * @param {number|null} lessonId - 课时ID（可选，系列课程中附件挂在具体课时下）
 * @param {boolean} readonly - 是否为只读模式（用于学生端查看已审核通过的附件，默认 false）
 * @param {boolean} showOnlyApproved - 是否只显示已审核通过的附件（用于学生端，默认 false）
 -->

<template>
  <div class="attachment-manager">
    <!-- 标题区域 -->
    <div class="attachment-header">
      <h2 class="attachment-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        课程资料
      </h2>
      <div v-if="!readonly" class="attachment-header__actions">
        <button class="btn btn-primary btn-sm" @click="showUploadDialog = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          上传资料
        </button>
      </div>
    </div>

    <div class="section-desc" v-if="!readonly">
      上传课件、乐谱等课程资料。资料需要审核通过后学生才能查看，审核期间不影响课程正常展示。
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton skeleton-line" v-for="i in 3" :key="i"></div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="attachments.length === 0" class="empty-state">
      <div class="empty-state__icon">📁</div>
      <p class="empty-state__text">暂无课程资料</p>
      <p class="empty-state__hint" v-if="!readonly">点击"上传资料"按钮添加课件或乐谱</p>
    </div>

    <!-- 附件列表 -->
    <div v-else class="attachment-list">
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="attachment-item"
      >
        <!-- 文件图标 -->
        <div class="attachment-item__icon">
          <span class="attachment-icon">{{ getTypeIcon(attachment.attachmentType) }}</span>
        </div>

        <!-- 文件信息 -->
        <div class="attachment-item__info">
          <span class="attachment-item__name" :title="attachment.originalName">
            {{ attachment.originalName }}
          </span>
          <span class="attachment-item__meta">
            <span class="text-muted">{{ formatFileSize(attachment.fileSize) }}</span>
            <span v-if="attachment.attachmentType" class="badge badge--info">
              {{ getTypeLabel(attachment.attachmentType) }}
            </span>
            <!-- 审核状态标签（教师端展示） -->
            <span
              v-if="!showOnlyApproved"
              class="badge"
              :class="statusBadgeClass(attachment.status)"
            >
              {{ getStatusLabel(attachment.status) }}
            </span>
            <!-- 驳回原因 -->
            <span v-if="attachment.status === 'rejected' && attachment.reviewComment" class="review-comment" :title="attachment.reviewComment">
              驳回：{{ attachment.reviewComment }}
            </span>
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="attachment-item__actions">
          <button
            class="btn btn-sm btn-secondary"
            @click="handleDownload(attachment)"
            :disabled="downloadingId === attachment.id"
            :title="attachment.status === 'pending' ? '审核通过后可下载' : '下载文件'"
          >
            {{ downloadingId === attachment.id ? '下载中...' : '下载' }}
          </button>
          <button
            v-if="!readonly"
            class="btn btn-sm btn-text text-danger"
            @click="confirmDelete(attachment)"
            :disabled="deletingId === attachment.id"
          >
            {{ deletingId === attachment.id ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ 上传弹窗 ============ -->
    <div v-if="showUploadDialog" class="modal-overlay" @click.self="showUploadDialog = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">上传课程资料</h3>
          <button class="modal-close" @click="showUploadDialog = false">&times;</button>
        </div>
        <div class="modal-body">
          <!-- 附件类型选择 -->
          <div class="form-group">
            <label class="form-label">资料类型 <span class="required">*</span></label>
            <div class="type-selector">
              <button
                v-for="type in attachmentTypeOptions"
                :key="type.value"
                class="type-selector__item"
                :class="{ 'type-selector__item--active': uploadForm.attachmentType === type.value }"
                @click="uploadForm.attachmentType = type.value"
              >
                <span class="type-selector__icon">{{ type.icon }}</span>
                <span class="type-selector__label">{{ type.label }}</span>
              </button>
            </div>
          </div>

          <!-- 文件上传区域 -->
          <div class="form-group">
            <label class="form-label">选择文件 <span class="required">*</span></label>

            <!-- 未上传状态 -->
            <div
              v-if="!uploadFileSelected && !uploadProgressActive"
              class="upload-area"
              @drop.prevent="handleFileDrop"
              @dragover.prevent
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                style="display:none"
                @change="handleFileSelect"
              />
              <div class="upload-placeholder">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>点击或拖拽文件到此处</p>
                <span class="text-muted text-sm">支持 PDF、Word、Excel、图片等常见格式，最大 200MB</span>
              </div>
            </div>

            <!-- 已选文件预览 -->
            <div v-if="uploadFileSelected && !uploadProgressActive" class="file-preview">
              <div class="file-preview__icon">{{ getFileEmoji(uploadFileName) }}</div>
              <div class="file-preview__info">
                <span class="file-preview__name">{{ uploadFileName }}</span>
                <span class="text-muted text-sm">{{ formatFileSize(uploadFileSize) }}</span>
              </div>
              <button class="btn btn-sm btn-text text-danger" @click="clearFileSelection">移除</button>
            </div>

            <!-- 上传进度 -->
            <div v-if="uploadProgressActive" class="upload-area">
              <div class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-bar__fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <span class="text-sm">{{ uploadProgress }}%</span>
                <span class="text-muted text-sm" v-if="uploadProgress === 100">正在处理...</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showUploadDialog = false">取消</button>
          <button
            class="btn btn-primary"
            @click="handleUpload"
            :disabled="!uploadFileSelected || uploading"
          >
            {{ uploading ? '上传中...' : '开始上传' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ 删除确认弹窗 ============ -->
    <div v-if="deleteConfirmVisible && deleteTarget" class="modal-overlay" @click.self="deleteConfirmVisible = false">
      <div class="modal-dialog modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button class="modal-close" @click="deleteConfirmVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除附件「{{ deleteTarget.originalName }}」吗？</p>
          <p class="text-muted text-sm">删除后不可恢复，文件将从存储中移除。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="deleteConfirmVisible = false">取消</button>
          <button class="btn btn-danger" @click="handleDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AttachmentManager 组件
 *
 * @description 管理课程的附件（课件、乐谱等），支持上传、下载、删除
 *              附件审核状态独立管理，不通过不影响课程
 *
 * @param {number} courseId - 课程ID
 * @param {number|null} lessonId - 课时ID（可选，系列课程中附件挂在具体课时下）
 * @param {boolean} readonly - 只读模式（学生端查看）
 * @param {boolean} showOnlyApproved - 只显示已审核通过的附件
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  uploadAttachment,
  getCourseAttachments,
  getLessonAttachments,
  getAttachmentDownloadUrl,
  deleteAttachment,
  formatFileSize,
  AttachmentType,
  AttachmentStatus,
  AttachmentTypeLabels,
  AttachmentStatusLabels,
  type AttachmentInfo,
} from '../api/attachment';

const props = withDefaults(defineProps<{
  courseId: number;
  lessonId?: number | null;
  readonly?: boolean;
  showOnlyApproved?: boolean;
}>(), {
  lessonId: null,
  readonly: false,
  showOnlyApproved: false,
});

/** 附件类型选择选项 */
const attachmentTypeOptions = [
  { value: AttachmentType.COURSEWARE, label: '课件', icon: '📄' },
  { value: AttachmentType.SCORE, label: '乐谱', icon: '🎵' },
  { value: AttachmentType.OTHER, label: '其他', icon: '📎' },
];

/** 附件列表 */
const attachments = ref<AttachmentInfo[]>([]);
const loading = ref(true);
const showUploadDialog = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadProgressActive = ref(false);
const uploadFileSelected = ref(false);
const uploadFileName = ref('');
const uploadFileSize = ref(0);
const uploadFileRaw = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const downloadingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const deleteConfirmVisible = ref(false);
const deleteTarget = ref<AttachmentInfo | null>(null);

/** 上传表单 */
const uploadForm = reactive({
  attachmentType: AttachmentType.COURSEWARE,
});

/**
 * 加载附件列表
 * 如果传入了 lessonId，则按课时加载附件（系列课程场景）
 * 否则按课程加载附件（单课场景）
 */
const loadAttachments = async () => {
  loading.value = true;
  try {
    // 如果传入了 lessonId，则优先按课时加载
    const data = props.lessonId
      ? await getLessonAttachments(props.lessonId)
      : await getCourseAttachments(props.courseId);
    attachments.value = props.showOnlyApproved
      ? data.filter((a: AttachmentInfo) => a.status === AttachmentStatus.APPROVED)
      : data;
  } catch (error: any) {
    // 静默处理，不打断用户
    attachments.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 获取附件类型的中文标签
 * @param type - 附件类型
 * @returns 中文标签
 */
const getTypeLabel = (type: AttachmentType): string => {
  return AttachmentTypeLabels[type] || '其他';
};

/**
 * 获取附件审核状态的中文标签
 * @param status - 附件状态
 * @returns 中文标签
 */
const getStatusLabel = (status: AttachmentStatus): string => {
  return AttachmentStatusLabels[status] || '未知';
};

/**
 * 获取附件类型的图标
 * @param type - 附件类型
 * @returns 图标emoji
 */
const getTypeIcon = (type: AttachmentType): string => {
  switch (type) {
    case AttachmentType.COURSEWARE: return '📄';
    case AttachmentType.SCORE: return '🎵';
    case AttachmentType.OTHER: return '📎';
    default: return '📎';
  }
};

/**
 * 获取审核状态的 badge 样式类
 * @param status - 审核状态
 * @returns CSS 类名
 */
const statusBadgeClass = (status: AttachmentStatus): string => {
  switch (status) {
    case AttachmentStatus.PENDING: return 'badge--warning';
    case AttachmentStatus.APPROVED: return 'badge--success';
    case AttachmentStatus.REJECTED: return 'badge--danger';
    default: return 'badge--info';
  }
};

/**
 * 根据文件名获取文件类型的 emoji 图标
 * @param fileName - 文件名
 * @returns emoji 图标
 */
const getFileEmoji = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const pdfExts = ['pdf'];
  const docExts = ['doc', 'docx', 'wps'];
  const excelExts = ['xls', 'xlsx', 'csv'];
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const pptExts = ['ppt', 'pptx'];
  const txtExts = ['txt', 'md'];

  if (pdfExts.includes(ext)) return '📕';
  if (docExts.includes(ext)) return '📘';
  if (excelExts.includes(ext)) return '📊';
  if (imgExts.includes(ext)) return '🖼️';
  if (pptExts.includes(ext)) return '📙';
  if (txtExts.includes(ext)) return '📝';
  return '📎';
};

/**
 * 触发文件选择
 */
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

/**
 * 处理文件选择
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) selectFile(file);
};

/**
 * 处理文件拖拽
 */
const handleFileDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0];
  if (file) selectFile(file);
};

/**
 * 选择文件后的统一处理
 * @param file - 选中的文件
 */
const selectFile = (file: File) => {
  // 校验文件大小（200MB 限制）
  const maxSize = 200 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.warning('文件大小不能超过 200MB');
    return;
  }
  uploadFileRaw.value = file;
  uploadFileName.value = file.name;
  uploadFileSize.value = file.size;
  uploadFileSelected.value = true;
};

/**
 * 清除文件选择
 */
const clearFileSelection = () => {
  uploadFileRaw.value = null;
  uploadFileName.value = '';
  uploadFileSize.value = 0;
  uploadFileSelected.value = false;
  if (fileInputRef.value) fileInputRef.value.value = '';
};

/**
 * 上传文件
 */
const handleUpload = async () => {
  if (!uploadFileRaw.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }

  uploading.value = true;
  uploadProgressActive.value = true;
  uploadProgress.value = 0;

  try {
    await uploadAttachment(
      uploadFileRaw.value,
      {
        courseId: props.courseId,
        attachmentType: uploadForm.attachmentType,
        // 如果传入了 lessonId，上传时一起传递（系列课程场景）
        lessonId: props.lessonId || undefined,
      },
      (progress: number) => {
        uploadProgress.value = progress;
      },
    );

    // 上传成功，刷新列表
    ElMessage.success('文件上传成功，等待审核');
    showUploadDialog.value = false;
    clearFileSelection();
    uploadForm.attachmentType = AttachmentType.COURSEWARE;
    await loadAttachments();
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败，请稍后重试');
  } finally {
    uploading.value = false;
    uploadProgressActive.value = false;
    uploadProgress.value = 0;
  }
};

/**
 * 下载附件
 * @param attachment - 附件信息
 */
const handleDownload = async (attachment: AttachmentInfo) => {
  downloadingId.value = attachment.id;
  try {
    const { url } = await getAttachmentDownloadUrl(attachment.id);
    // 创建一个隐藏的 <a> 标签触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.originalName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败');
  } finally {
    downloadingId.value = null;
  }
};

/**
 * 确认删除附件
 * @param attachment - 附件信息
 */
const confirmDelete = (attachment: AttachmentInfo) => {
  deleteTarget.value = attachment;
  deleteConfirmVisible.value = true;
};

/**
 * 执行删除
 */
const handleDelete = async () => {
  if (!deleteTarget.value) return;

  deletingId.value = deleteTarget.value.id;
  try {
    await deleteAttachment(deleteTarget.value.id);
    ElMessage.success('附件已删除');
    deleteConfirmVisible.value = false;
    deleteTarget.value = null;
    await loadAttachments();
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败');
  } finally {
    deletingId.value = null;
  }
};

onMounted(() => {
  loadAttachments();
});
</script>

<style scoped>
/* ============================================================
 * 附件管理器样式
 * ============================================================ */

.attachment-manager { width: 100%; }

/* ---- 头部 ---- */
.attachment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.attachment-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0;
}
.attachment-header__actions { flex-shrink: 0; }

.section-desc {
  font-size: 0.8125rem;
  color: var(--va-muted);
  margin: -0.5rem 0 1rem;
  line-height: 1.5;
}

/* ---- 加载骨架 ---- */
.loading-state { display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton { border-radius: var(--va-square-border-radius); }
.skeleton-line {
  height: 48px;
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  text-align: center;
}
.empty-state__icon { font-size: 2.5rem; opacity: 0.5; margin-bottom: 0.75rem; }
.empty-state__text { font-size: 0.875rem; color: var(--va-muted); margin: 0; }
.empty-state__hint { font-size: 0.75rem; color: var(--va-muted); margin: 0.5rem 0 0; opacity: 0.7; }

/* ---- 附件列表 ---- */
.attachment-list {
  display: flex;
  flex-direction: column;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
}
.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--va-background-element);
  transition: var(--va-transition);
}
.attachment-item:last-child { border-bottom: none; }
.attachment-item:hover { background-color: var(--va-background-hover); }

.attachment-item__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--va-primary-light-alpha);
  border-radius: var(--va-square-border-radius);
}
.attachment-icon { font-size: 1.125rem; }

.attachment-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.attachment-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--va-on-background-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.attachment-item__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.review-comment {
  font-size: 0.75rem;
  color: var(--va-danger);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.attachment-item__actions {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

/* ---- 上传弹窗 ---- */
.form-group { margin-bottom: 1rem; }
.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  margin-bottom: 0.5rem;
  letter-spacing: var(--va-letter-spacing);
}
.required { color: var(--va-danger); }

/* 附件类型选择器 */
.type-selector {
  display: flex;
  gap: 0.5rem;
}
.type-selector__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  background: none;
  cursor: pointer;
  transition: var(--va-transition);
  min-width: 80px;
}
.type-selector__item:hover { border-color: var(--va-primary); }
.type-selector__item--active {
  border-color: var(--va-primary);
  background-color: var(--va-primary-light-alpha);
}
.type-selector__icon { font-size: 1.5rem; }
.type-selector__label { font-size: 0.75rem; color: var(--va-on-background-primary); }

/* 文件上传区域 */
.upload-area {
  border: 2px dashed var(--va-background-border);
  border-radius: var(--va-block-border-radius);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: var(--va-transition);
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-area:hover { border-color: var(--va-primary); }
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--va-muted);
}
.upload-placeholder p { margin: 0; font-size: 0.875rem; }

/* 已选文件预览 */
.file-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  background-color: var(--va-background-secondary);
}
.file-preview__icon { font-size: 1.5rem; }
.file-preview__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}
.file-preview__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--va-on-background-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 上传进度 */
.upload-progress {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--va-background-element);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar__fill {
  height: 100%;
  background-color: var(--va-primary);
  border-radius: 4px;
  transition: width 0.3s;
  min-width: 2%;
}

/* ---- 弹窗通用 ---- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-dialog {
  background-color: var(--va-background-primary);
  border-radius: var(--va-block-border-radius);
  box-shadow: var(--va-box-shadow);
  width: 480px;
  max-width: 90vw;
}
.modal-sm { width: 400px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: var(--va-block-border);
}
.modal-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--va-on-background-element);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.modal-body { padding: 1.25rem; max-height: 60vh; overflow-y: auto; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: var(--va-block-border);
}

/* ---- 工具类 ---- */
.btn-sm { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
.btn-text { background: none; border: none; color: var(--va-on-background-secondary); cursor: pointer; }
.btn-text:hover { color: var(--va-primary); }
.text-sm { font-size: 0.8125rem; }
.text-muted { color: var(--va-muted); }
.text-danger { color: var(--va-danger) !important; }

/* ---- 骨架动画 ---- */
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 覆盖按钮样式（复用全局） ---- */
.btn-danger {
  background-color: var(--va-danger);
  color: #fff;
  border: none;
  border-radius: var(--va-square-border-radius);
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--va-transition);
}
.btn-danger:hover { opacity: 0.9; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
