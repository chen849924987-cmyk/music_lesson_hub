<!--
 * TeacherWithdrawals - 教师端提现记录页
 *
 * 功能描述：展示当前教师的所有提现申请记录，包括提现金额、状态、时间等信息
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
-->

<template>
  <div class="teacher-withdrawals">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">提现记录</h1>
        <span class="page-desc">查看所有的提现申请和处理进度</span>
      </div>
      <router-link to="/teacher/earnings" class="btn btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        返回收益中心
      </router-link>
    </div>

    <!-- ========== 加载状态 ========== -->
    <div v-if="loading" class="loading-container">
      <div class="skeleton skeleton--row" v-for="i in 5" :key="i"></div>
    </div>

    <!-- ========== 提现记录列表 ========== -->
    <template v-else-if="withdrawals.length > 0">
      <div class="withdrawal-list">
        <div v-for="item in withdrawals" :key="item.id" class="withdrawal-item card">
          <div class="withdrawal-item__icon" :class="getStatusClass(item.status)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline v-if="item.status === 'approved'" points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline v-if="item.status === 'approved'" points="17 6 23 6 23 12"/>
              <circle v-if="item.status === 'pending'" cx="12" cy="12" r="10"/><polyline v-if="item.status === 'pending'" points="12 6 12 12 16 14"/>
              <circle v-if="item.status === 'rejected'" cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              <rect v-if="item.status === 'processing'" x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="withdrawal-item__info">
            <span class="withdrawal-item__amount">¥{{ (item.amount / 100).toFixed(2) }}</span>
            <span class="withdrawal-item__account">收款账号：{{ item.accountInfo || '未填写' }}</span>
            <span class="withdrawal-item__time">申请时间：{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="withdrawal-item__status">
            <span class="withdrawal-status" :class="'withdrawal-status--' + item.status">
              {{ getStatusLabel(item.status) }}
            </span>
            <span v-if="item.processedAt" class="withdrawal-item__processed">
              处理时间：{{ formatDate(item.processedAt) }}
            </span>
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
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
      <p class="empty-text">还没有提现记录</p>
      <router-link to="/teacher/earnings" class="btn btn-primary">去提现</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherWithdrawals 教师端提现记录页
 *
 * @description 展示所有提现申请记录列表
 */
import { ref, onMounted } from 'vue';
import { getWithdrawals } from '../../api/course';

/** 加载状态 */
const loading = ref(true);

/** 提现记录列表 */
const withdrawals = ref<any[]>([]);

/** 当前页码 */
const currentPage = ref(1);

/** 总页数 */
const totalPages = ref(1);

/**
 * 获取提现记录
 * @param page 页码
 */
const fetchWithdrawals = async (page: number = 1) => {
  loading.value = true;
  try {
    const result = await getWithdrawals({ page, pageSize: 20 });
    withdrawals.value = result.items;
    currentPage.value = result.meta.page;
    totalPages.value = result.meta.totalPages;
  } catch (error) {
    console.error('获取提现记录失败:', error);
    withdrawals.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 切换页码
 * @param page 目标页码
 */
const changePage = (page: number) => {
  fetchWithdrawals(page);
};

/**
 * 获取提现状态标签
 * @param status 状态
 * @returns 中文描述
 */
const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待审核',
    processing: '处理中',
    approved: '已到账',
    rejected: '已驳回',
    cancelled: '已取消',
  };
  return map[status] || status;
};

/**
 * 获取状态图标样式
 * @param status 状态
 * @returns CSS类名
 */
const getStatusClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'icon--warning',
    processing: 'icon--info',
    approved: 'icon--success',
    rejected: 'icon--danger',
    cancelled: 'icon--muted',
  };
  return map[status] || 'icon--muted';
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
  fetchWithdrawals();
});
</script>

<style scoped>
.teacher-withdrawals {
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
  height: 80px;
  background-color: var(--va-background-primary);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 提现记录列表 ---- */
.withdrawal-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.withdrawal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
  transition: var(--va-swing-transition);
}

.withdrawal-item:hover {
  box-shadow: var(--va-box-shadow);
}

.withdrawal-item__icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon--success {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--va-success);
}

.icon--warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--va-warning);
}

.icon--info {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--va-info);
}

.icon--danger {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--va-danger);
}

.icon--muted {
  background-color: rgba(148, 163, 184, 0.1);
  color: var(--va-muted);
}

.withdrawal-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.withdrawal-item__amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
}

.withdrawal-item__account {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.withdrawal-item__time {
  font-size: 0.75rem;
  color: var(--va-muted);
}

.withdrawal-item__status {
  text-align: right;
  flex-shrink: 0;
}

.withdrawal-status {
  font-size: 0.8125rem;
  font-weight: 600;
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
}

.withdrawal-status--pending {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--va-warning);
}

.withdrawal-status--processing {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--va-info);
}

.withdrawal-status--approved {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--va-success);
}

.withdrawal-status--rejected {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--va-danger);
}

.withdrawal-status--cancelled {
  background-color: rgba(148, 163, 184, 0.1);
  color: var(--va-muted);
}

.withdrawal-item__processed {
  display: block;
  font-size: 0.75rem;
  color: var(--va-muted);
  margin-top: 0.25rem;
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
