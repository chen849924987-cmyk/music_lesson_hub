<!--
 * MyOrders - 我的订单页面
 *
 * 功能描述：展示当前用户的订单列表，支持按状态筛选、查看详情、取消订单等操作。
 *           订单创建后可跳转到支付页面完成支付。
 *
 * 设计参考：Vuestic UI 双主题设计体系
 -->

<template>
  <div class="orders-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">我的订单</h1>
    </div>

    <!-- 状态筛选标签 -->
    <div class="tabs-wrapper">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ 'tab-btn--active': currentStatus === tab.value }"
        @click="handleTabChange(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 订单列表 -->
    <div v-if="loading" class="empty-state">
      <p class="empty-text">加载中...</p>
    </div>
    <div v-else-if="orders.length === 0" class="empty-state">
      <span class="empty-icon">📋</span>
      <p class="empty-text">暂无订单</p>
    </div>
    <div v-else class="orders-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card card"
      >
        <!-- 订单头部 -->
        <div class="order-header">
          <div class="order-meta">
            <span class="order-no">订单号：{{ order.orderNo }}</span>
            <span class="order-time">{{ formatTime(order.createdAt) }}</span>
          </div>
          <span
            class="order-status badge"
            :class="statusBadgeClass(order.status)"
          >
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <!-- 订单明细 -->
        <div v-if="order.items && order.items.length > 0" class="order-items">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="order-item"
          >
            <div class="item-info">
              <span class="item-title">{{ item.courseTitle }}</span>
            </div>
            <div class="item-price">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ item.price / 100 }}</span>
            </div>
          </div>
        </div>
        <!-- 无明细时展示课程ID -->
        <div v-else class="order-items">
          <div class="order-item">
            <span class="item-title">订单明细（共{{ order.totalAmount / 100 }}元）</span>
          </div>
        </div>

        <!-- 订单底部 -->
        <div class="order-footer">
          <div class="order-total">
            <span class="total-label">实付：</span>
            <span class="total-price">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ order.totalAmount / 100 }}</span>
            </span>
          </div>
          <div class="order-actions">
            <!-- 待支付：显示支付和取消按钮 -->
            <template v-if="order.status === 'pending'">
              <button
                class="btn btn-primary btn-sm"
                @click="handlePay(order)"
              >
                立即支付
              </button>
              <button
                class="btn btn-secondary btn-sm"
                :disabled="order._confirming"
                @click="handleForceConfirm(order)"
              >
                {{ order._confirming ? '确认中...' : '确认支付' }}
              </button>
              <button
                class="btn btn-text btn-sm"
                @click="handleCancel(order.id)"
              >
                取消订单
              </button>
            </template>
            <!-- 已支付：显示查看详情 -->
            <template v-if="order.status === 'paid'">
              <router-link
                :to="`/producer/my-courses`"
                class="btn btn-primary btn-sm"
              >
                去学习
              </router-link>
            </template>
            <!-- 已取消/已退款：显示查看详情 -->
            <template v-if="order.status === 'cancelled' || order.status === 'refunded'">
              <button class="btn btn-text btn-sm" @click="handleDetail(order.id)">
                查看详情
              </button>
            </template>
          </div>
        </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * MyOrders 我的订单页面
 *
 * @description 展示当前用户的所有订单，支持状态筛选、取消、查看详情等操作
 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMyOrders, cancelOrder } from '../../api/order';
import { createPayment, confirmPayment } from '../../api/payment';

const router = useRouter();

/** 订单列表数据 */
const orders = ref<any[]>([]);
/** 页面加载状态 */
const loading = ref(true);
/** 当前筛选状态 */
const currentStatus = ref('');
/** 当前页码 */
const currentPage = ref(1);
/** 总页数 */
const totalPages = ref(1);
/** 每页条数 */
const pageSize = ref(10);

/**
 * 状态筛选标签配置
 * 空字符串表示"全部"
 */
const statusTabs = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'cancelled', label: '已取消' },
  { value: 'refunded', label: '已退款' },
];

/**
 * 加载订单列表
 * @param status 状态筛选（可选）
 * @param page 页码
 */
const loadOrders = async (status?: string, page?: number) => {
  try {
    loading.value = true;
    const params: any = { pageSize: pageSize.value };
    if (status) params.status = status;
    if (page) params.page = page;
    const result = await getMyOrders(params);
    orders.value = (result as any).items || [];
    const meta = (result as any).meta || {};
    currentPage.value = meta.page || 1;
    totalPages.value = meta.totalPages || 1;
  } catch (error) {
    console.error('加载订单失败:', error);
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 切换状态筛选标签
 * @param status 状态值
 */
const handleTabChange = (status: string) => {
  currentStatus.value = status;
  loadOrders(status || undefined, 1);
};

/**
 * 翻页
 * @param page 目标页码
 */
const changePage = (page: number) => {
  loadOrders(currentStatus.value || undefined, page);
};

/**
 * 格式化时间
 * @param dateStr 日期字符串
 * @returns 格式化的时间字符串
 */
const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * 获取订单状态标签文字
 * @param status 状态值
 * @returns 中文状态文字
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
 * 获取状态对应的 badge 样式类
 * @param status 状态值
 * @returns CSS 类名
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

/**
 * 取消订单
 * @param orderId 订单ID
 */
const handleCancel = async (orderId: number) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await cancelOrder(orderId);
    ElMessage.success('订单已取消');
    // 刷新列表
    loadOrders(currentStatus.value || undefined, currentPage.value);
  } catch {
    // 用户取消操作或接口错误
  }
};

/**
 * 强制确认支付（手动调用支付宝交易查询接口）
 * 功能描述：当支付宝异步通知未到达时，用户可手动触发此操作，
 * 后端会调用支付宝 trade.query 接口查询真实交易状态并更新本地订单
 * @param order 订单对象
 */
const handleForceConfirm = async (order: any) => {
  if (order._confirming) return;
  order._confirming = true;
  try {
    const res = await confirmPayment(order.orderNo);
    ElMessage.success('支付确认成功！');
    // 刷新订单列表
    loadOrders(currentStatus.value || undefined, currentPage.value);
  } catch (error: any) {
    const msg = error?.response?.data?.message || error.message || '确认失败';
    ElMessage.warning(msg);
    // 刷新订单列表（即使失败也刷新，因为通知可能已到达）
    loadOrders(currentStatus.value || undefined, currentPage.value);
  } finally {
    order._confirming = false;
  }
};

/**
 * 支付（生成支付宝支付链接并跳转）
 * @param order 订单对象
 */
const handlePay = async (order: any) => {
  try {
    const paymentResult = await createPayment(order.id);
    if (paymentResult?.payUrl) {
      // 直接跳转到支付宝支付页面
      window.open(paymentResult.payUrl, '_self');
    } else {
      ElMessage.error('获取支付链接失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('创建支付失败:', error);
    ElMessage.error(error.message || '创建支付失败');
  }
};

/**
 * 查看订单详情
 * @param orderId 订单ID
 */
const handleDetail = (orderId: number) => {
  ElMessage.info('订单详情弹窗即将实现');
};

// 页面挂载时加载订单列表
onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
/* ============================================================
 * MyOrders 页面样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.orders-page {
  max-width: 900px;
  margin: 0 auto;
}

/* ---- 页面标题 ---- */
.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

/* ---- 状态筛选标签 ---- */
.tabs-wrapper {
  display: flex;
  gap: var(--va-gap-small);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  background: var(--va-background-primary);
  color: var(--va-on-background-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: var(--va-transition);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tab-btn:hover {
  border-color: var(--va-primary);
  color: var(--va-primary);
}

.tab-btn--active {
  border-color: var(--va-primary);
  background-color: var(--va-primary-alpha);
  color: var(--va-primary);
  font-weight: 600;
}

.tab-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: var(--va-muted);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

/* ---- 订单卡片 ---- */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: var(--va-gap-large);
}

.order-card {
  padding: 1.25rem;
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--va-background-element);
  margin-bottom: 0.75rem;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-no {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  font-family: monospace;
}

.order-time {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

/* 订单明细 */
.order-items {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--va-background-element);
  margin-bottom: 0.75rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
}

.item-title {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.total-label {
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
}

.total-price {
  color: var(--va-danger);
  font-weight: 700;
}

.price-value {
  font-size: 1.125rem;
}

.order-actions {
  display: flex;
  gap: var(--va-gap-medium);
}

.btn-sm {
  font-size: 0.8125rem;
  padding: 0.375rem 0.875rem;
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
</style>
