<!--
 * TeacherCourses - 教师端课程列表页
 *
 * 功能描述：展示当前教师创建的所有课程，支持状态筛选、关键词搜索、分页浏览，
 *           以及创建、编辑、删除、提交审核等操作。
 *           已驳回的课程会展示驳回原因，方便教师了解审核意见后修改重新提交。
 *
 * 设计参考：Vuestic UI 设计规范，使用 --va-* CSS 变量实现双主题适配
 -->

<template>
  <div class="teacher-courses">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">课程管理</h1>
        <span class="page-desc">管理您创建的所有课程，支持章节编排和课时设置</span>
      </div>
      <router-link to="/teacher/courses/create" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        创建课程
      </router-link>
    </div>

    <!-- ========== 筛选栏 ========== -->
    <div class="filter-bar">
      <!-- 状态筛选 -->
      <div class="filter-group">
        <span class="filter-label">状态</span>
        <div class="filter-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            class="filter-tab"
            :class="{ 'filter-tab--active': query.status === tab.value }"
            @click="setStatusFilter(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <svg class="search-box__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-box__input"
          placeholder="搜索课程名称..."
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- ========== 加载状态 ========== -->
    <div v-if="loading" class="loading-container">
      <div class="skeleton-card" v-for="i in 4" :key="i">
        <div class="skeleton skeleton--thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton--title"></div>
          <div class="skeleton skeleton--text"></div>
          <div class="skeleton skeleton--text-short"></div>
        </div>
      </div>
    </div>

    <!-- ========== 课程列表 ========== -->
    <div v-else-if="courses.length > 0" class="course-list">
      <div v-for="course in courses" :key="course.id" class="course-card card">
        <!-- 课程封面 -->
        <div class="course-card__cover">
          <img
            :src="course.cover || '/default-cover.svg'"
            :alt="course.title"
            class="course-card__img"
          />
          <!-- 状态徽章 -->
          <span class="course-card__badge" :class="getBadgeClass(course.status)">
            {{ getStatusLabel(course.status) }}
          </span>
          <!-- 课程类型 -->
          <span class="course-card__type">
            {{ course.courseType === 'series' ? '系列课' : '单课' }}
          </span>
        </div>

        <!-- 课程信息 -->
        <div class="course-card__body">
          <h3 class="course-card__title">{{ course.title }}</h3>
          <p class="course-card__desc">{{ course.description || '暂无简介' }}</p>

          <!-- 课程元信息 -->
          <div class="course-card__meta">
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              {{ course.category?.name || '未分类' }}
            </span>
            <span class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {{ course.studentCount || 0 }} 人学习
            </span>
            <span class="meta-item" v-if="course.chapters">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              {{ course.chapters.length }} 章
            </span>
            <span class="meta-item" v-if="course.originalPrice > 0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              ¥{{ course.price }}
            </span>
            <span class="meta-item" v-else>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              免费
            </span>
          </div>

          <!-- 更新时间 -->
          <div class="course-card__time">
            更新于 {{ formatDate(course.updatedAt) }}
          </div>

          <!-- 驳回原因（仅已驳回课程且存在驳回原因时显示） -->
          <div v-if="course.status === 'rejected' && course.reviewComment" class="reject-reason">
            <div class="reject-reason__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="reject-reason__content">
              <span class="reject-reason__label">驳回原因：</span>
              <span class="reject-reason__text">{{ course.reviewComment }}</span>
            </div>
          </div>
        </div>

        <!-- 课程操作 -->
        <div class="course-card__actions">
          <!-- 草稿状态 -->
          <template v-if="course.status === 'draft'">
            <router-link
              :to="`/teacher/courses/${course.id}/edit`"
              class="btn btn-text"
            >
              编辑内容
            </router-link>
            <router-link
              :to="`/teacher/courses/${course.id}/edit?tab=info`"
              class="btn btn-secondary"
            >
              编辑信息
            </router-link>
            <button class="btn btn-primary" @click="submitForReview(course)">
              提交审核
            </button>
            <button class="btn btn-text text-danger" @click="confirmDelete(course)">
              删除
            </button>
          </template>

          <!-- 待审核状态 -->
          <template v-else-if="course.status === 'pending'">
            <router-link
              :to="`/teacher/courses/${course.id}/edit`"
              class="btn btn-secondary"
            >
              查看详情
            </router-link>
            <button class="btn btn-text text-warning" @click="confirmWithdrawReview(course)">
              撤回申请
            </button>
            <span class="status-hint">等待管理员审核中...</span>
          </template>

          <!-- 已上架状态 -->
          <template v-else-if="course.status === 'approved'">
            <router-link
              :to="`/teacher/courses/${course.id}/edit`"
              class="btn btn-secondary"
            >
              管理内容
            </router-link>
            <button class="btn btn-text text-warning" @click="confirmOffShelf(course)">
              下架
            </button>
          </template>

          <!-- 已驳回状态 -->
          <template v-else-if="course.status === 'rejected'">
            <router-link
              :to="`/teacher/courses/${course.id}/edit`"
              class="btn btn-secondary"
            >
              编辑修改
            </router-link>
            <button class="btn btn-primary" @click="submitForReview(course)">
              重新提交
            </button>
            <button class="btn btn-text text-danger" @click="confirmDelete(course)">
              删除
            </button>
          </template>

          <!-- 已下架状态 -->
          <template v-else-if="course.status === 'off_shelf'">
            <router-link
              :to="`/teacher/courses/${course.id}/edit`"
              class="btn btn-secondary"
            >
              查看详情
            </router-link>
            <button class="btn btn-primary" @click="submitForReview(course)">
              重新上架
            </button>
          </template>
        </div>
      </div>

      <!-- ========== 分页 ========== -->
      <div class="pagination" v-if="totalPages > 1">
        <button
          class="pagination-btn"
          :disabled="currentPage <= 1"
          @click="changePage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="pagination-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button
          class="pagination-btn"
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- ========== 空状态 ========== -->
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <p class="empty-text" v-if="query.status">暂无{{ getStatusLabel(query.status) }}状态的课程</p>
      <p class="empty-text" v-else>还没有创建任何课程，马上开始吧！</p>
      <router-link to="/teacher/courses/create" class="btn btn-primary">
        创建第一个课程
      </router-link>
    </div>

    <!-- ========== 删除确认弹窗 ========== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button class="modal-close" @click="showDeleteModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除课程「<strong>{{ deleteTarget?.title }}</strong>」吗？</p>
          <p class="text-muted text-sm">此操作不可恢复，该课程下的所有章节、课时数据将被永久删除。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-danger" @click="doDelete" :disabled="deleting">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 提交审核成功提示 ========== -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">提交审核</h3>
          <button class="modal-close" @click="showReviewModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>课程「<strong>{{ reviewTarget?.title }}</strong>」已提交审核。</p>
          <p class="text-sm">管理员将在审核完成后通知您审核结果，请耐心等待。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showReviewModal = false">我知道了</button>
        </div>
      </div>
    </div>

    <!-- ========== 撤回审核确认弹窗 ========== -->
    <div v-if="showWithdrawModal" class="modal-overlay" @click.self="showWithdrawModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">确认撤回申请</h3>
          <button class="modal-close" @click="showWithdrawModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要撤回课程「<strong>{{ withdrawTarget?.title }}</strong>」的审核申请吗？</p>
          <p class="text-muted text-sm">
            撤回后，课程将回到申请前的状态（新创建课程→草稿，编辑/下架申请→恢复已上架）。
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showWithdrawModal = false">取消</button>
          <button class="btn btn-warning" @click="doWithdrawReview" :disabled="withdrawing">
            {{ withdrawing ? '撤回中...' : '确认撤回' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 下架确认弹窗 ========== -->
    <div v-if="showOffShelfModal" class="modal-overlay" @click.self="showOffShelfModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">确认下架</h3>
          <button class="modal-close" @click="showOffShelfModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要下架课程「<strong>{{ offShelfTarget?.title }}</strong>」吗？</p>
          <p class="text-muted text-sm">下架后课程将不再对学员可见。需管理员审核通过后才会正式下架。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showOffShelfModal = false">取消</button>
          <button class="btn btn-warning" @click="doOffShelf" :disabled="offShelving">
            {{ offShelving ? '提交中...' : '确认下架' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherCourses 教师端课程列表页
 *
 * @description 展示教师的课程列表，支持状态筛选、搜索、分页，以及CRUD操作
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getMyCourses,
  updateCourseStatus,
  deleteCourse,
  requestOffShelf,
  withdrawReview,
  type CourseInfo,
  type CourseQuery,
  type CourseStatus,
} from '../../api/course';

// ============ 状态定义 ============

/** 加载状态 */
const loading = ref(false);

/** 删除中状态 */
const deleting = ref(false);

/** 课程列表 */
const courses = ref<CourseInfo[]>([]);

/** 当前页码 */
const currentPage = ref(1);

/** 总页数 */
const totalPages = ref(1);

/** 总记录数 */
const total = ref(0);

/** 搜索关键词（防抖） */
const searchKeyword = ref('');

/** 搜索防抖定时器 */
let searchTimer: ReturnType<typeof setTimeout> | null = null;

/** 删除确认弹窗 */
const showDeleteModal = ref(false);
const deleteTarget = ref<CourseInfo | null>(null);

/** 提交审核成功提示 */
const showReviewModal = ref(false);
const reviewTarget = ref<CourseInfo | null>(null);

/** 下架确认弹窗 */
const showOffShelfModal = ref(false);
const offShelfTarget = ref<CourseInfo | null>(null);

/** 撤回审核相关状态 */
const showWithdrawModal = ref(false);
const withdrawTarget = ref<CourseInfo | null>(null);
const withdrawing = ref(false);

/** 下架申请中状态 */
const offShelving = ref(false);
/**
 * 状态筛选标签页
 */
const statusTabs = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending' },
  { label: '已上架', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已下架', value: 'off_shelf' },
];

/**
 * 查询参数
 */
const query = reactive<CourseQuery>({
  page: 1,
  pageSize: 12,
  status: '',
  keyword: '',
});

// ============ 方法 ============

/**
 * 获取课程列表
 * 功能描述：根据筛选条件从后端获取课程列表
 */
const fetchCourses = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const params: CourseQuery = {
      page: query.page,
      pageSize: query.pageSize,
    };
    if (query.status) params.status = query.status;
    if (query.keyword) params.keyword = query.keyword;

    const result = await getMyCourses(params);
    courses.value = result.items;
    currentPage.value = result.meta.page;
    totalPages.value = result.meta.totalPages;
    total.value = result.meta.total;
  } catch (error: any) {
    console.error('获取课程列表失败:', error);
    courses.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 设置状态筛选
 * @param status 课程状态（空字符串表示全部）
 */
const setStatusFilter = (status: string) => {
  query.status = status as CourseStatus;
  query.page = 1;
  fetchCourses();
};

/**
 * 搜索输入处理（带防抖）
 */
const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    query.keyword = searchKeyword.value.trim();
    query.page = 1;
    fetchCourses();
  }, 500);
};

/**
 * 切换页码
 * @param page 目标页码
 */
const changePage = (page: number) => {
  query.page = page;
  fetchCourses();
};

/**
 * 获取状态标签文本
 * @param status 课程状态
 * @returns 状态中文描述
 */
const getStatusLabel = (status: CourseStatus): string => {
  const map: Record<CourseStatus, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已上架',
    rejected: '已驳回',
    off_shelf: '已下架',
  };
  return map[status] || status;
};

/**
 * 获取状态徽章样式类
 * @param status 课程状态
 * @returns 徽章CSS类名
 */
const getBadgeClass = (status: CourseStatus): string => {
  const map: Record<CourseStatus, string> = {
    draft: 'badge--info',
    pending: 'badge--warning',
    approved: 'badge--success',
    rejected: 'badge--danger',
    off_shelf: 'badge--primary',
  };
  return map[status] || 'badge--info';
};

/**
 * 格式化日期
 * @param dateStr 日期字符串
 * @returns 格式化后的日期（yyyy-MM-dd）
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 提交审核
 * @param course 目标课程
 */
const submitForReview = async (course: CourseInfo) => {
  try {
    await updateCourseStatus(course.id, 'pending');
    reviewTarget.value = course;
    showReviewModal.value = true;
    // 刷新列表
    await fetchCourses();
  } catch (error: any) {
    ElMessage.error(error.message || '提交审核失败');
  }
};

/**
 * 确认删除弹窗
 * @param course 目标课程
 */
const confirmDelete = (course: CourseInfo) => {
  deleteTarget.value = course;
  showDeleteModal.value = true;
};

/**
 * 执行删除操作
 */
const doDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await deleteCourse(deleteTarget.value.id);
    ElMessage.success('课程已删除');
    showDeleteModal.value = false;
    deleteTarget.value = null;
    await fetchCourses();
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败');
  } finally {
    deleting.value = false;
  }
};

/**
 * 确认撤回审核（弹出确认弹窗）
 * @param course 目标课程
 */
const confirmWithdrawReview = (course: CourseInfo) => {
  withdrawTarget.value = course;
  showWithdrawModal.value = true;
};

/**
 * 执行撤回审核操作
 * 功能描述：调用后端撤回审核接口，根据申请类型回到对应状态
 */
const doWithdrawReview = async () => {
  if (!withdrawTarget.value) return;
  withdrawing.value = true;
  try {
    await withdrawReview(withdrawTarget.value.id);
    ElMessage.success('已撤回审核申请');
    showWithdrawModal.value = false;
    withdrawTarget.value = null;
    await fetchCourses();
  } catch (error: any) {
    ElMessage.error(error.message || '撤回审核失败');
  } finally {
    withdrawing.value = false;
  }
};

/**
 * 确认下架（弹出确认弹窗）
 * @param course 目标课程
 */
const confirmOffShelf = (course: CourseInfo) => {
  offShelfTarget.value = course;
  showOffShelfModal.value = true;
};

/**
 * 执行下架申请
 * 功能描述：调用后端下架申请接口，提交审核
 */
const doOffShelf = async () => {
  if (!offShelfTarget.value) return;
  offShelving.value = true;
  try {
    await requestOffShelf(offShelfTarget.value.id);
    ElMessage.success('下架申请已提交，等待管理员审核');
    showOffShelfModal.value = false;
    offShelfTarget.value = null;
    await fetchCourses();
  } catch (error: any) {
    ElMessage.error(error.message || '下架申请失败');
  } finally {
    offShelving.value = false;
  }
};

// ============ 生命周期 ============

onMounted(() => {
  fetchCourses();
});
</script>

<style scoped>
/* ============================================================
 * TeacherCourses 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

/* ---- 页面头部 ---- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-header__left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

.page-desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
}

/* ---- 筛选栏 ---- */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  white-space: nowrap;
}

.filter-tabs {
  display: flex;
  gap: 2px;
  background-color: var(--va-background-secondary);
  border-radius: var(--va-square-border-radius);
  padding: 2px;
}

.filter-tab {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--va-on-background-secondary);
  background: none;
  border: none;
  border-radius: calc(var(--va-square-border-radius) - 2px);
  cursor: pointer;
  transition: var(--va-transition);
  white-space: nowrap;
}

.filter-tab:hover {
  color: var(--va-on-background-primary);
}

.filter-tab--active {
  color: var(--va-primary);
  background-color: var(--va-background-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ---- 搜索框 ---- */
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background-color: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  transition: var(--va-transition);
  min-width: 240px;
}

.search-box:focus-within {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
}

.search-box__icon {
  color: var(--va-on-background-element);
  flex-shrink: 0;
}

.search-box__input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
}

.search-box__input::placeholder {
  color: var(--va-on-background-element);
}

/* ---- 加载骨架屏 ---- */
.loading-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--va-background-element) 25%,
    var(--va-background-secondary) 50%,
    var(--va-background-element) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--va-square-border-radius);
}

.skeleton--thumb {
  width: 200px;
  height: 120px;
  flex-shrink: 0;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton--title {
  height: 1.25rem;
  width: 60%;
}

.skeleton--text {
  height: 0.875rem;
  width: 90%;
}

.skeleton--text-short {
  height: 0.875rem;
  width: 40%;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 课程列表 ---- */
.course-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-card {
  display: flex;
  gap: 1.5rem;
  padding: 1.25rem;
  transition: var(--va-swing-transition);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
}

.course-card:hover {
  box-shadow: var(--va-box-shadow);
}

/* ---- 课程封面 ---- */
.course-card__cover {
  position: relative;
  width: 220px;
  height: 130px;
  flex-shrink: 0;
  border-radius: var(--va-square-border-radius);
  overflow: hidden;
  background-color: var(--va-background-secondary);
}

.course-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-card__badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
}

.course-card__type {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.0375rem;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  text-transform: uppercase;
}

/* ---- 课程信息 ---- */
.course-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.course-card__title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-card__desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: auto;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--va-on-background-element);
  white-space: nowrap;
}

.course-card__time {
  font-size: 0.75rem;
  color: var(--va-muted);
  margin-top: 0.25rem;
}

/* ---- 驳回原因展示 ---- */
.reject-reason {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.625rem;
  background-color: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.18);
  border-radius: var(--va-square-border-radius);
}

.reject-reason__icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: var(--va-danger);
}

.reject-reason__content {
  flex: 1;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--va-on-background-primary);
}

.reject-reason__label {
  font-weight: 600;
  color: var(--va-danger);
  margin-right: 0.25rem;
}

.reject-reason__text {
  color: var(--va-on-background-primary);
}

/* ---- 课程操作 ---- */
.course-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  min-width: 120px;
  flex-shrink: 0;
}

.course-card__actions .btn {
  width: 100%;
  justify-content: center;
}

.status-hint {
  font-size: 0.75rem;
  color: var(--va-warning);
  text-align: center;
}

/* ---- 分页 ---- */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--va-on-background-primary);
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-square-border-radius);
  cursor: pointer;
  transition: var(--va-transition);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--va-primary);
  color: var(--va-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
}

/* ---- 弹窗 ---- */
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
  width: 400px;
  max-width: 90vw;
}

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

.modal-body {
  padding: 1.25rem;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: var(--va-block-border);
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  gap: 1rem;
}

.empty-icon {
  color: var(--va-muted);
  opacity: 0.5;
}

.empty-text {
  font-size: 0.875rem;
  color: var(--va-muted);
  margin: 0;
}

/* ---- 工具类 ---- */
.text-sm { font-size: 0.8125rem; }
.text-muted { color: var(--va-muted); }
.text-danger { color: var(--va-danger) !important; }
.text-warning { color: var(--va-warning) !important; }
</style>
