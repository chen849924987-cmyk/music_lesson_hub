<!--
 * TeacherProducers - 教师端制作人管理页
 *
 * 功能描述：展示购买了当前教师课程的所有制作人（学员）列表，支持分页查看
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
-->

<template>
  <div class="teacher-producers">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">制作人管理</h1>
        <span class="page-desc">查看已购买您课程的所有制作人信息</span>
      </div>
    </div>

    <!-- ========== 加载状态 ========== -->
    <div v-if="loading" class="loading-container">
      <div class="skeleton-table">
        <div class="skeleton skeleton--row" v-for="i in 5" :key="i"></div>
      </div>
    </div>

    <!-- ========== 制作人列表 ========== -->
    <template v-else-if="producers.length > 0">
      <div class="producer-list">
        <div v-for="producer in producers" :key="producer.userId + '-' + producer.courseId" class="producer-card card">
          <!-- 用户头像 -->
          <div class="producer-card__avatar">
            <img
              v-if="producer.avatar"
              :src="producer.avatar"
              :alt="producer.nickname"
              class="producer-card__img"
            />
            <span v-else class="producer-card__initial">
              {{ producer.nickname?.charAt(0) || '?' }}
            </span>
          </div>

          <!-- 用户信息 -->
          <div class="producer-card__info">
            <span class="producer-card__name">{{ producer.nickname || '匿名制作人' }}</span>
            <span class="producer-card__course">购买了课程「{{ producer.courseTitle }}」</span>
            <span class="producer-card__time">购买时间：{{ formatDate(producer.purchasedAt) }}</span>
          </div>

          <!-- 价格 -->
          <div class="producer-card__price">
            <span v-if="producer.price > 0" class="price-amount">¥{{ (producer.price / 100).toFixed(2) }}</span>
            <span v-else class="price-free">免费</span>
          </div>
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
    </template>

    <!-- ========== 空状态 ========== -->
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      </svg>
      <p class="empty-text">还没有制作人购买您的课程</p>
      <router-link to="/teacher/courses/create" class="btn btn-primary">创建课程</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherProducers 教师端制作人管理页
 *
 * @description 展示购买当前教师课程的所有制作人列表
 */
import { ref, onMounted } from 'vue';
import { getTeacherProducers } from '../../api/course';

/** 加载状态 */
const loading = ref(true);

/** 制作人列表 */
const producers = ref<any[]>([]);

/** 当前页码 */
const currentPage = ref(1);

/** 总页数 */
const totalPages = ref(1);

/**
 * 获取制作人列表
 * @param page 页码
 */
const fetchProducers = async (page: number = 1) => {
  loading.value = true;
  try {
    const result = await getTeacherProducers({ page, pageSize: 20 });
    producers.value = result.items;
    currentPage.value = result.meta.page;
    totalPages.value = result.meta.totalPages;
  } catch (error) {
    console.error('获取制作人列表失败:', error);
    producers.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 切换页码
 * @param page 目标页码
 */
const changePage = (page: number) => {
  fetchProducers(page);
};

/**
 * 格式化日期
 * @param dateStr 日期字符串
 * @returns 格式化日期
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

onMounted(() => {
  fetchProducers();
});
</script>

<style scoped>
.teacher-producers {
  max-width: 800px;
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

/* ---- 骨架屏 ---- */
.loading-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton {
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--va-square-border-radius);
}

.skeleton--row {
  height: 72px;
  background-color: var(--va-background-primary);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 制作人列表 ---- */
.producer-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.producer-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
  transition: var(--va-swing-transition);
}

.producer-card:hover {
  box-shadow: var(--va-box-shadow);
}

.producer-card__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--va-primary), #b388ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.producer-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producer-card__initial {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
}

.producer-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.producer-card__name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
}

.producer-card__course {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.producer-card__time {
  font-size: 0.75rem;
  color: var(--va-muted);
}

.producer-card__price {
  flex-shrink: 0;
  text-align: right;
}

.price-amount {
  font-size: 1rem;
  font-weight: 700;
  color: var(--va-primary);
}

.price-free {
  font-size: 0.8125rem;
  color: var(--va-success);
  font-weight: 500;
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
</style>
