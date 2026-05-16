<!--
 * Checkout - 下单确认页
 *
 * 功能描述：确认订单信息，展示待购课程列表和金额，用户确认后创建订单并跳转支付。
 *
 * 设计参考：Vuestic UI 双主题设计体系
 -->

<template>
  <div class="checkout-page">
    <div class="page-header">
      <h1 class="page-title">确认订单</h1>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="empty-state">
      <span class="empty-icon">⏳</span>
      <p class="empty-text">加载订单信息...</p>
    </div>

    <!-- 课程列表 -->
    <div v-else class="checkout-content">
      <div class="card checkout-card">
        <h3 class="card-title">课程清单</h3>
        <div
          v-for="course in courses"
          :key="course.id"
          class="course-item"
        >
          <div class="course-cover">
            <img
              :src="course.cover ? `${apiBaseUrl}/files/${course.cover}` : '/favicon.svg'"
              :alt="course.title"
              class="cover-img"
            />
          </div>
          <div class="course-info">
            <template v-if="course.isLesson">
              <span class="course-title">{{ course.title }}</span>
              <span class="course-meta">
                <span class="badge badge--info">单课时</span>
                <span class="badge badge--primary">{{ course.courseTitle }}</span>
              </span>
            </template>
            <template v-else>
              <router-link :to="`/courses/${course.id}`" class="course-title">
                {{ course.title }}
              </router-link>
              <span class="course-type badge badge--info">
                {{ course.courseType === 'series' ? '系列课' : '单课' }}
              </span>
            </template>
          </div>
          <div class="course-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ course.price }}</span>
          </div>
        </div>
      </div>

      <!-- 支付方式 -->
      <div class="card payment-card">
        <h3 class="card-title">支付方式</h3>
        <div class="payment-methods">
          <label
            class="payment-option"
            :class="{ 'payment-option--selected': paymentMethod === 'alipay' }"
          >
            <input
              type="radio"
              v-model="paymentMethod"
              value="alipay"
              class="radio-input"
            />
            <span class="radio-custom"></span>
            <span class="payment-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1677FF">
                <path d="M21.422 15.358c-3.22-1.386-6.847-2.408-10.514-2.828 0 0 1.052-3.08 1.474-4.215 2.19.055 5.206.264 6.912-1.927 1.638-2.105.78-4.356-.295-5.467-1.132-1.17-3.656-1.387-5.133-1.16-3.344.508-5.25 3.57-6.178 5.69-.8 1.82-1.254 3.71-1.588 5.3-2.346.517-4.346 1.487-5.59 2.818 0 0 12.94 4.91 13.826 7.66.532 1.653-.482 3.17-1.555 3.625-1.074.456-2.506.278-3.516-.395-1.343-.895-1.77-2.353-1.48-3.743.128-.607.46-1.176.87-1.56 2.325.45 4.536 1.147 6.656 2.122l.023.01c.76.372 1.33 1.707.458 2.838-2.067 2.677-7.074 3.614-11.16 1.784-4.086-1.83-6.472-6.15-5.333-10.456.906-3.437 4.778-6.12 7.553-7.872 2.776-1.752 4.658-2.36 4.658-2.36s.437-.115 1.071-.153c1.316.023 4.77.936 5.58 2.772.81 1.836-.032 3.916-1.346 4.96-1.314 1.045-3.338 1.363-5.067 1.202l-.017-.003c-.444-1.562-.952-3.123-1.442-4.46-.43.762-1.216 2.169-1.604 3.172 3.383.598 6.57 1.683 9.446 3.137 1.652.836 2.442 2.118 2.36 3.366-.08 1.248-.917 2.167-1.72 2.368z"/>
              </svg>
              支付宝支付
            </span>
          </label>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="card checkout-actions">
        <div class="total-section">
          <span class="total-label">合计：</span>
          <span class="total-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ totalAmount }}</span>
          </span>
        </div>
        <div class="action-buttons">
          <button class="btn btn-secondary" @click="handleBack">返回修改</button>
          <button
            class="btn btn-primary"
            :disabled="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? '提交中...' : '提交订单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <BackToTop />
</template>

<script setup lang="ts">
/**
 * Checkout 下单确认页
 *
 * @description 展示待购课程清单、支付方式选择，提交创建订单
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createOrder } from '../../api/order';
import { createPayment } from '../../api/payment';
import { getCourseDetail } from '../../api/course';

/**
 * API 基础URL（从环境变量获取，用于拼接封面图片链接）
 */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';

const route = useRoute();
const router = useRouter();

/** 页面加载状态 */
const loading = ref(true);
/** 提交状态 */
const submitting = ref(false);
/** 待购买的课程列表 */
const courses = ref<any[]>([]);
/** 选择的支付方式 */
const paymentMethod = ref('alipay');

/**
 * 计算总金额（单位：元，后端已对 course.price 进行分→元转换）
 */
const totalAmount = computed(() => {
  return courses.value.reduce((sum, course) => sum + (course.price || 0), 0);
});

/**
 * 加载课程详情
 * 从 URL 参数中获取 courseIds（逗号分隔的课程ID）或 lessonIds（课时ID）
 */
const loadCourses = async () => {
  const courseIdsStr = route.query.courseIds as string;
  const lessonIdsStr = route.query.lessonIds as string;

  if (!courseIdsStr && !lessonIdsStr) {
    ElMessage.error('缺少课程信息');
    router.push('/producer/cart');
    return;
  }

  try {
    loading.value = true;

    if (lessonIdsStr) {
      // 课时单独购买模式
      const lessonIds = lessonIdsStr.split(',').map(Number).filter(Boolean);
      if (lessonIds.length === 0) {
        ElMessage.error('课时信息有误');
        router.push('/producer/cart');
        return;
      }
      // 直接从课程详情获取课时信息
      const courseId = Number(route.query.courseId);
      if (!courseId) {
        ElMessage.error('缺少课程ID');
        router.push('/producer/cart');
        return;
      }
      const courseDetail = await getCourseDetail(courseId);
      // 在章节中查找对应的课时
      let selectedLessons: any[] = [];
      if (courseDetail.chapters) {
        for (const chapter of courseDetail.chapters) {
          if (chapter.lessons) {
            for (const lesson of chapter.lessons) {
              if (lessonIds.includes(lesson.id)) {
                selectedLessons.push(lesson);
              }
            }
          }
        }
      }
      // 包装成课程格式展示（lesson.singlePrice 后端未进行分→元转换，需手动除以100）
      courses.value = selectedLessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        cover: courseDetail.cover,
        price: (lesson.singlePrice || 0) / 100,
        courseType: 'single',
        isLesson: true,
        courseId: courseDetail.id,
        courseTitle: courseDetail.title,
      }));
    } else if (courseIdsStr) {
      // 课程购买模式（原有逻辑）
      const courseIds = courseIdsStr.split(',').map(Number).filter(Boolean);
      if (courseIds.length === 0) {
        ElMessage.error('课程信息有误');
        router.push('/producer/cart');
        return;
      }
      const promises = courseIds.map((id) => getCourseDetail(id));
      const results = await Promise.all(promises);
      courses.value = results;
    }
  } catch (error) {
    console.error('加载课程信息失败:', error);
    ElMessage.error('加载课程信息失败');
    router.push('/producer/cart');
  } finally {
    loading.value = false;
  }
};

/**
 * 提交订单
 * 创建订单后跳转到支付页面
 */
const handleSubmit = async () => {
  if (courses.value.length === 0) {
    ElMessage.warning('请选择要购买的课程');
    return;
  }

  submitting.value = true;
  try {
    // 判断是否为课时单独购买
    const isLessonPurchase = courses.value.some((c) => c.isLesson);
    let order: any;
    if (isLessonPurchase) {
      const lessonIds = courses.value.map((c) => c.id);
      order = await createOrder({ lessonIds });
    } else {
      const courseIds = courses.value.map((c) => c.id);
      order = await createOrder({ courseIds });
    }
    ElMessage.success('订单创建成功');

    // 获取支付宝支付链接并跳转
    try {
      const paymentResult = await createPayment(order.id);
      if (paymentResult?.payUrl) {
        // 直接跳转到支付宝支付页面
        window.open(paymentResult.payUrl, '_self');
      } else {
        // 无支付链接，跳转到订单列表
        router.push('/producer/orders');
      }
    } catch (paymentError) {
      console.error('创建支付失败:', paymentError);
      ElMessage.warning('订单已创建，跳转到订单列表进行支付');
      router.push('/producer/orders');
    }
  } catch (error: any) {
    console.error('创建订单失败:', error);
    // 错误已在响应拦截器中处理
  } finally {
    submitting.value = false;
  }
};

/**
 * 返回修改（跳回购物车）
 * 路由对应制作人端的 /producer/cart
 */
const handleBack = () => {
  router.push('/producer/cart');
};

// 页面挂载时加载课程信息
onMounted(() => {
  loadCourses();
});
</script>

<style scoped>
/* ============================================================
 * Checkout 页面样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.checkout-page {
  max-width: 800px;
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

/* ---- 空状态/加载中 ---- */
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

/* ---- 卡片公用 ---- */
.checkout-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--va-background-element);
}

/* ---- 课程清单 ---- */
.course-item {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
  padding: 0.75rem 0;
}

.course-item + .course-item {
  border-top: 1px solid var(--va-background-element);
}

.course-cover {
  width: 4.5rem;
  height: 3rem;
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

.course-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-title:hover {
  color: var(--va-link-color);
}

.course-price {
  display: flex;
  align-items: baseline;
  gap: 1px;
  color: var(--va-danger);
  font-weight: 700;
  white-space: nowrap;
}

/* ---- 支付方式 ---- */
.payment-option {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
  padding: 1rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  cursor: pointer;
  transition: var(--va-transition);
}

.payment-option:hover {
  border-color: var(--va-primary);
}

.payment-option--selected {
  border-color: var(--va-primary);
  background-color: var(--va-primary-alpha);
}

.radio-input {
  display: none;
}

.radio-custom {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 2px solid var(--va-background-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--va-transition);
  flex-shrink: 0;
}

.radio-input:checked + .radio-custom {
  border-color: var(--va-primary);
}

.radio-input:checked + .radio-custom::after {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--va-primary);
}

.payment-label {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--va-on-background-primary);
}

/* ---- 底部操作栏 ---- */
.checkout-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.total-section {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.total-label {
  font-size: 0.9375rem;
  color: var(--va-on-background-secondary);
}

.total-price {
  color: var(--va-danger);
  font-weight: 700;
}

.price-symbol {
  font-size: 0.75rem;
}

.price-value {
  font-size: 1.25rem;
}

.action-buttons {
  display: flex;
  gap: var(--va-gap-large);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
