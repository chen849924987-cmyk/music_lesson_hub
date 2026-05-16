<script setup lang="ts">
import BackToTop from '../../components/BackToTop.vue';
/**
 * 支付成功页
 * 功能描述：支付宝同步跳转后的展示页面，显示支付成功信息并提供返回订单列表的入口
 * 注意：异步通知（notify）才是最终确认支付的手段，此页面仅作展示
 */
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { confirmPayment, queryPaymentStatus } from '../../api/payment';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

/** 订单号（从URL参数获取） */
const orderNo = ref('');
/** 支付状态 */
const status = ref<'loading' | 'success' | 'error'>('loading');
/** 错误信息 */
const errorMsg = ref('');

onMounted(async () => {
  // 从URL参数获取订单号（支付宝同步回传参数）
  const outTradeNo = (route.query.out_trade_no as string) || '';
  const tradeNo = (route.query.trade_no as string) || '';
  orderNo.value = outTradeNo;

  if (!outTradeNo) {
    status.value = 'error';
    errorMsg.value = '未获取到订单信息';
    return;
  }

  // 已登录用户尝试确认支付
  if (authStore.isLoggedIn) {
    try {
      // 第一步：查询本地订单状态（快速路径）
      const res = await queryPaymentStatus(outTradeNo);
      if (res?.status === 'paid') {
        status.value = 'success';
        return;
      }

      // 第二步：调用支付宝交易查询接口，尝试确认支付
      // 当支付宝异步通知（notify）未到达时（如沙箱环境延迟），
      // 此接口会查询支付宝真实交易状态，如果已支付则更新本地订单
      try {
        await confirmPayment(outTradeNo);
        // confirmPayment 成功表示订单已确认支付
        status.value = 'success';
        return;
      } catch (confirmError: any) {
        // 第三步：confirmPayment 失败，提取后端返回的具体错误消息
        // 注意：axios 400 错误时 confirmError.message 是 "Request failed with status code 400"
        // 实际的错误详情在 confirmError.response.data.message 中
        const backendMsg = confirmError?.response?.data?.message || '';
        console.warn('confirmPayment 失败:', backendMsg || confirmError?.message || confirmError);

        // 等待 3 秒让支付宝异步通知有机会到达
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 再次查询本地订单状态
        const retryRes = await queryPaymentStatus(outTradeNo);
        if (retryRes?.status === 'paid') {
          status.value = 'success';
          return;
        }

        // 第四步：支付结果仍不明确，显示待确认状态（而非乐观成功）
        status.value = 'error';
        errorMsg.value = '支付结果确认中，请稍后查看订单列表确认支付状态。如已扣款请联系客服。';
      }
    } catch (error: any) {
      // 请求异常（网络等），显示待确认状态
      status.value = 'error';
      errorMsg.value = '支付状态查询异常，请前往订单列表查看最新状态。';
    }
  } else {
    // 未登录用户，显示待确认提示
    status.value = 'error';
    errorMsg.value = '请先登录后查看订单支付状态。如已支付，登录后可在订单列表中查看。';
  }
});

/** 跳转到订单列表 */
function goToOrders() {
  if (authStore.isLoggedIn) {
    router.push('/producer/orders');
  } else {
    router.push('/auth/login?redirect=/producer/orders');
  }
}

/** 跳转到课程列表 */
function goToCourses() {
  router.push('/courses');
}
</script>

<template>
  <div class="payment-success-page">
    <div class="payment-card">
      <!-- 加载状态 -->
      <template v-if="status === 'loading'">
        <div class="icon-wrapper loading">
          <span class="icon-spinner"></span>
        </div>
        <h2>支付确认中...</h2>
        <p class="description">正在确认您的支付结果，请稍候</p>
      </template>

      <!-- 成功状态 -->
      <template v-if="status === 'success'">
        <div class="icon-wrapper success">
          <svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2>支付成功！</h2>
        <p class="description">感谢您的购买，订单已支付成功</p>
        <p v-if="orderNo" class="order-no">订单号：{{ orderNo }}</p>
      </template>

      <!-- 错误状态 -->
      <template v-if="status === 'error'">
        <div class="icon-wrapper error">
          <svg class="icon-cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <h2>支付异常</h2>
        <p class="description">{{ errorMsg || '支付遇到问题，请联系客服' }}</p>
      </template>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="btn btn-primary" @click="goToOrders">
          {{ authStore.isLoggedIn ? '查看订单' : '登录后查看订单' }}
        </button>
        <button class="btn btn-secondary" @click="goToCourses">
          继续浏览课程
        </button>
      </div>
    </div>
    <BackToTop />
  </div>
</template>

<style scoped>
.payment-success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--va-background-secondary);
  padding: 1.5rem;
}

.payment-card {
  background: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  box-shadow: var(--va-block-box-shadow);
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 440px;
  width: 100%;
}

.icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.icon-wrapper.success {
  background: rgba(16, 185, 129, 0.12);
  color: var(--va-success);
}

.icon-wrapper.error {
  background: rgba(239, 68, 68, 0.12);
  color: var(--va-danger);
}

.icon-wrapper.loading {
  background: var(--va-background-element);
  color: var(--va-secondary);
}

.icon-check,
.icon-cross {
  width: 36px;
  height: 36px;
}

.icon-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--va-background-border);
  border-top-color: var(--va-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin-bottom: 0.5rem;
}

.description {
  font-size: 0.9375rem;
  color: var(--va-on-background-secondary);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.order-no {
  font-size: 0.8125rem;
  color: var(--va-muted);
  font-family: 'Source Code Pro', monospace;
  margin-bottom: 1.5rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--va-square-border-radius);
  border: var(--va-control-border);
  cursor: pointer;
  transition: var(--va-swing-transition);
  letter-spacing: var(--va-letter-spacing);
}

.btn-primary {
  background: var(--va-primary);
  color: var(--va-on-primary);
}

.btn-primary:hover {
  background: var(--va-primary-darken);
}

.btn-secondary {
  background: transparent;
  color: var(--va-on-background-primary);
  border: 1px solid var(--va-background-border);
}

.btn-secondary:hover {
  background: var(--va-background-secondary);
}
</style>
