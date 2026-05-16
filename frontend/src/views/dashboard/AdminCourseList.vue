<!--
 * AdminCourseList - 管理端课程列表
 *
 * 功能描述：管理员查看所有课程的列表页面，支持按状态、分类筛选和关键词搜索，
 *           可设置课程推荐/置顶、快速查看课程详情
 *
 * 设计参考：Vuestic UI 双主题设计体系
 -->

<template>
  <div class="admin-course-list">
    <div class="page-header">
      <h2 class="page-title">课程列表</h2>
      <p class="page-desc">管理平台所有课程，查看各课程的状态和基本信息</p>
    </div>

    <!-- 筛选栏 -->
    <div class="card">
      <div class="card__header">
        <div class="filters">
          <div class="filter-group">
            <label class="filter-label">状态</label>
            <select v-model="filterStatus" class="input input-sm" @change="onFilterChange">
              <option value="">全部</option>
              <option value="draft">草稿</option>
              <option value="pending">待审核</option>
              <option value="approved">已上架</option>
              <option value="rejected">已驳回</option>
              <option value="off_shelf">已下架</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">搜索</label>
            <input
              v-model="searchKeyword"
              class="input input-sm"
              placeholder="搜索课程名称..."
              @input="onSearchInput"
            />
          </div>
        </div>
        <button class="btn btn-text" @click="refreshList">
          <span>{{ loading ? '加载中...' : '刷新' }}</span>
        </button>
      </div>
    </div>

    <!-- 课程统计 -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ total }}</span>
        <span class="stat-label">全部</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-value--warning">{{ pendingCount }}</span>
        <span class="stat-label">待审核</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-value--success">{{ approvedCount }}</span>
        <span class="stat-label">已上架</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-value--danger">{{ rejectedCount }}</span>
        <span class="stat-label">已驳回</span>
      </div>
    </div>

    <!-- 课程列表表格 -->
    <div class="card">
      <!-- 空状态 -->
      <div v-if="!loading && items.length === 0" class="empty-state">
        <div class="empty-state__icon">
          <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <p class="empty-state__text">暂无课程数据</p>
        <p class="empty-state__subtext">系统还没有创建任何课程</p>
      </div>

      <!-- 表格 -->
      <table v-else class="table">
        <thead>
          <tr>
            <th>课程名称</th>
            <th>分类</th>
            <th>类型</th>
            <th>价格</th>
            <th>状态</th>
            <th>学员数</th>
            <th>推荐</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in items" :key="course.id">
            <td>
              <div class="course-cell">
                <div class="course-thumb">
                  <img v-if="course.cover" :src="course.cover" :alt="course.title" class="course-thumb__img" />
                  <span v-else class="course-thumb__placeholder">
                    <svg class="placeholder-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                  </span>
                </div>
                <span class="course-name">{{ course.title }}</span>
              </div>
            </td>
            <td>
              <span class="badge badge--info">{{ course.category?.name || '-' }}</span>
            </td>
            <td>{{ course.courseType === 'single' ? '单课' : '系列' }}</td>
            <td>¥{{ course.price || 0 }}</td>
            <td>
              <span class="badge" :class="statusBadgeClass(course.status)">
                {{ statusLabel(course.status) }}
              </span>
            </td>
            <td>{{ course.studentCount || 0 }}</td>
            <td>
              <button
                class="btn btn-sm"
                :class="course.isRecommended ? 'btn-primary' : 'btn-secondary'"
                @click="toggleFeatured(course)"
              >
                {{ course.isRecommended ? '已推荐' : '未推荐' }}
              </button>
            </td>
            <td class="text-muted">{{ formatTime(course.createdAt) }}</td>
            <td>
              <div class="action-btns">
                <button class="btn btn-text btn-sm" @click="viewDetail(course)">详情</button>
                <button
                  class="btn btn-text btn-sm btn-delete"
                  @click="confirmDelete(course)"
                  :disabled="deleting === course.id"
                >
                  {{ deleting === course.id ? '删除中...' : '删除' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <button class="btn btn-text btn-sm" :disabled="page <= 1" @click="page--; fetchList()">上一页</button>
        <span class="pagination__info">第 {{ page }} / {{ totalPages }} 页</span>
        <button class="btn btn-text btn-sm" :disabled="page >= totalPages" @click="page++; fetchList()">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AdminCourseList 管理端课程列表组件
 *
 * @description 管理端查看所有课程列表，支持筛选、搜索、推荐设置
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAllCourses, setCourseFeatured, adminDeleteCourse, type CourseInfo } from '../../api/course';

/** Vue Router 实例 */
const router = useRouter();

// ============ 状态 ============
const items = ref<CourseInfo[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filterStatus = ref('');
const searchKeyword = ref('');
/** 当前正在删除的课程ID（用于按钮禁用状态） */
const deleting = ref<number | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

/** 各状态课程数量 */
const pendingCount = ref(0);
const approvedCount = ref(0);
const rejectedCount = ref(0);

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

/**
 * 获取课程列表
 */
async function fetchList(): Promise<void> {
  loading.value = true;
  try {
    const result = await getAllCourses({
      page: page.value,
      pageSize: pageSize.value,
      status: filterStatus.value as any || undefined,
      keyword: searchKeyword.value || undefined,
    });
    items.value = result.items;
    total.value = result.meta.total;

    // 统计各状态课程数量
    const statusMap: Record<string, number> = {};
    result.items.forEach((c: CourseInfo) => {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    });
    pendingCount.value = statusMap['pending'] || 0;
    approvedCount.value = statusMap['approved'] || 0;
    rejectedCount.value = statusMap['rejected'] || 0;
  } catch (error) {
    console.error('获取课程列表失败:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 刷新列表
 */
function refreshList(): void {
  page.value = 1;
  fetchList();
}

/**
 * 筛选条件变更
 */
function onFilterChange(): void {
  page.value = 1;
  fetchList();
}

/**
 * 搜索输入（防抖）
 */
function onSearchInput(): void {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    fetchList();
  }, 300);
}

/**
 * 切换推荐状态
 * @param course - 课程对象
 */
async function toggleFeatured(course: CourseInfo): Promise<void> {
  try {
    await setCourseFeatured(course.id, !course.isRecommended);
    course.isRecommended = !course.isRecommended;
  } catch (error) {
    console.error('设置推荐状态失败:', error);
  }
}

/**
 * 查看课程详情
 * @param course - 课程对象
 */
function viewDetail(course: CourseInfo): void {
  // 使用 Vue Router 生成正确路径，在新窗口打开课程详情
  const route = router.resolve({ name: 'CourseDetail', params: { id: course.id } });
  window.open(route.href, '_blank');
}

/**
 * 确认并执行删除课程
 * 功能描述：弹出确认对话框，用户确认后调用管理端删除 API 删除课程及其所有关联数据
 * @param course - 要删除的课程对象
 */
async function confirmDelete(course: CourseInfo): Promise<void> {
  // 二次确认：防止误操作
  const confirmed = window.confirm(
    `确认要强制删除课程「${course.title}」吗？\n\n` +
    `此操作将一并删除该课程下的所有章节、课时、视频、附件资料，且不可恢复！\n\n` +
    `课程ID: ${course.id}\n` +
    `当前状态: ${statusLabel(course.status)}\n` +
    `类型: ${course.courseType === 'single' ? '单课' : '系列课程'}`,
  );
  if (!confirmed) return;

  deleting.value = course.id;
  try {
    await adminDeleteCourse(course.id);
    // 删除成功：刷新列表
    await fetchList();
  } catch (error) {
    console.error('删除课程失败:', error);
    window.alert('删除课程失败，请稍后重试');
  } finally {
    deleting.value = null;
  }
}

/**
 * 状态对应的徽章类
 * @param status - 课程状态
 * @returns 徽章类名
 */
function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'badge--secondary',
    pending: 'badge--warning',
    approved: 'badge--success',
    rejected: 'badge--danger',
    off_shelf: 'badge--info',
  };
  return map[status] || 'badge--secondary';
}

/**
 * 状态中文标签
 * @param status - 课程状态
 * @returns 中文标签
 */
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已上架',
    rejected: '已驳回',
    off_shelf: '已下架',
  };
  return map[status] || status;
}

/**
 * 格式化时间
 * @param time - ISO时间字符串
 * @returns 格式化后的时间
 */
function formatTime(time: string): string {
  if (!time) return '-';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

onMounted(fetchList);
</script>

<style scoped>
/* ============================================================
 * AdminCourseList 样式
 * ============================================================ */

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.25rem;
}

.page-desc {
  font-size: 0.875rem;
  color: var(--va-muted);
  margin: 0;
}

/* ---- 卡片 ---- */
.card {
  background: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  box-shadow: var(--va-block-box-shadow);
  margin-bottom: 1rem;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: var(--va-block-border);
}

/* ---- 筛选 ---- */
.filters {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--va-muted);
  text-transform: uppercase;
  letter-spacing: 0.0375rem;
}

.input {
  padding: 0.5rem 0.75rem;
  background: var(--va-background-primary);
  border: var(--va-form-element-border-width) solid var(--va-background-border);
  border-radius: var(--va-form-element-border-radius);
  color: var(--va-on-background-primary);
  font-family: var(--va-font-family);
  font-size: 0.875rem;
  transition: var(--va-transition);
}

.input:focus {
  outline: none;
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
}

.input-sm {
  font-size: 0.8125rem;
  padding: 0.375rem 0.625rem;
}

select.input {
  min-width: 120px;
  cursor: pointer;
}

/* ---- 统计行 ---- */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
}

.stat-value--warning { color: var(--va-warning); }
.stat-value--success { color: var(--va-success); }
.stat-value--danger { color: var(--va-danger); }

.stat-label {
  font-size: 0.75rem;
  color: var(--va-muted);
  text-transform: uppercase;
  letter-spacing: 0.0375rem;
}

/* ---- 表格 ---- */
.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--va-font-family);
}

.table th {
  font-size: 0.625rem;
  letter-spacing: 0.6px;
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 2px solid var(--va-on-background-primary);
  padding: 0.75rem 1rem;
  text-align: left;
  white-space: nowrap;
  color: var(--va-on-background-primary);
}

.table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--va-background-element);
  font-size: 0.8125rem;
  color: var(--va-on-background-primary);
  vertical-align: middle;
}

.table tbody tr:hover {
  background: var(--va-background-hover);
}

/* ---- 课程名称单元格 ---- */
.course-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.course-thumb {
  width: 48px;
  height: 32px;
  border-radius: var(--va-square-border-radius);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--va-background-element);
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-thumb__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-thumb__placeholder {
  font-size: 1rem;
}

.course-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* ---- 操作按钮组 ---- */
.action-btns {
  display: flex;
  gap: 0.25rem;
}

/* ---- 分页 ---- */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.pagination__info {
  font-size: 0.8125rem;
  color: var(--va-muted);
}

/* ---- 空状态 ---- */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty-state__icon {
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: 0.75rem;
}

.empty-state__text {
  font-size: 0.9375rem;
  color: var(--va-on-background-primary);
  margin: 0 0 0.25rem;
}

.empty-state__subtext {
  font-size: 0.8125rem;
  color: var(--va-muted);
  margin: 0;
}

/* ---- 工具类 ---- */
.text-muted {
  color: var(--va-muted) !important;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: var(--va-square-border-radius);
  border: 0;
  cursor: pointer;
  transition: var(--va-swing-transition);
  font-family: var(--va-font-family);
}

.btn-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
}

.btn-primary {
  background-color: var(--va-primary);
  color: var(--va-on-primary);
}

/* 暗色主题下按钮使用降饱和度版本 */
[data-theme="dark"] .btn-primary {
  background-color: var(--va-primary-darken);
}

.btn-primary:hover {
  background-color: var(--va-primary-darken);
}

.btn-secondary {
  background-color: transparent;
  color: var(--va-on-background-primary);
  border: 1px solid var(--va-background-border);
}

.btn-secondary:hover {
  background-color: var(--va-background-secondary);
}

.btn-text {
  background: none;
  border: none;
  color: var(--va-primary);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-text:disabled {
  color: var(--va-muted);
  cursor: not-allowed;
}

/* ---- 危险操作按钮（删除） ---- */
.btn-text.btn-delete {
  color: var(--va-danger);
}

.btn-text.btn-delete:hover {
  opacity: 0.8;
}

.btn-text.btn-delete:disabled {
  color: var(--va-muted);
  opacity: 0.5;
}

.badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0 0.375rem;
  border-radius: 0.6rem;
  letter-spacing: 0.0375rem;
  line-height: 1.6;
  text-transform: uppercase;
}

.badge--success {
  background: rgba(16, 185, 129, 0.12);
  color: var(--va-success);
}

.badge--warning {
  background: rgba(245, 158, 11, 0.12);
  color: var(--va-warning);
}

.badge--danger {
  background: rgba(239, 68, 68, 0.12);
  color: var(--va-danger);
}

.badge--info {
  background: rgba(59, 130, 246, 0.12);
  color: var(--va-info);
}

.badge--secondary {
  background: var(--va-background-element);
  color: var(--va-on-background-secondary);
}
</style>
