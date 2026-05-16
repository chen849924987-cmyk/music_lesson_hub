<!--
 * CourseReview - 课程审核工作台
 *
 * 功能描述：管理端/审核员使用的课程审核工作台，展示待审核课程列表，
 *           支持审核员查看课程详情（含封面、价格、目录等完整信息）、
 *           通过或驳回课程申请（含普通上架/修改/下架申请）
 *           v4.1 新增审核员工作量统计面板。
 *
 * 设计参考：Vuestic UI 双主题设计体系
 -->

<template>
  <div class="course-review">
    <div class="page-header">
      <h2 class="page-title">课程审核</h2>
      <p class="page-desc">管理待审核的课程申请，审核通过后课程将上架/下架</p>
    </div>

    <!-- 待审核列表 -->
    <div class="card">
      <div class="card__header">
        <div class="card__title">
          <span class="va-title">待审核课程</span>
          <span class="badge badge--warning">{{ total }} 项</span>
        </div>
        <div class="card__actions">
          <button class="btn btn-text" :disabled="loading" @click="fetchPendingList">
            <span v-if="loading">加载中...</span>
            <span v-else>刷新</span>
          </button>
        </div>
      </div>

      <div v-if="!loading && items.length === 0" class="empty-state">
        <div class="empty-state__icon">
          <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p class="empty-state__text">暂无待审核的课程</p>
        <p class="empty-state__subtext">所有课程申请都已处理完毕</p>
      </div>

      <div class="review-list" v-else>
        <div v-for="course in items" :key="course.id" class="review-item">
          <div class="review-item__info">
            <div class="review-item__cover">
              <img v-if="course.cover" :src="course.cover" :alt="course.title" class="review-item__cover-img" />
              <span v-else class="review-item__cover-placeholder">
                <svg class="placeholder-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
              </span>
            </div>
            <div class="review-item__detail">
              <h4 class="review-item__title">{{ course.title }}</h4>
              <div class="review-item__meta">
                <span class="badge badge--info">{{ course.category?.name || '未分类' }}</span>
                <span class="badge" :class="`badge--${getApplyTypeClass(course)}`">{{ getApplyTypeLabel(course) }}</span>
                <span class="review-item__time">提交时间：{{ formatTime(course.updatedAt) }}</span>
              </div>
              <div class="review-item__extra">
                <span>类型：{{ course.courseType === 'series' ? '系列课' : '单课' }}</span>
                <span>¥{{ course.price || 0 }}</span>
              </div>
            </div>
          </div>
          <div class="review-item__actions">
            <button class="btn btn-secondary btn-sm" @click="viewDetail(course)">查看详情</button>
            <button class="btn btn-primary btn-sm" @click="handleApprove(course)">通过</button>
            <button class="btn btn-danger btn-sm" @click="openRejectDialog(course)">驳回</button>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="total > pageSize">
        <button class="btn btn-text btn-sm" :disabled="page <= 1" @click="page--; fetchPendingList()">上一页</button>
        <span class="pagination__info">第 {{ page }} / {{ totalPages }} 页</span>
        <button class="btn btn-text btn-sm" :disabled="page >= totalPages" @click="page++; fetchPendingList()">下一页</button>
      </div>
    </div>

    <!-- ===== 课程详情弹窗 ===== -->
    <div v-if="detailVisible" class="modal-overlay" @click.self="detailVisible = false">
      <div class="modal modal-lg">
        <div class="modal__header">
          <h3 class="modal__title">课程详情审核</h3>
          <button class="modal__close" @click="detailVisible = false">✕</button>
        </div>
        <div class="modal__body">
          <div v-if="selectedCourse?.cover" class="detail-cover">
            <img :src="selectedCourse.cover" :alt="selectedCourse.title" class="detail-cover__img" />
          </div>

          <div class="detail-section">
            <h4 class="detail-section__title">基本信息</h4>
            <div class="detail-grid three-col">
              <div class="detail-item">
                <label>课程名称</label>
                <span class="detail-value">{{ selectedCourse?.title }}</span>
              </div>
              <div class="detail-item">
                <label>课程类型</label>
                <span><span class="badge" :class="selectedCourse?.courseType === 'series' ? 'badge--info' : 'badge--success'">{{ selectedCourse?.courseType === 'single' ? '单课程' : '系列课程' }}</span></span>
              </div>
              <div class="detail-item">
                <label>申请类型</label>
                <span><span class="badge" :class="`badge--${getApplyTypeClass(selectedCourse)}`">{{ getApplyTypeLabel(selectedCourse) }}</span></span>
              </div>
              <div class="detail-item">
                <label>正价</label>
                <span class="detail-price">¥{{ selectedCourse?.price || 0 }}</span>
              </div>
              <div class="detail-item">
                <label>原价</label>
                <span class="detail-original-price">¥{{ selectedCourse?.originalPrice || 0 }}</span>
              </div>
              <div class="detail-item">
                <label>分类</label>
                <span>{{ selectedCourse?.category?.name || '未分类' }}</span>
              </div>
              <div class="detail-item">
                <label>标签</label>
                <span>{{ selectedCourse?.tags || '无' }}</span>
              </div>
              <div class="detail-item">
                <label>试看时长</label>
                <span>{{ selectedCourse?.previewDuration || 0 }}秒</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="detail-section__title">课程简介</h4>
            <p class="detail-desc">{{ selectedCourse?.description || '暂无简介' }}</p>
          </div>

          <div v-if="diffItems.length > 0" class="detail-section">
            <h4 class="detail-section__title">📋 变更对比</h4>
            <div class="diff-list">
              <div v-for="item in diffItems" :key="item.field" class="diff-item">
                <div class="diff-field">{{ item.label }}</div>
                <div class="diff-values">
                  <span class="diff-old">{{ item.oldValue }}</span>
                  <span class="diff-arrow">→</span>
                  <span class="diff-new">{{ item.newValue }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedCourse?.courseType === 'series' && selectedCourse?.chapters && selectedCourse.chapters.length > 0" class="detail-section">
            <h4 class="detail-section__title">课程目录（{{ totalChapterLessons }} 课时）</h4>
            <div class="chapter-preview">
              <div v-for="(chapter, ci) in selectedCourse.chapters" :key="chapter.id || ci" class="chapter-preview__item">
                <div class="chapter-preview__title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  第{{ ci + 1 }}章 {{ chapter.title }}
                </div>
                <div v-if="chapter.lessons && chapter.lessons.length > 0" class="chapter-preview__lessons">
                  <div v-for="(lesson, li) in chapter.lessons" :key="lesson.id || li" class="lesson-preview__item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span class="lesson-preview__title">课时{{ li + 1 }} {{ lesson.title }}</span>
                    <span v-if="lesson.isFree" class="badge badge--success lesson-badge">免费</span>
                    <span class="lesson-video-tag" :class="lesson.videoId ? 'has-video' : 'no-video'">{{ lesson.videoId ? '有视频' : '无视频' }}</span>
                  </div>
                </div>
                <div v-else class="chapter-preview__empty">暂无课时</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn-primary" @click="handleApprove(selectedCourse!)">通过</button>
          <button class="btn btn-danger" @click="openRejectDialog(selectedCourse!); detailVisible = false">驳回</button>
          <button class="btn btn-secondary" @click="previewCourse">预览课程</button>
          <button class="btn btn-secondary" @click="detailVisible = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- ========== 审核员工作量统计面板 ========== -->
    <div class="card" style="margin-top: 1.5rem;">
      <div class="card__header">
        <div class="card__title">
          <span class="va-title">审核员工作量统计</span>
          <span v-if="workloadList.length > 0" class="badge badge--info">{{ workloadList.length }} 人</span>
        </div>
        <div class="card__actions">
          <button class="btn btn-text" :disabled="workloadLoading" @click="fetchWorkload">{{ workloadLoading ? '加载中...' : '刷新' }}</button>
        </div>
      </div>

      <div v-if="workloadLoading" class="workload-loading">
        <div v-for="i in 3" :key="i" class="skeleton skeleton--row"></div>
      </div>
      <div v-else-if="workloadList.length === 0" class="empty-state" style="padding: 2rem 1.5rem;">
        <p class="empty-state__text">暂无审核工作量数据</p>
        <p class="empty-state__subtext">完成课程审核后，统计数据将在此展示</p>
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
        <div v-for="item in workloadList" :key="item.reviewerId" class="workload-table__row">
          <span class="workload-table__col workload-table__col--name">{{ item.username }}</span>
          <span class="workload-table__col workload-table__col--count">{{ item.totalReviews }}</span>
          <span class="workload-table__col workload-table__col--count" style="color: var(--va-success);">{{ item.approvedCount }}</span>
          <span class="workload-table__col workload-table__col--count" style="color: var(--va-danger);">{{ item.rejectedCount }}</span>
          <span class="workload-table__col workload-table__col--bar">
            <div class="workload-bar"><div class="workload-bar__fill" :style="{ width: formatPercent(item.approvedCount, item.totalReviews) }"></div></div>
            <span class="workload-bar__text">{{ formatPercent(item.approvedCount, item.totalReviews) }}</span>
          </span>
          <span class="workload-table__col workload-table__col--date">{{ formatDate(item.lastReviewAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 驳回原因弹窗 -->
    <div v-if="rejectVisible" class="modal-overlay" @click.self="rejectVisible = false">
      <div class="modal">
        <div class="modal__header">
          <h3 class="modal__title">驳回课程</h3>
          <button class="modal__close" @click="rejectVisible = false">✕</button>
        </div>
        <div class="modal__body">
          <div class="alert alert--warning" style="margin-bottom: 16px">请填写驳回原因，这将作为课程修改的依据告知教师</div>
          <div class="form-group">
            <label class="form-label">驳回原因 <span class="required">*</span></label>
            <textarea v-model="rejectComment" class="input" rows="4" placeholder="请详细说明驳回原因，帮助教师修改..."></textarea>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn-danger" :disabled="!rejectComment.trim()" @click="handleReject">确认驳回</button>
          <button class="btn btn-secondary" @click="rejectVisible = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getPendingReviews, reviewCourse, getCourseDiff, type CourseInfo } from '../../api/course';
import { getReviewerWorkload, type ReviewerWorkload } from '../../api/admin';

const items = ref<CourseInfo[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const detailVisible = ref(false);
const selectedCourse = ref<CourseInfo | null>(null);
const rejectVisible = ref(false);
const rejectComment = ref('');

interface DiffItem { field: string; label: string; oldValue: string; newValue: string; }
const diffItems = ref<DiffItem[]>([]);

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
const totalChapterLessons = computed(() => {
  if (!selectedCourse.value?.chapters) return 0;
  return selectedCourse.value.chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
});

/** 获取申请类型显示文字 */
function getApplyTypeLabel(course: CourseInfo | null): string {
  if (!course) return '';
  if (course.pendingOffShelf) return '下架申请';
  if (course.pendingEdit) return '修改申请';
  return '上架申请';
}

/** 获取申请类型徽章颜色 */
function getApplyTypeClass(course: CourseInfo | null): string {
  if (!course) return 'primary';
  if (course.pendingOffShelf) return 'orange';
  if (course.pendingEdit) return 'warning';
  return 'primary';
}

const workloadList = ref<ReviewerWorkload[]>([]);
const workloadLoading = ref(false);

const fetchWorkload = async () => {
  workloadLoading.value = true;
  try { workloadList.value = await getReviewerWorkload(); }
  catch { workloadList.value = []; }
  finally { workloadLoading.value = false; }
};

const formatPercent = (count: number, total: number): string => {
  if (total <= 0) return '0%';
  return Math.round((count / total) * 100) + '%';
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function formatTime(time: string): string {
  if (!time) return '-';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function fetchPendingList(): Promise<void> {
  loading.value = true;
  try {
    const result = await getPendingReviews({ page: page.value, pageSize: pageSize.value });
    items.value = result.items;
    total.value = result.meta.total;
  } catch (error) { console.error('获取待审核课程失败:', error); }
  finally { loading.value = false; }
}

function viewDetail(course: CourseInfo): void {
  selectedCourse.value = course;
  diffItems.value = [];
  detailVisible.value = true;
  if (course.pendingEdit) {
    getCourseDiff(course.id)
      .then((data) => { diffItems.value = data; })
      .catch(() => { diffItems.value = []; });
  }
}

const previewCourse = () => {
  if (!selectedCourse.value) return;
  window.open(`/courses/${selectedCourse.value.id}`, '_blank');
};

async function handleApprove(course: CourseInfo): Promise<void> {
  try {
    await reviewCourse(course.id, { approved: true });
    detailVisible.value = false;
    await fetchPendingList();
    fetchWorkload();
  } catch (error) { console.error('审核通过失败:', error); }
}

function openRejectDialog(course: CourseInfo): void {
  selectedCourse.value = course;
  rejectComment.value = '';
  rejectVisible.value = true;
}

async function handleReject(): Promise<void> {
  if (!selectedCourse.value || !rejectComment.value.trim()) return;
  try {
    await reviewCourse(selectedCourse.value.id, { approved: false, comment: rejectComment.value.trim() });
    rejectVisible.value = false;
    await fetchPendingList();
    fetchWorkload();
  } catch (error) { console.error('驳回失败:', error); }
}

onMounted(() => { fetchPendingList(); fetchWorkload(); });
</script>

<style scoped>
.course-review { max-width: 960px; }
.page-header { margin-bottom: 1.5rem; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--va-on-background-primary); margin: 0 0 0.25rem; }
.page-desc { font-size: 0.875rem; color: var(--va-muted); margin: 0; }

.card { background: var(--va-background-primary); border: var(--va-block-border); border-radius: var(--va-block-border-radius); box-shadow: var(--va-block-box-shadow); overflow: hidden; }
.card__header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: var(--va-block-border); background: var(--va-background-secondary); }
.card__title { display: flex; align-items: center; gap: 0.75rem; }
.card__actions { display: flex; gap: 0.5rem; }
.va-title { font-family: var(--va-font-family); font-size: 0.625rem; letter-spacing: 0.6px; line-height: 1.2; font-weight: 700; text-transform: uppercase; }

.review-list { padding: 0.75rem; }
.review-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1rem; border-radius: var(--va-block-border-radius); border: 1px solid transparent; transition: all 0.2s ease; margin-bottom: 0.5rem; background: var(--va-background-primary); }
.review-item:last-child { margin-bottom: 0; }
.review-item:hover { background: var(--va-background-hover); border-color: var(--va-background-border); box-shadow: 0 1px 4px var(--va-shadow); }
.review-item__info { display: flex; gap: 1rem; flex: 1; min-width: 0; }
.review-item__cover { width: 120px; height: 72px; border-radius: var(--va-square-border-radius); overflow: hidden; flex-shrink: 0; background: var(--va-background-element); display: flex; align-items: center; justify-content: center; }
.review-item__cover-img { width: 100%; height: 100%; object-fit: cover; }
.review-item__cover-placeholder { font-size: 1.5rem; opacity: 0.5; }
.review-item__detail { min-width: 0; flex: 1; }
.review-item__title { font-size: 0.9375rem; font-weight: 600; color: var(--va-on-background-primary); margin: 0 0 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.review-item__meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem; flex-wrap: wrap; }
.review-item__extra { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--va-on-background-element); }
.review-item__time { font-size: 0.75rem; color: var(--va-muted); }
.review-item__desc { font-size: 0.8125rem; color: var(--va-on-background-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }
.review-item__actions { display: flex; flex-direction: column; gap: 0.375rem; flex-shrink: 0; min-width: 80px; }
.review-item__actions .btn { width: 100%; white-space: nowrap; }

.chapter-preview { display: flex; flex-direction: column; gap: 0.5rem; }
.chapter-preview__item { border: 1px solid var(--va-background-border); border-radius: var(--va-square-border-radius); overflow: hidden; }
.chapter-preview__title { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.8125rem; font-weight: 600; color: var(--va-on-background-primary); background: var(--va-background-secondary); }
.chapter-preview__lessons { padding: 0.25rem 0.5rem 0.25rem 1.5rem; }
.chapter-preview__empty { padding: 0.5rem 0.75rem; font-size: 0.75rem; color: var(--va-muted); }
.lesson-preview__item { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0; font-size: 0.8125rem; border-bottom: 1px solid var(--va-background-element); }
.lesson-preview__item:last-child { border-bottom: none; }
.lesson-preview__title { flex: 1; color: var(--va-on-background-primary); }
.lesson-badge { font-size: 0.5rem; }
.lesson-video-tag { font-size: 0.625rem; margin-left: auto; }
.has-video { color: var(--va-success); }
.no-video { color: var(--va-muted); }

.detail-cover { width: 100%; max-height: 240px; border-radius: var(--va-block-border-radius); overflow: hidden; margin-bottom: 1.5rem; }
.detail-cover__img { width: 100%; height: 100%; object-fit: cover; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); animation: fadeIn 0.15s ease; }
.modal { background: var(--va-background-primary); border-radius: var(--va-block-border-radius); width: 540px; max-width: calc(100vw - 2rem); max-height: calc(100vh - 2rem); overflow-y: auto; box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.2); animation: slideUp 0.2s ease; }
.modal-lg { width: 640px; }
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: var(--va-block-border); }
.modal__title { font-size: 1rem; font-weight: 600; margin: 0; color: var(--va-on-background-primary); }
.modal__close { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--va-muted); padding: 0.25rem; border-radius: var(--va-square-border-radius); line-height: 1; transition: var(--va-transition); }
.modal__close:hover { color: var(--va-on-background-primary); background: var(--va-background-hover); }
.modal__body { padding: 1.5rem; }
.modal__footer { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 1rem 1.5rem; border-top: var(--va-block-border); background: var(--va-background-secondary); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.detail-section { margin-bottom: 1.5rem; }
.detail-section:last-child { margin-bottom: 0; }
.detail-section__title { font-size: 0.75rem; font-weight: 700; color: var(--va-muted); margin: 0 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--va-background-element); text-transform: uppercase; letter-spacing: 0.0375rem; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.detail-grid.three-col { grid-template-columns: 1fr 1fr 1fr; }
.detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
.detail-item label { display: block; font-size: 0.6875rem; font-weight: 600; color: var(--va-muted); text-transform: uppercase; letter-spacing: 0.0375rem; }
.detail-value { font-size: 0.9375rem; font-weight: 500; color: var(--va-on-background-primary); }
.detail-price { font-size: 1.125rem; font-weight: 700; color: var(--va-danger); }
.detail-original-price { font-size: 0.875rem; text-decoration: line-through; color: var(--va-muted); }
.detail-desc { font-size: 0.875rem; color: var(--va-on-background-secondary); line-height: 1.7; margin: 0; }

.workload-table { padding: 0.5rem 1.5rem; }
.workload-table__header { display: flex; align-items: center; padding: 0.625rem 0; border-bottom: 2px solid var(--va-on-background-primary); font-size: 0.625rem; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: var(--va-on-background-primary); }
.workload-table__row { display: flex; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--va-background-element); font-size: 0.875rem; color: var(--va-on-background-primary); transition: background-color var(--va-transition); }
.workload-table__row:hover { background-color: var(--va-background-hover); }
.workload-table__col { flex: 1; padding: 0 0.25rem; }
.workload-table__col--name { flex: 1.5; font-weight: 600; }
.workload-table__col--count { flex: 0.7; text-align: center; }
.workload-table__col--bar { flex: 1.5; display: flex; align-items: center; gap: 0.5rem; }
.workload-table__col--date { flex: 1; text-align: right; font-size: 0.75rem; color: var(--va-muted); }
.workload-bar { flex: 1; height: 6px; background-color: var(--va-background-element); border-radius: 3px; overflow: hidden; }
.workload-bar__fill { height: 100%; background: linear-gradient(90deg, var(--va-primary), var(--va-success)); border-radius: 3px; transition: width 0.5s ease; }
.workload-bar__text { font-size: 0.75rem; color: var(--va-on-background-secondary); white-space: nowrap; min-width: 2.5rem; }
.workload-loading { padding: 0.75rem 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.skeleton--row { height: 48px; background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s ease-in-out infinite; border-radius: var(--va-square-border-radius); }
@keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.diff-list { display: flex; flex-direction: column; gap: 0.5rem; }
.diff-item { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--va-background-secondary); border-radius: var(--va-square-border-radius); }
.diff-field { font-size: 0.75rem; font-weight: 600; color: var(--va-on-background-secondary); min-width: 80px; }
.diff-values { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; }
.diff-old { text-decoration: line-through; color: var(--va-danger); opacity: 0.7; }
.diff-arrow { color: var(--va-muted); font-size: 0.75rem; }
.diff-new { color: var(--va-success); font-weight: 600; }

.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 0.8125rem; font-weight: 600; color: var(--va-on-background-secondary); margin-bottom: 0.375rem; }
.required { color: var(--va-danger); }
.input { width: 100%; padding: 0.625rem 0.875rem; background: var(--va-background-primary); border: var(--va-form-element-border-width) solid var(--va-background-border); border-radius: var(--va-form-element-border-radius); color: var(--va-on-background-primary); font-family: var(--va-font-family); font-size: 0.875rem; box-shadow: var(--va-control-box-shadow); transition: var(--va-transition); box-sizing: border-box; resize: vertical; }
.input:focus { outline: none; border-color: var(--va-primary); box-shadow: 0 0 0 2px var(--va-primary-alpha); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem 1.5rem; border-top: var(--va-block-border); background: var(--va-background-secondary); }
.pagination__info { font-size: 0.8125rem; color: var(--va-muted); }
.empty-state { text-align: center; padding: 4rem 1.5rem; }
.empty-state__icon { font-size: 3rem; opacity: 0.4; margin-bottom: 0.75rem; }
.empty-state__text { font-size: 1rem; font-weight: 500; color: var(--va-on-background-primary); margin: 0 0 0.25rem; }
.empty-state__subtext { font-size: 0.8125rem; color: var(--va-muted); margin: 0; }

.btn { display: inline-flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 600; padding: 0.5rem 1.25rem; border-radius: var(--va-square-border-radius); border: 0; cursor: pointer; transition: var(--va-swing-transition); font-family: var(--va-font-family); text-decoration: none; line-height: 1.4; }
.btn:active { transform: scale(0.97); }
.btn-sm { font-size: 0.8125rem; padding: 0.375rem 0.75rem; }
.btn-primary { background-color: var(--va-primary); color: var(--va-on-primary); }
[data-theme="dark"] .btn-primary { background-color: var(--va-primary-darken); }
.btn-primary:hover { background-color: var(--va-primary-darken); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background-color: transparent; color: var(--va-on-background-primary); border: 1px solid var(--va-background-border); }
.btn-secondary:hover { background-color: var(--va-background-secondary); border-color: var(--va-background-border); }
.btn-danger { background-color: var(--va-danger); color: #ffffff; }
.btn-danger:hover { opacity: 0.9; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-text { background: none; border: none; color: var(--va-primary); cursor: pointer; font-weight: 600; font-size: 0.875rem; padding: 0.375rem 0.75rem; }
.btn-text:hover { text-decoration: underline; }
.btn-text:disabled { color: var(--va-muted); cursor: not-allowed; }

.alert { padding: 0.75rem 1rem; border-radius: var(--va-block-border-radius); font-size: 0.8125rem; line-height: 1.5; }
.alert--warning { background: rgba(245, 158, 11, 0.1); color: var(--va-warning); border: 1px solid rgba(245, 158, 11, 0.2); }

.badge { display: inline-flex; align-items: center; font-size: 0.625rem; font-weight: 700; padding: 0 0.375rem; border-radius: 0.6rem; letter-spacing: 0.0375rem; line-height: 1.7; text-transform: uppercase; }
.badge--primary { background: var(--va-primary-alpha); color: var(--va-primary); }
.badge--warning { background: rgba(245, 158, 11, 0.12); color: var(--va-warning); }
.badge--info { background: rgba(59, 130, 246, 0.12); color: var(--va-info); }
.badge--success { background: rgba(16, 185, 129, 0.12); color: var(--va-success); }
.badge--orange { background: rgba(249, 115, 22, 0.12); color: #F97316; }
</style>
