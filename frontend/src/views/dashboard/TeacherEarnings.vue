<!--
 * TeacherEarnings - 教师端收益中心页
 *
 * 功能描述：展示教师的收益概览、收益明细和提现功能
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
-->

<template>
  <div class="teacher-earnings">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">收益中心</h1>
        <span class="page-desc">查看您的收益统计和明细记录</span>
      </div>
      <router-link to="/teacher/earnings/withdrawals" class="btn btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
        提现记录
      </router-link>
    </div>

    <!-- ========== 加载状态 ========== -->
    <div v-if="loading" class="loading-container">
      <div class="stats-grid">
        <div v-for="i in 4" :key="i" class="skeleton skeleton--card"></div>
      </div>
    </div>

    <!-- ========== 收益概览统计卡片 ========== -->
    <div v-else class="stats-grid">
      <div class="stat-card card">
        <div class="stat-card__header">
          <span class="stat-card__label">总收入</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <span class="stat-card__value">¥{{ earningsStats.totalEarnings.toFixed(2) }}</span>
      </div>

      <div class="stat-card card">
        <div class="stat-card__header">
          <span class="stat-card__label">可提现余额</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <span class="stat-card__value">¥{{ earningsStats.balance.toFixed(2) }}</span>
      </div>

      <div class="stat-card card">
        <div class="stat-card__header">
          <span class="stat-card__label">待结算金额</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <span class="stat-card__value">¥{{ earningsStats.pendingSettlement.toFixed(2) }}</span>
      </div>

      <div class="stat-card card">
        <div class="stat-card__header">
          <span class="stat-card__label">已提现金额</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
        <span class="stat-card__value">¥{{ earningsStats.totalWithdrawn.toFixed(2) }}</span>
      </div>
    </div>

    <!-- ========== 提现操作区 ========== -->
    <div class="withdraw-section card">
      <h2 class="section-title">申请提现</h2>
      <div class="withdraw-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">提现金额（元）</label>
            <div class="input-wrapper">
              <span class="input-prefix">¥</span>
              <input
                v-model="withdrawAmount"
                type="number"
                class="form-input"
                placeholder="请输入提现金额"
                :max="earningsStats.balance"
                min="1"
              />
            </div>
            <span class="form-hint">可提现余额：¥{{ earningsStats.balance.toFixed(2) }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">收款账号</label>
            <div class="form-readonly">
              <span class="readonly-text">{{ paymentAccount || '未设置' }}</span>
            </div>
            <span class="form-hint">
              收款账号来自<a href="/teacher/profile" class="form-link">个人中心设置</a>，修改请前往个人中心
            </span>
          </div>
        </div>
        <button
          class="btn btn-primary"
          :disabled="!canWithdraw || withdrawing"
          @click="handleWithdraw"
        >
          {{ withdrawing ? '提交中...' : '申请提现' }}
        </button>
      </div>
    </div>

    <!-- ========== 收益明细列表 ========== -->
    <div class="detail-section">
      <h2 class="section-title">收益明细</h2>

      <!-- 日期筛选 -->
      <div class="filter-bar">
        <div class="filter-group">
          <input
            v-model="dateRange.start"
            type="date"
            class="form-input form-input--small"
          />
          <span class="filter-separator">至</span>
          <input
            v-model="dateRange.end"
            type="date"
            class="form-input form-input--small"
          />
          <button class="btn btn-secondary btn--small" @click="() => fetchEarningsDetail()">
            筛选
          </button>
        </div>
      </div>

      <!-- 明细列表 -->
      <div v-if="detailLoading" class="loading-container">
        <div class="skeleton skeleton--row" v-for="i in 3" :key="i"></div>
      </div>

      <div v-else-if="detailList.length > 0" class="detail-list">
        <div v-for="item in detailList" :key="item.id" class="detail-item">
          <div class="detail-item__left">
            <span class="detail-item__type" :class="getTypeClass(item.type)">
              {{ getTypeLabel(item.type) }}
            </span>
            <span class="detail-item__course">{{ item.courseTitle }}</span>
            <span class="detail-item__time">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="detail-item__right">
            <span class="detail-item__amount" :class="item.amount >= 0 ? 'amount--income' : 'amount--expense'">
              {{ item.amount >= 0 ? '+' : '' }}¥{{ item.amount.toFixed(2) }}
            </span>
            <span v-if="item.remark" class="detail-item__remark">{{ item.remark }}</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-detail">
        <span class="text-muted">暂无收益明细</span>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="detailTotalPages > 1">
        <button
          class="pagination-btn"
          :disabled="detailPage <= 1"
          @click="changeDetailPage(detailPage - 1)"
        >
          上一页
        </button>
        <span class="pagination-info">第 {{ detailPage }} / {{ detailTotalPages }} 页</span>
        <button
          class="pagination-btn"
          :disabled="detailPage >= detailTotalPages"
          @click="changeDetailPage(detailPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- ========== 提现成功提示 ========== -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">提现申请已提交</h3>
          <button class="modal-close" @click="showSuccessModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>提现申请已成功提交，请耐心等待审核处理。</p>
          <p class="text-sm text-muted">提现金额：¥{{ lastWithdrawAmount.toFixed(2) }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showSuccessModal = false">我知道了</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherEarnings 教师端收益中心页
 *
 * @description 展示收益统计、提现申请和收益明细
 */
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getEarningsStats, getEarningsDetail, applyWithdrawal } from '../../api/course';
import { getProfile } from '../../api/user';

/** 加载状态 */
const loading = ref(true);
const detailLoading = ref(false);

/** 提现操作状态 */
const withdrawing = ref(false);

/** 收益统计数据 */
const earningsStats = ref({
  totalEarnings: 0,
  balance: 0,
  pendingSettlement: 0,
  totalWithdrawn: 0,
  paymentAccount: '',
  bankAccount: '',
  bankBranch: '',
});

/** 提现金额 */
const withdrawAmount = ref<number | null>(null);

/** 收款账号（只读，从教师个人设置中获取） */
const paymentAccount = ref('');

/** 是否可以提现 - 金额必填，后端会校验收款账号 */
const canWithdraw = computed(() => {
  const amount = withdrawAmount.value;
  return amount !== null && amount > 0 && amount <= earningsStats.value.balance;
});

/** 最后提现金额（用于成功提示） */
const lastWithdrawAmount = ref(0);

/** 成功弹窗 */
const showSuccessModal = ref(false);

/** 日期筛选范围 */
const dateRange = ref({
  start: '',
  end: '',
});

/** 收益明细列表 */
const detailList = ref<any[]>([]);

/** 明细分页 */
const detailPage = ref(1);
const detailTotalPages = ref(1);

/**
 * 获取收益统计
 */
const fetchEarningsStats = async () => {
  loading.value = true;
  try {
    // 并发请求收益统计和个人信息
    const [statsResult, profileResult] = await Promise.all([
      getEarningsStats(),
      getProfile().catch(() => null),
    ]);
    // 后端 Controller 已做 /100 转换（分→元），直接使用返回数据
    earningsStats.value = {
      totalEarnings: statsResult.totalEarnings,
      balance: statsResult.balance,
      pendingSettlement: statsResult.pendingSettlement,
      totalWithdrawn: statsResult.totalWithdrawn,
      paymentAccount: statsResult.paymentAccount || '',
      bankAccount: statsResult.bankAccount || '',
      bankBranch: statsResult.bankBranch || '',
    };

    // 优先从 profile API 获取收款账号（更可靠）
    // profile 返回的 teacher.paymentAccount 直接来自数据库
    if (profileResult && (profileResult as any).teacher?.paymentAccount) {
      paymentAccount.value = (profileResult as any).teacher.paymentAccount;
    } else if (statsResult.paymentAccount) {
      paymentAccount.value = statsResult.paymentAccount;
    } else {
      paymentAccount.value = '';
    }
  } catch (error) {
    console.error('获取收益统计失败:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 获取收益明细
 * @param page 页码
 */
const fetchEarningsDetail = async (page: number = 1) => {
  detailLoading.value = true;
  try {
    const params: any = { page, pageSize: 15 };
    if (dateRange.value.start) params.startDate = dateRange.value.start;
    if (dateRange.value.end) params.endDate = dateRange.value.end;

    const result = await getEarningsDetail(params);
    detailList.value = result.items;
    detailPage.value = result.meta.page;
    detailTotalPages.value = result.meta.totalPages;
  } catch (error) {
    console.error('获取收益明细失败:', error);
    detailList.value = [];
  } finally {
    detailLoading.value = false;
  }
};

/**
 * 切换明细页码
 * @param page 目标页码
 */
const changeDetailPage = (page: number) => {
  fetchEarningsDetail(page);
};

/**
 * 申请提现
 * 功能描述：教师只需输入提现金额，收款账号从个人设置自动读取
 */
const handleWithdraw = async () => {
  if (!canWithdraw.value) return;

  withdrawing.value = true;
  try {
    // 金额以"元"为单位发送，由后端 DTO 中做 * 100 转换为分存储
    // 前端不做二次转换，避免重复乘以100
    await applyWithdrawal({
      amount: Math.round(withdrawAmount.value!),
    });

    lastWithdrawAmount.value = withdrawAmount.value!;
    showSuccessModal.value = true;

    // 重置表单
    withdrawAmount.value = null;

    // 刷新统计数据
    await fetchEarningsStats();
    await fetchEarningsDetail();
  } catch (error: any) {
    ElMessage.error(error.message || '提现申请失败');
  } finally {
    withdrawing.value = false;
  }
};

/**
 * 获取收益类型标签
 * @param type 类型
 * @returns 中文描述
 */
const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    course_sale: '课程销售',
    withdrawal: '提现',
    refund: '退款',
    settlement: '结算',
    admin_adjust: '管理员调整',
  };
  return map[type] || type;
};

/**
 * 获取类型样式
 * @param type 类型
 * @returns CSS类名
 */
const getTypeClass = (type: string): string => {
  const map: Record<string, string> = {
    course_sale: 'badge--success',
    withdrawal: 'badge--danger',
    refund: 'badge--warning',
    settlement: 'badge--info',
    admin_adjust: 'badge--primary',
  };
  return map[type] || 'badge--info';
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
  return `${year}-${month}-${day}`;
};

onMounted(() => {
  fetchEarningsStats();
  fetchEarningsDetail();
});
</script>

<style scoped>
.teacher-earnings {
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

/* ---- 统计卡片网格 ---- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  padding: 1.25rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
}

.stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-card__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--va-on-background-element);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
}

/* ---- 提现操作区 ---- */
.withdraw-section {
  padding: 1.5rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 1rem;
}

.withdraw-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
}

.form-input {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  background-color: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  outline: none;
  transition: var(--va-transition);
}

.form-input:focus {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
}

.form-input--small {
  padding: 0.5rem 0.75rem;
  width: auto;
}

.input-wrapper {
  position: relative;
}

.input-prefix {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--va-on-background-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.input-wrapper .form-input {
  padding-left: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--va-muted);
}

/* ---- 筛选栏 ---- */
.filter-bar {
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-separator {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
}

/* ---- 收益明细 ---- */
.detail-section {
  margin-top: 0.5rem;
}

.detail-list {
  display: flex;
  flex-direction: column;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
  overflow: hidden;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--va-background-element);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item:hover {
  background-color: var(--va-background-hover);
}

.detail-item__left {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-item__type {
  font-size: 0.625rem;
  width: fit-content;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.detail-item__course {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  font-weight: 500;
}

.detail-item__time {
  font-size: 0.75rem;
  color: var(--va-muted);
}

.detail-item__right {
  text-align: right;
}

.detail-item__amount {
  font-size: 1rem;
  font-weight: 700;
  display: block;
}

.amount--income {
  color: var(--va-success);
}

.amount--expense {
  color: var(--va-danger);
}

.detail-item__remark {
  font-size: 0.75rem;
  color: var(--va-muted);
}

/* ---- 空状态 ---- */
.empty-detail {
  text-align: center;
  padding: 2rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
}

.text-muted {
  color: var(--va-muted);
  font-size: 0.875rem;
}

.text-sm {
  font-size: 0.8125rem;
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

.skeleton--card {
  height: 90px;
}

.skeleton--row {
  height: 60px;
  background-color: var(--va-background-primary);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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
</style>
