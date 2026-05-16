<!--
 * OrderManage - 管理端订单管理页面
 *
 * 功能描述：管理员查看所有订单，按状态筛选、搜索、查看详情、处理退款等操作。
 *
 * 设计参考：Vuestic UI 双主题设计体系
 -->

<template>
  <div class="order-manage">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
    </div>

    <!-- 搜索与筛选 -->
    <div class="card filter-bar">
      <div class="filters-row">
        <!-- 状态筛选 -->
        <div class="filter-group">
          <label class="filter-label">订单状态</label>
          <select v-model="filterStatus" class="select-input" @change="handleFilter">
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="refunded">已退款</option>
            <option value="refunding">退款中</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <!-- 订单号搜索 -->
        <div class="filter-group">
          <label class="filter-label">订单号</label>
          <input
            v-model="searchOrderNo"
            type="text"
            class="input"
            placeholder="输入订单号搜索"
            @keyup.enter="handleFilter"
          />
        </div>

        <button class="btn btn-primary" @click="handleFilter">查询</button>
        <button class="btn btn-text" @click="handleReset">重置</button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-row">
      <div class="stat-card card" v-for="stat in stats" :key="stat.label">
        <span class="stat-label">{{ stat.label }}</span>
        <span class="stat-value">{{ stat.value }}</span>
      </div>
    </div>

    <!-- 订单列表 -->
    <div v-if="loading" class="empty-state">
      <p class="empty-text">加载中...</p>
    </div>
    <div v-else-if="orders.length === 0" class="empty-state">
      <span class="empty-icon">📋</span>
      <p class="empty-text">暂无订单</p>
    </div>
    <div v-else class="orders-table-wrapper card">
      <table class="orders-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>课程</th>
            <th>金额</th>
            <th>状态</th>
            <th>支付方式</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td class="order-no-cell">{{ order.orderNo }}</td>
            <td>
              <span class="user-name">{{ order.user?.nickname || order.user?.username || '-' }}</span>
              <span class="user-id">ID: {{ order.userId }}</span>
            </td>
            <td>
              <div v-if="order.items && order.items.length > 0" class="course-titles">
                <span
                  v-for="item in order.items"
                  :key="item.id"
                  class="course-tag"
                >
                  {{ item.courseTitle }}
                </span>
              </div>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="amount-cell">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ order.totalAmount / 100 }}</span>
            </td>
            <td>
              <span
                class="badge"
                :class="statusBadgeClass(order.status)"
              >
                {{ statusLabel(order.status) }}
              </span>
            </td>
            <td>
              <span class="text-muted">{{ order.paymentMethod || '-' }}</span>
            </td>
            <td class="time-cell">{{ formatTime(order.createdAt) }}</td>
            <td>
              <div class="action-btns">
                <template v-if="order.status === 'paid'">
                  <button
                    class="btn btn-text btn-sm"
                    @click="handleRefund(order)"
                  >
                    退款
                  </button>
                </template>
                <template v-if="order.status === 'pending'">
                  <span class="text-muted">等待支付</span>
                </template>
                <template v-if="order.status === 'refunded' || order.status === 'cancelled'">
                  <span class="text-muted">已完成</span>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
      <button
        class="btn btn-text"
        :disabled="currentPage <= 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="btn btn-text"
        :disabled="currentPage >= totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 退款确认对话框 -->
    <div v-if="showRefundDialog" class="dialog-overlay" @click.self="showRefundDialog = false">
      <div class="dialog card">
        <h3 class="dialog-title">退款确认</h3>
        <p class="dialog-desc">确定要对以下订单执行退款操作吗？</p>
        <div class="dialog-order-info">
          <p>订单号：<strong>{{ refundOrderNo }}</strong></p>
          <p>金额：<strong class="text-danger">¥{{ refundAmount / 100 }}</strong></p>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-text" @click="showRefundDialog = false">取消</button>
          <button
            class="btn btn-danger"
            :disabled="refunding"
            @click="confirmRefund"
          >
            {{ refunding ? '处理中...' : '确认退款' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OrderManage 管理端订单管理页面
 *
 * @description 管理员管理所有订单，支持搜索、筛选、退款等操作
 */
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getAllOrders, refundOrder } from '../../api/order';

/** 订单列表 */
const orders = ref<any[]>([]);
/** 加载状态 */
const loading = ref(true);
/** 筛选状态 */
const filterStatus = ref('');
/** 订单号搜索 */
const searchOrderNo = ref('');
/** 当前页码 */
const currentPage = ref(1);
/** 总页数 */
const totalPages = ref(1);
/** 每页条数 */
const pageSize = ref(20);

/** 退款对话框控制 */
const showRefundDialog = ref(false);
const refunding = ref(false);
const currentRefundId = ref<number | null>(null);
const refundOrderNo = ref('');
const refundAmount = ref(0);

/** 统计概览数据 */
const stats = ref([
  { label: '总订单数', value: 0 },
  { label: '待支付', value: 0 },
  { label: '已支付', value: 0 },
  { label: '已退款', value: 0 },
]);

/**
 * 加载订单列表
 */
const loadOrders = async () => {
  try {
    loading.value = true;
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    if (filterStatus.value) params.status = filterStatus.value;

    const result = await getAllOrders(params);
    orders.value = (result as any).items || [];
    const meta = (result as any).meta || {};
    currentPage.value = meta.page || 1;
    totalPages.value = meta.totalPages || 1;

    // 更新统计（可选，根据后端返回数据调整）
    if (result.stats) {
      stats.value = [
        { label: '总订单数', value: result.stats.total || 0 },
        { label: '待支付', value: result.stats.pending || 0 },
        { label: '已支付', value: result.stats.paid || 0 },
        { label: '已退款', value: result.stats.refunded || 0 },
      ];
    }
  } catch (error) {
    console.error('加载订单列表失败:', error);
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

/** 执行筛选查询 */
const handleFilter = () => {
  currentPage.value = 1;
  loadOrders();
};

/** 重置筛选条件 */
const handleReset = () => {
  filterStatus.value = '';
  searchOrderNo.value = '';
  currentPage.value = 1;
  loadOrders();
};

/** 翻页 */
const changePage = (page: number) => {
  currentPage.value = page;
  loadOrders();
};

/** 打开退款确认对话框 */
const handleRefund = (order: any) => {
  currentRefundId.value = order.id;
  refundOrderNo.value = order.orderNo;
  refundAmount.value = order.totalAmount;
  showRefundDialog.value = true;
};

/** 确认退款 */
const confirmRefund = async () => {
  if (!currentRefundId.value) return;

  refunding.value = true;
  try {
    await refundOrder(currentRefundId.value, '管理员退款');
    ElMessage.success('退款成功');
    showRefundDialog.value = false;
    loadOrders();
  } catch (error) {
    console.error('退款失败:', error);
    ElMessage.error('退款操作失败');
  } finally {
    refunding.value = false;
  }
};

/**
 * 格式化时间
 */
const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * 获取状态标签
 */
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    refunded: '已退款',
    refunding: '退款中',
    cancelled: '已取消',
  };
  return map[status] || status;
};

/**
 * 获取状态 badge 样式
 */
const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'badge--warning',
    paid: 'badge--success',
    refunded: 'badge--danger',
    refunding: 'badge--warning',
    cancelled: 'badge--info',
  };
  return map[status] || 'badge--info';
};

// 页面挂载时加载
onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
/* ============================================================
 * OrderManage 页面样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

/* ---- 筛选栏 ---- */
.filter-bar {
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.filters-row {
  display: flex;
  align-items: flex-end;
  gap: var(--va-gap-large);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
}

.select-input,
.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  background-color: var(--va-background-primary);
  color: var(--va-on-background-primary);
  font-size: 0.875rem;
  min-width: 180px;
  transition: var(--va-transition);
}

.select-input:focus,
.input:focus {
  outline: none;
  border-color: var(--va-primary);
  box-shadow: var(--va-focus-ring);
}

/* ---- 统计概览 ---- */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--va-gap-large);
  margin-bottom: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem 1.25rem;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: var(--va-muted);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
  margin-right: 1rem;
}

.empty-text {
  font-size: 1rem;
  margin: 0;
}

/* ---- 订单表格 ---- */
.orders-table-wrapper {
  overflow-x: auto;
  padding: 0;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.orders-table thead {
  background-color: var(--va-background-secondary);
}

.orders-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--va-on-background-secondary);
  border-bottom: 2px solid var(--va-on-background-primary);
  white-space: nowrap;
}

.orders-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--va-background-element);
  vertical-align: middle;
}

.orders-table tbody tr:hover {
  background-color: var(--va-background-hover);
}

.order-no-cell {
  font-family: monospace;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.user-name {
  display: block;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
}

.user-id {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

.course-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.course-tag {
  font-size: 0.8125rem;
  color: var(--va-on-background-primary);
}

.amount-cell {
  white-space: nowrap;
  font-weight: 700;
  color: var(--va-danger);
}

.time-cell {
  white-space: nowrap;
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
}

.text-muted {
  color: var(--va-muted);
  font-size: 0.8125rem;
}

.text-danger {
  color: var(--va-danger);
}

.action-btns {
  display: flex;
  gap: var(--va-gap-medium);
}

.btn-sm {
  font-size: 0.8125rem;
  padding: 0.25rem 0.625rem;
}

/* ---- 分页 ---- */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--va-gap-large);
  padding: 1.5rem 0;
}

.page-info {
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---- 退款对话框 ---- */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  width: 400px;
  max-width: 90vw;
  padding: 1.5rem;
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0 0 0.75rem;
}

.dialog-desc {
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
  margin: 0 0 1rem;
}

.dialog-order-info {
  padding: 0.75rem;
  background-color: var(--va-background-secondary);
  border-radius: var(--va-square-border-radius);
  margin-bottom: 1.25rem;
}

.dialog-order-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--va-gap-large);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
