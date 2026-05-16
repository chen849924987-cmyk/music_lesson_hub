<!--
 * AttachmentReviewPage - 附件审核页面
 *
 * 功能描述：审核员/管理员在此页面审核教师上传的课件、乐谱等附件。
 *           展示附件来源（单课程/系列课程/系列课下的某课时）、文件信息，并提供通过/驳回操作。
 *           v4.1 新增审核员工作量统计面板。
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量实现主题切换
 -->

<template>
  <div class="attachment-review-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">附件审核</h1>
      <p class="page-desc">管理教师上传的课件、乐谱等附件，审核通过后学员方可查看</p>
    </div>

    <!-- 审核列表卡片 -->
    <div class="review-card">
      <!-- 列表头部 -->
      <div class="card-header">
        <div class="card-header-left">
          <span class="badge badge--primary">待审核</span>
          <span class="total-count">共 {{ total }} 项</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div v-for="i in 3" :key="i" class="skeleton skeleton-row"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="attachments.length === 0" class="empty-state">
        <span class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
          </svg>
        </span>
        <p class="empty-text">暂无待审核的附件</p>
      </div>

      <!-- 附件列表 -->
      <div v-else class="attachment-list">
        <div
          v-for="item in attachments"
          :key="item.id"
          class="attachment-item"
          :class="{ 'attachment-item--expanded': expandedId === item.id }"
        >
          <!-- 主信息行 -->
          <div class="item-main" @click="toggleExpand(item.id)">
            <!-- 类型图标 -->
            <span class="item-icon">{{ getAttachmentTypeIcon(item.attachmentType) }}</span>

            <!-- 文件信息 -->
            <div class="item-info">
              <div class="item-name-row">
                <span class="item-name">{{ item.originalName }}</span>
                <span class="item-type badge badge--info">{{ AttachmentTypeLabels[item.attachmentType] }}</span>
              </div>
              <div class="item-meta">
                <span class="meta-size">{{ formatFileSize(item.fileSize) }}</span>
                <span class="meta-sep">·</span>
                <span class="meta-date">上传于 {{ formatDate(item.createdAt) }}</span>
              </div>
            </div>

            <!-- 来源标签 -->
            <div class="item-source">
              <span class="source-label">来源：</span>
              <span class="source-tag" :class="getSourceBadgeClass(item)">
                {{ getSourceLabel(item) }}
              </span>
            </div>

            <!-- 展开指示 -->
            <span class="expand-icon" :class="{ 'expand-icon--open': expandedId === item.id }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>

          <!-- 展开的详情区域 -->
          <div v-if="expandedId === item.id" class="item-detail">
            <div class="detail-grid">
              <div class="detail-field">
                <span class="detail-label">课程标题</span>
                <span class="detail-value">{{ item.courseTitle || '未知课程' }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">附件类型</span>
                <span class="detail-value">{{ AttachmentTypeLabels[item.attachmentType] }}</span>
              </div>
              <div class="detail-field" v-if="item.lessonTitle">
                <span class="detail-label">归属课时</span>
                <span class="detail-value">{{ item.chapterTitle ? `${item.chapterTitle} / ` : '' }}{{ item.lessonTitle }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">文件大小</span>
                <span class="detail-value">{{ formatFileSize(item.fileSize) }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">MIME 类型</span>
                <span class="detail-value">{{ item.mimeType }}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">上传时间</span>
                <span class="detail-value">{{ formatDateTime(item.createdAt) }}</span>
              </div>
            </div>

            <!-- 预览入口 -->
            <div class="preview-section">
              <button
                class="btn btn-secondary btn-sm preview-btn"
                @click="previewAttachment(item)"
                :disabled="previewLoading === item.id"
              >
                {{ previewLoading === item.id ? '加载中...' : '预览附件' }}
              </button>
              <span v-if="item.mimeType" class="preview-hint">
                {{ getPreviewHint(item.mimeType) }}
              </span>
            </div>

            <!-- 审核操作区 -->
            <div class="review-actions">
              <div class="review-comment" v-if="rejectCommentVisible === item.id">
                <span class="detail-label">驳回原因</span>
                <textarea
                  v-model="rejectComment"
                  class="input comment-input"
                  placeholder="请填写驳回原因（必填）"
                  rows="3"
                ></textarea>
              </div>
              <div class="action-buttons">
                <button
                  class="btn btn-primary"
                  :disabled="reviewingId === item.id"
                  @click="handleApprove(item.id)"
                >
                  {{ reviewingId === item.id ? '审核中...' : '通过' }}
                </button>
                <button
                  v-if="rejectCommentVisible !== item.id"
                  class="btn btn-danger"
                  :disabled="reviewingId === item.id"
                  @click="showRejectInput(item.id)"
                >
                  驳回
                </button>
                <template v-if="rejectCommentVisible === item.id">
                  <button
                    class="btn btn-danger"
                    :disabled="!rejectComment.trim() || reviewingId === item.id"
                    @click="handleReject(item.id)"
                  >
                    {{ reviewingId === item.id ? '提交中...' : '确认驳回' }}
                  </button>
                  <button
                    class="btn btn-secondary"
                    :disabled="reviewingId === item.id"
                    @click="cancelReject"
                  >
                    取消
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <button
          class="btn btn-secondary btn-sm"
          :disabled="currentPage <= 1"
          @click="changePage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- ========== 审核员工作量统计面板（与课程审核页面样式统一） ========== -->
    <div class="card workload-section" style="margin-top: 1.5rem;">
      <div class="card__header">
        <div class="card__title">
          <span class="va-title">审核员工作量统计</span>
          <span v-if="workloadList.length > 0" class="badge badge--info">{{ workloadList.length }} 人</span>
        </div>
        <div class="card__actions">
          <button class="btn btn-text" :disabled="workloadLoading" @click="fetchWorkload">
            {{ workloadLoading ? '加载中...' : '刷新' }}
          </button>
        </div>
      </div>

      <div v-if="workloadLoading" class="workload-loading">
        <div v-for="i in 3" :key="i" class="skeleton skeleton--row"></div>
      </div>

      <div v-else-if="workloadList.length === 0" class="empty-state" style="padding: 2rem 1.5rem;">
        <p class="empty-state__text">暂无审核工作量数据</p>
        <p class="empty-state__subtext">完成审核后，统计数据将在此展示</p>
      </div>

      <div v-else class="workload-table">
        <div class="workload-table__header">
          <span class="workload-table__col workload-table__col--name">审核员</span>
          <span class="workload-table__col workload-table__col--count">总审核</span>
          <span class="workload-table__col workload-table__col--count">通过</span>
          <span class="workload-table__col workload-table__col--count">驳回</span>
          <span class="workload-table__col workload-table__col--bar">通过率</span>
          <span class="workload-table__col workload-table__col--date">最近审核</span>
        </div>
        <div
          v-for="item in workloadList"
          :key="item.reviewerId"
          class="workload-table__row"
        >
          <span class="workload-table__col workload-table__col--name">{{ item.username }}</span>
          <span class="workload-table__col workload-table__col--count">{{ item.totalReviews }}</span>
          <span class="workload-table__col workload-table__col--count" style="color: var(--va-success);">{{ item.approvedCount }}</span>
          <span class="workload-table__col workload-table__col--count" style="color: var(--va-danger);">{{ item.rejectedCount }}</span>
          <span class="workload-table__col workload-table__col--bar">
            <div class="workload-bar">
              <div class="workload-bar__fill" :style="{ width: formatPercent(item.approvedCount, item.totalReviews) }"></div>
            </div>
            <span class="workload-bar__text">{{ formatPercent(item.approvedCount, item.totalReviews) }}</span>
          </span>
          <span class="workload-table__col workload-table__col--date">{{ formatDateShort(item.lastReviewAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AttachmentReviewPage - 附件审核页面
 *
 * @description 审核员在此页面查看并审核所有待审核的附件，附件来源标注包括：
 *              单课程、系列课程、系列课程下的某一课时
 *              v4.1 新增审核员工作量统计面板。
 */
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getPendingAttachmentsWithSource,
  reviewAttachment,
  getAttachmentPreviewUrl,
  type AttachmentInfo,
  AttachmentTypeLabels,
  AttachmentStatus,
} from '../../api/attachment';
import { formatFileSize, getAttachmentTypeIcon } from '../../api/attachment';
import { getReviewerWorkload, type ReviewerWorkload } from '../../api/admin';

/** 附件列表 */
const attachments = ref<AttachmentInfo[]>([]);
/** 总记录数 */
const total = ref(0);
/** 当前页码 */
const currentPage = ref(1);
/** 每页条数 */
const pageSize = ref(20);
/** 加载状态 */
const loading = ref(false);
/** 当前展开的附件ID */
const expandedId = ref<number | null>(null);
/** 正在审核的附件ID */
const reviewingId = ref<number | null>(null);
/** 驳回输入框可见的附件ID */
const rejectCommentVisible = ref<number | null>(null);
/** 驳回原因输入 */
const rejectComment = ref('');

/** 当前预览加载中的附件ID */
const previewLoading = ref<number | null>(null);

/** 审核员工作量统计 */
const workloadList = ref<ReviewerWorkload[]>([]);
const workloadLoading = ref(false);

const fetchWorkload = async () => {
  workloadLoading.value = true;
  try {
    workloadList.value = await getReviewerWorkload();
  } catch {
    workloadList.value = [];
  } finally {
    workloadLoading.value = false;
  }
};

const formatPercent = (count: number, total: number): string => {
  if (total <= 0) return '0%';
  return Math.round((count / total) * 100) + '%';
};

const formatDateShort = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 总页数 */
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

/**
 * 计算来源标记对应的 Badge CSS 类名
 * @param item - 附件信息
 * @returns CSS 类名
 */
function getSourceBadgeClass(item: AttachmentInfo): string {
  if (item.courseType === 'series') {
    if (item.lessonTitle) {
      return 'badge badge--warning';
    }
    return 'badge badge--info';
  }
  return 'badge badge--success';
}

/**
 * 获取来源显示文本
 * @param item - 附件信息
 * @returns 来源描述文本
 */
function getSourceLabel(item: AttachmentInfo): string {
  if (item.courseType === 'series') {
    if (item.lessonTitle) {
      return `系列课时 · ${item.lessonTitle}`;
    }
    return '系列课程';
  }
  return '单课程';
}

/**
 * 格式化日期（显示月日）
 * @param dateStr - 日期字符串
 * @returns 格式化后的日期字符串
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 格式化日期时间
 * @param dateStr - 日期字符串
 * @returns 格式化后的日期时间字符串
 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 切换展开状态
 * @param id - 附件ID
 */
function toggleExpand(id: number): void {
  if (expandedId.value === id) {
    expandedId.value = null;
    rejectCommentVisible.value = null;
    rejectComment.value = '';
  } else {
    expandedId.value = id;
    rejectCommentVisible.value = null;
    rejectComment.value = '';
  }
}

function showRejectInput(id: number): void {
  rejectCommentVisible.value = id;
  rejectComment.value = '';
}

function cancelReject(): void {
  rejectCommentVisible.value = null;
  rejectComment.value = '';
}

async function loadAttachments(): Promise<void> {
  loading.value = true;
  try {
    const result = await getPendingAttachmentsWithSource(currentPage.value, pageSize.value);
    attachments.value = result.items || [];
    total.value = result.meta?.total ?? result.total ?? 0;
  } catch (error: any) {
    ElMessage.error(error.message || '加载附件列表失败');
    attachments.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function changePage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  expandedId.value = null;
  rejectCommentVisible.value = null;
  rejectComment.value = '';
  loadAttachments();
}

async function handleApprove(id: number): Promise<void> {
  reviewingId.value = id;
  try {
    await reviewAttachment(id, AttachmentStatus.APPROVED);
    ElMessage.success('附件审核通过');
    attachments.value = attachments.value.filter((item) => item.id !== id);
    total.value -= 1;
    if (attachments.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1;
      await loadAttachments();
    }
    expandedId.value = null;
  } catch (error: any) {
    ElMessage.error(error.message || '审核操作失败');
  } finally {
    reviewingId.value = null;
  }
}

async function handleReject(id: number): Promise<void> {
  if (!rejectComment.value.trim()) {
    ElMessage.warning('请填写驳回原因');
    return;
  }
  reviewingId.value = id;
  try {
    await reviewAttachment(id, AttachmentStatus.REJECTED, rejectComment.value.trim());
    ElMessage.success('附件已驳回');
    attachments.value = attachments.value.filter((item) => item.id !== id);
    total.value -= 1;
    if (attachments.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1;
      await loadAttachments();
    }
    expandedId.value = null;
    rejectCommentVisible.value = null;
    rejectComment.value = '';
  } catch (error: any) {
    ElMessage.error(error.message || '驳回操作失败');
  } finally {
    reviewingId.value = null;
  }
}

function getPreviewHint(mimeType: string): string {
  if (!mimeType) return '';
  if (mimeType.startsWith('image/')) return '支持浏览器直接查看';
  if (mimeType.startsWith('audio/')) return '支持在线试听';
  if (mimeType.startsWith('video/')) return '支持在线播放';
  if (mimeType.includes('pdf')) return '支持浏览器直接查看';
  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml'))
    return '支持浏览器直接查看';
  return '可下载后查看';
}

async function previewAttachment(item: AttachmentInfo): Promise<void> {
  previewLoading.value = item.id;
  try {
    const result = await getAttachmentPreviewUrl(item.id);
    if (result && result.url) {
      window.open(result.url, '_blank');
    } else {
      ElMessage.error('获取预览地址失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取预览地址失败');
  } finally {
    previewLoading.value = null;
  }
}

onMounted(() => {
  loadAttachments();
  fetchWorkload();
});
</script>

<style scoped>
.attachment-review-page { max-width: 960px; margin: 0 auto; }
.page-header { margin-bottom: 1.5rem; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--va-on-background-primary); margin: 0 0 0.25rem 0; }
.page-desc { font-size: 0.875rem; color: var(--va-muted); margin: 0; }
.review-card { background-color: var(--va-background-primary); border: var(--va-block-border); border-radius: var(--va-block-border-radius); box-shadow: var(--va-block-box-shadow); }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: var(--va-block-border); }
.card-header-left { display: flex; align-items: center; gap: var(--va-gap-large); }
.total-count { font-size: 0.8125rem; color: var(--va-on-background-element); }
.loading-state { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-row { height: 60px; border-radius: var(--va-square-border-radius); }
.empty-state { padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--va-muted); }
.empty-icon { font-size: 3rem; opacity: 0.5; margin-bottom: 0.75rem; }
.empty-text { font-size: 0.875rem; margin: 0; }
.attachment-list { display: flex; flex-direction: column; }
.attachment-item { border-bottom: 1px solid var(--va-background-element); transition: var(--va-transition); }
.attachment-item:last-child { border-bottom: none; }
.attachment-item:hover { background-color: var(--va-background-hover); }
.item-main { display: flex; align-items: center; gap: var(--va-gap-large); padding: 0.875rem 1.25rem; cursor: pointer; user-select: none; }
.item-icon { font-size: 1.5rem; flex-shrink: 0; width: 2.25rem; height: 2.25rem; display: flex; align-items: center; justify-content: center; background-color: var(--va-primary-alpha); border-radius: var(--va-square-border-radius); }
.item-info { flex: 1; min-width: 0; }
.item-name-row { display: flex; align-items: center; gap: var(--va-gap-medium); margin-bottom: 2px; }
.item-name { font-size: 0.875rem; font-weight: 600; color: var(--va-on-background-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-type { font-size: 0.625rem; flex-shrink: 0; }
.item-meta { display: flex; align-items: center; gap: var(--va-gap-medium); font-size: 0.75rem; color: var(--va-on-background-element); }
.meta-sep { color: var(--va-background-border); }
.item-source { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
.source-label { font-size: 0.75rem; color: var(--va-on-background-element); }
.source-tag { font-size: 0.625rem; white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
.expand-icon { display: flex; align-items: center; color: var(--va-on-background-element); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1); flex-shrink: 0; }
.expand-icon--open { transform: rotate(180deg); }
.item-detail { padding: 0 1.25rem 1.25rem 1.25rem; border-top: 1px solid var(--va-background-element); animation: slide-fade-in 0.2s ease; }
@keyframes slide-fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem; padding: 1rem 0; }
.detail-field { display: flex; flex-direction: column; gap: 0.25rem; }
.detail-label { font-size: 0.75rem; font-weight: 600; color: var(--va-on-background-element); text-transform: uppercase; letter-spacing: 0.0375rem; }
.detail-value { font-size: 0.875rem; color: var(--va-on-background-primary); }
.preview-section { display: flex; align-items: center; gap: var(--va-gap-large); padding: 0.75rem 0 0.5rem 0; }
.preview-btn { flex-shrink: 0; }
.preview-hint { font-size: 0.75rem; color: var(--va-muted); }
.review-actions { display: flex; flex-direction: column; gap: var(--va-gap-large); padding-top: 0.5rem; border-top: 1px solid var(--va-background-element); }
.review-comment { display: flex; flex-direction: column; gap: 0.375rem; }
.comment-input { width: 100%; resize: vertical; min-height: 60px; }
.action-buttons { display: flex; gap: var(--va-gap-large); flex-wrap: wrap; }
.card { background: var(--va-background-primary); border: var(--va-block-border); border-radius: var(--va-block-border-radius); box-shadow: var(--va-block-box-shadow); overflow: hidden; }
.card__header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: var(--va-block-border); background: var(--va-background-secondary); }
.card__title { display: flex; align-items: center; gap: 0.75rem; }
.card__actions { display: flex; gap: 0.5rem; }
.va-title { font-family: var(--va-font-family); font-size: 0.625rem; letter-spacing: 0.6px; line-height: 1.2; font-weight: 700; text-transform: uppercase; color: currentColor; }
.workload-table { padding: 0.5rem 1.5rem; }
.workload-table__header { display: flex; align-items: center; padding: 0.625rem 0; border-bottom: 2px solid var(--va-on-background-primary); font-size: 0.625rem; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: var(--va-on-background-primary); }
.workload-table__row { display: flex; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--va-background-element); font-size: 0.875rem; color: var(--va-on-background-primary); transition: background-color var(--va-transition); }
.workload-table__row:hover { background-color: var(--va-background-hover); }
.workload-table__col { flex: 1; padding: 0 0.25rem; }
.workload-table__col--name { flex: 1.5; font-weight: 600; }
.workload-table__col--count { flex: 0.7; text-align: center; }
.workload-table__col--bar { flex: 1.5; display: flex; align-items: center; gap: 0.5rem; }
.workload-table__col--date { flex: 1; text-align: right; font-size: 0.75rem; color: var(--va-muted); }
.workload-loading { padding: 0.75rem 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.skeleton--row { height: 48px; background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s ease-in-out infinite; border-radius: var(--va-square-border-radius); }
@keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.empty-state__text { font-size: 1rem; font-weight: 500; color: var(--va-on-background-primary); margin: 0 0 0.25rem; }
.empty-state__subtext { font-size: 0.8125rem; color: var(--va-muted); margin: 0; }
.workload-bar { flex: 1; height: 6px; background-color: var(--va-background-element); border-radius: 3px; overflow: hidden; }
.workload-bar__fill { height: 100%; background: linear-gradient(90deg, var(--va-primary), var(--va-success)); border-radius: 3px; transition: width 0.5s ease; }
.workload-bar__text { font-size: 0.75rem; color: var(--va-on-background-secondary); white-space: nowrap; min-width: 2.5rem; }
.pagination { display: flex; align-items: center; justify-content: center; gap: var(--va-gap-large); padding: 1rem 1.25rem; border-top: var(--va-block-border); }
.pagination-info { font-size: 0.8125rem; color: var(--va-on-background-secondary); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.8125rem; }
</style>
