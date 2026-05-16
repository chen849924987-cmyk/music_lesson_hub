<!--
 * Cart - 购物车页面
 *
 * 功能描述：展示当前用户的购物车内容，支持勾选结算、移除课程等操作。
 *           购物车为空时展示空状态提示，引导用户前往课程中心选课。
 *
 * 设计参考：Vuestic UI 双主题设计体系
 -->

<template>
  <div class="cart-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">购物车</h1>
      <span class="page-subtitle">共 {{ items.length }} 门课程</span>
    </div>

    <!-- 购物车为空 -->
    <div v-if="loading" class="empty-state">
      <span class="empty-icon">🛒</span>
      <p class="empty-text">加载中...</p>
    </div>
    <div v-else-if="items.length === 0" class="empty-state">
      <span class="empty-icon">🛒</span>
      <p class="empty-text">购物车是空的</p>
      <p class="empty-hint">快去挑选喜欢的课程吧</p>
      <router-link to="/courses" class="btn btn-primary">去课程中心</router-link>
    </div>

    <!-- 购物车列表 -->
    <template v-else>
      <div class="cart-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="cart-item card"
        >
          <!-- 勾选框 -->
          <label class="checkbox-wrapper">
            <input
              type="checkbox"
              :checked="selectedIds.has(item.courseId)"
              @change="toggleSelect(item.courseId)"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
          </label>

          <!-- 课程封面 -->
          <div class="item-cover">
            <img
              :src="item.course?.cover ? `${apiBaseUrl}/files/${item.course.cover}` : '/favicon.svg'"
              :alt="item.course?.title"
              class="cover-img"
            />
          </div>

          <!-- 课程信息 -->
          <div class="item-info">
            <router-link
              :to="`/courses/${item.courseId}`"
              class="item-title"
            >
              {{ item.course?.title || '未知课程' }}
            </router-link>
            <span class="item-type badge badge--info">
              {{ item.course?.courseType === 'series' ? '系列课' : '单课' }}
            </span>
          </div>

          <!-- 价格 -->
          <div class="item-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ (item.course?.price || 0) / 100 }}</span>
          </div>

          <!-- 删除按钮 -->
          <button class="btn btn-text remove-btn" @click="handleRemove(item.courseId)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 底部结算栏 -->
      <div class="cart-footer card">
        <label class="checkbox-wrapper select-all">
          <input
            type="checkbox"
            :checked="selectedIds.size === items.length"
            :indeterminate="selectedIds.size > 0 && selectedIds.size < items.length"
            @change="toggleSelectAll"
            class="checkbox-input"
          />
          <span class="checkbox-custom"></span>
          <span class="select-all-label">全选</span>
        </label>

        <div class="total-section">
          <span class="total-label">合计：</span>
          <span class="total-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ totalAmount / 100 }}</span>
          </span>
        </div>

        <button
          class="btn btn-primary checkout-btn"
          :disabled="selectedIds.size === 0"
          @click="handleCheckout"
        >
          去结算 ({{ selectedIds.size }})
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Cart 购物车页面组件
 *
 * @description 展示购物车课程列表，支持勾选、移除、全选、去结算操作
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCart, removeFromCart } from '../../api/cart';

/**
 * API 基础URL（从环境变量获取，用于拼接封面图片链接）
 */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';

const router = useRouter();

/** 购物车数据 */
const items = ref<any[]>([]);
/** 页面加载状态 */
const loading = ref(true);

/** 已勾选的课程ID集合 */
const selectedIds = ref<Set<number>>(new Set());

/**
 * 计算总金额（单位：分）
 * 遍历选中的课程累加 price 字段
 */
const totalAmount = computed(() => {
  let total = 0;
  for (const item of items.value) {
    if (selectedIds.value.has(item.courseId) && item.course?.price) {
      total += item.course.price;
    }
  }
  return total;
});

/**
 * 加载购物车数据
 * 页面挂载时从后端拉取最新购物车列表
 */
const loadCart = async () => {
  try {
    loading.value = true;
    const res = await getCart();
    items.value = res as any[];
  } catch (error) {
    console.error('加载购物车失败:', error);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 切换课程选中状态
 * @param courseId 课程ID
 */
const toggleSelect = (courseId: number) => {
  const newSet = new Set(selectedIds.value);
  if (newSet.has(courseId)) {
    newSet.delete(courseId);
  } else {
    newSet.add(courseId);
  }
  selectedIds.value = newSet;
};

/**
 * 全选/取消全选
 */
const toggleSelectAll = () => {
  if (selectedIds.value.size === items.value.length) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(items.value.map((item) => item.courseId));
  }
};

/**
 * 从购物车移除课程
 * @param courseId 课程ID
 */
const handleRemove = async (courseId: number) => {
  try {
    await ElMessageBox.confirm('确定要移除该课程吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await removeFromCart(courseId);
    ElMessage.success('已移除');
    // 从列表中移除
    items.value = items.value.filter((item) => item.courseId !== courseId);
    // 更新选中集合
    const newSet = new Set(selectedIds.value);
    newSet.delete(courseId);
    selectedIds.value = newSet;
  } catch {
    // 用户取消操作，不做处理
  }
};

/**
 * 去结算
 * 选中课程后跳转到下单确认页，携带 courseIds 参数
 */
const handleCheckout = () => {
  if (selectedIds.value.size === 0) {
    ElMessage.warning('请选择要结算的课程');
    return;
  }
  const courseIds = Array.from(selectedIds.value).join(',');
  router.push(`/checkout?courseIds=${courseIds}`);
};

// 页面挂载时加载购物车
onMounted(() => {
  loadCart();
});
</script>

<style scoped>
/* ============================================================
 * Cart 页面样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.cart-page {
  max-width: 900px;
  margin: 0 auto;
}

/* ---- 页面标题 ---- */
.page-header {
  display: flex;
  align-items: baseline;
  gap: var(--va-gap-large);
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
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

.empty-hint {
  font-size: 0.875rem;
  color: var(--va-on-background-element);
  margin: 0.5rem 0 1.5rem;
}

/* ---- 购物车列表 ---- */
.cart-list {
  display: flex;
  flex-direction: column;
  gap: var(--va-gap-large);
  margin-bottom: 1rem;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
  padding: 1rem;
  transition: var(--va-swing-transition);
}

.cart-item:hover {
  box-shadow: var(--va-box-shadow);
}

/* 自定义勾选框 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--va-background-border);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--va-transition);
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background-color: var(--va-primary);
  border-color: var(--va-primary);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  width: 0.375rem;
  height: 0.625rem;
  border: solid var(--va-text-inverted);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -2px;
}

/* 课程封面 */
.item-cover {
  width: 5rem;
  height: 3.5rem;
  border-radius: var(--va-square-border-radius);
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--va-background-element);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 课程信息 */
.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title:hover {
  color: var(--va-link-color);
}

/* 价格 */
.item-price {
  display: flex;
  align-items: baseline;
  gap: 1px;
  color: var(--va-danger);
  font-weight: 700;
  white-space: nowrap;
}

.price-symbol {
  font-size: 0.75rem;
}

.price-value {
  font-size: 1.125rem;
}

/* 删除按钮 */
.remove-btn {
  padding: 0.375rem;
  color: var(--va-on-background-element);
  flex-shrink: 0;
}

.remove-btn:hover {
  color: var(--va-danger);
}

/* ---- 底部结算栏 ---- */
.cart-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  gap: var(--va-gap-large);
  background-color: var(--va-background-primary);
  z-index: 10;
}

.select-all {
  gap: var(--va-gap-small);
}

.select-all-label {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
}

.total-section {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-left: auto;
}

.total-label {
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
}

.total-price {
  color: var(--va-danger);
  font-weight: 700;
}

.checkout-btn {
  min-width: 8rem;
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
