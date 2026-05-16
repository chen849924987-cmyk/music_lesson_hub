<!--
 * TeacherDashboard - 教师端控制台（数据概览）
 *
 * 功能描述：展示当前教师的教学数据统计概览，包括课程数、制作人数、待审核数、总收益等
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
-->

<template>
  <div class="teacher-dashboard">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">数据概览</h1>
        <span class="page-desc">查看您的教学数据和收益统计</span>
      </div>
    </div>

    <!-- ========== 加载状态 ========== -->
    <div v-if="loading" class="loading-container">
      <div class="stats-grid">
        <div v-for="i in 4" :key="i" class="stat-card skeleton skeleton--card"></div>
      </div>
    </div>

    <!-- ========== 统计卡片 ========== -->
    <div v-else class="stats-grid">
      <div class="stat-card card">
        <div class="stat-card__icon stat-card__icon--blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__value">{{ stats.totalCourses }}</span>
          <span class="stat-card__label">课程总数</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-card__icon stat-card__icon--green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__value">{{ stats.totalStudents }}</span>
          <span class="stat-card__label">制作人数</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-card__icon stat-card__icon--orange">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__value">{{ stats.pendingReviewCount }}</span>
          <span class="stat-card__label">待审核课程</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-card__icon stat-card__icon--purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__value">¥{{ stats.totalEarnings.toFixed(2) }}</span>
          <span class="stat-card__label">总收益</span>
        </div>
      </div>
    </div>

    <!-- ========== 快捷入口 ========== -->
    <div class="quick-actions">
      <h2 class="section-title">快捷入口</h2>
      <div class="actions-grid">
        <router-link to="/teacher/courses/create" class="action-card card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--va-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="action-card__title">创建课程</span>
          <span class="action-card__desc">发布新课程，分享知识</span>
        </router-link>

        <router-link to="/teacher/courses" class="action-card card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--va-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="action-card__title">课程管理</span>
          <span class="action-card__desc">管理课程内容和章节</span>
        </router-link>

        <router-link to="/teacher/earnings" class="action-card card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--va-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span class="action-card__title">收益中心</span>
          <span class="action-card__desc">查看收益明细和提现</span>
        </router-link>

        <router-link to="/teacher/profile" class="action-card card">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--va-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="action-card__title">个人中心</span>
          <span class="action-card__desc">管理个人信息和账号设置</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherDashboard 教师端控制台
 *
 * @description 展示教师的教学数据概览和快捷入口
 */
import { ref, onMounted } from 'vue';
import { getTeacherStats } from '../../api/course';

/** 加载状态 */
const loading = ref(true);

/** 统计数据 */
const stats = ref({
  totalCourses: 0,
  totalStudents: 0,
  pendingReviewCount: 0,
  totalEarnings: 0,
});

/**
 * 获取教师统计数据
 */
const fetchStats = async () => {
  loading.value = true;
  try {
    const result = await getTeacherStats();
    stats.value = result;
  } catch (error) {
    console.error('获取教师统计数据失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.teacher-dashboard {
  max-width: 960px;
}

/* ---- 页面头部 ---- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
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

/* ---- 统计卡片网格 ---- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
}

.stat-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__icon--blue {
  background-color: rgba(0, 102, 255, 0.1);
  color: var(--va-primary);
}

.stat-card__icon--green {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--va-success);
}

.stat-card__icon--orange {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--va-warning);
}

.stat-card__icon--purple {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}

.stat-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  line-height: 1.2;
}

.stat-card__label {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

/* ---- 骨架屏 ---- */
.loading-container .stat-card {
  height: 80px;
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

.skeleton--card {
  height: 80px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 快捷入口 ---- */
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  text-align: center;
  text-decoration: none;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
  transition: var(--va-swing-transition);
  cursor: pointer;
}

.action-card:hover {
  box-shadow: var(--va-box-shadow);
  transform: translateY(-2px);
}

.action-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
}

.action-card__desc {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}
</style>
