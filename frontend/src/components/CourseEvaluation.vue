<!--
 * CourseEvaluation.vue - 课程评价组件
 *
 * 功能描述：展示课程的评价列表，支持已购制作人发表评价。
 *          包含星评选择、文字输入、评价提交功能。
 *          教师可回复评价。
 *
 * 设计参考：Vuestic UI 双主题体系
 -->
<template>
  <div class="course-evaluation">
    <!-- ========== 评价概览 ========== -->
    <div class="evaluation-header">
      <h3 class="evaluation-title">课程评价</h3>
      <div class="evaluation-summary">
        <div class="summary-rating">
          <span class="rating-value">{{ averageRating }}</span>
          <span class="rating-stars">
            <StarIcon
              v-for="s in 5"
              :key="s"
              :class="['star-icon', { 'star-icon--filled': s <= Math.round(averageRating) }]"
            />
          </span>
          <span class="rating-count">{{ totalCount }} 条评价</span>
        </div>
      </div>
    </div>

    <!-- ========== 发表评价（已购用户未评价时显示） ========== -->
    <div
      v-if="canEvaluate && !hasEvaluated"
      class="evaluation-form"
    >
      <h4 class="form-title">发表评价</h4>
      <div class="star-input">
        <span class="star-input-label">评分：</span>
        <span
          v-for="s in 5"
          :key="s"
          class="star-input-star"
          :class="{ 'star-input-star--active': s <= newRating }"
          @mouseenter="hoverRating = s"
          @mouseleave="hoverRating = 0"
          @click="newRating = s"
        >
          <StarIcon :class="['star-icon', { 'star-icon--filled': s <= (hoverRating || newRating) }]" />
        </span>
        <span class="star-input-text">{{ ratingText }}</span>
      </div>
      <textarea
        v-model="newContent"
        class="evaluation-textarea"
        placeholder="分享你的学习感受（选填）"
        rows="3"
        maxlength="2000"
      ></textarea>
      <div class="form-actions">
        <span class="char-count">{{ newContent.length || 0 }}/2000</span>
        <button
          class="btn btn-primary btn-sm"
          :disabled="submitting || newRating === 0"
          @click="submitEvaluation"
        >
          {{ submitting ? '提交中...' : '发表评价' }}
        </button>
      </div>
    </div>

    <!-- ========== 评价列表 ========== -->
    <div v-if="evaluations.length > 0" class="evaluation-list">
      <div
        v-for="evalItem in evaluations"
        :key="evalItem.id"
        class="evaluation-item"
      >
        <div class="evaluation-user">
          <div class="user-avatar">
            {{ (evalItem.user?.nickname || '匿名')[0] }}
          </div>
          <div class="user-info">
            <span class="user-name">
              {{ evalItem.user?.nickname || '匿名用户' }}
              <span v-if="evalItem.isPurchased" class="purchased-badge">已购</span>
              <span v-else class="unpurchased-badge">未购</span>
            </span>
            <span class="eval-date">{{ formatDate(evalItem.createdAt) }}</span>
          </div>
          <span class="eval-rating">
            <StarIcon
              v-for="s in 5"
              :key="s"
              :class="['star-icon', 'star-icon--small', { 'star-icon--filled': s <= evalItem.rating }]"
            />
          </span>
        </div>
        <p v-if="evalItem.content" class="eval-content">{{ evalItem.content }}</p>

        <!-- 教师回复 -->
        <div v-if="evalItem.replyContent" class="eval-reply">
          <div class="reply-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="reply-label">教师回复</span>
            <span class="reply-date">{{ formatDate(evalItem.repliedAt) }}</span>
          </div>
          <p class="reply-content">{{ evalItem.replyContent }}</p>
        </div>

        <!-- 教师回复入口（课程教师且未回复） -->
        <div
          v-if="isTeacher && !evalItem.replyContent"
          class="reply-form"
        >
          <textarea
            v-model="replyContents[evalItem.id]"
            class="reply-textarea"
            placeholder="回复该评价..."
            rows="2"
            maxlength="2000"
          ></textarea>
          <button
            class="btn btn-text btn-sm"
            :disabled="replying[evalItem.id] || !(replyContents[evalItem.id]?.trim())"
            @click="submitReply(evalItem.id)"
          >
            {{ replying[evalItem.id] ? '提交中...' : '回复' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 空状态 ========== -->
    <div v-else-if="!loading" class="empty-state">
      <span class="empty-state__icon">
        <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </span>
      <p class="empty-state__text">暂无评价，快来发表第一条评价吧</p>
    </div>

    <!-- ========== 加载态 ========== -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 3" :key="i" class="skeleton-eval">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--text"></div>
      </div>
    </div>

    <!-- ========== 分页 ========== -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="btn btn-secondary btn-sm"
        :disabled="currentPage <= 1"
        @click="goPage(currentPage - 1)"
      >
        上一页
      </button>
      <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="btn btn-secondary btn-sm"
        :disabled="currentPage >= totalPages"
        @click="goPage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CourseEvaluation 课程评价组件
 *
 * @description 展示课程评价列表，支持已购制作人发表评价和教师回复。
 *              需要传入 courseId 和 canEvaluate（是否可评价）属性。
 *
 * @param courseId - 课程ID
 * @param canEvaluate - 当前用户是否可以发表评价（已购+未评价+制作人角色）
 * @param isTeacher - 当前用户是否是课程教师
 *
 * @emits evaluated - 评价发表成功时触发，父组件可监听刷新数据
 */
import { ref, computed, onMounted, reactive } from 'vue';
import { StarIcon } from '@heroicons/vue/24/solid';
import { ElMessage } from 'element-plus';
import {
  getCourseEvaluations,
  createEvaluation,
  checkUserEvaluated,
  replyEvaluation,
  type EvaluationInfo,
} from '../api/evaluation';

const props = defineProps<{
  courseId: number;
  canEvaluate?: boolean;
  isTeacher?: boolean;
}>();

const emit = defineEmits<{
  evaluated: [];
}>();

// ========== 状态 ==========

/** 加载态 */
const loading = ref(true);

/** 评价列表 */
const evaluations = ref<EvaluationInfo[]>([]);

/** 当前页码 */
const currentPage = ref(1);

/** 总页数 */
const totalPages = ref(1);

/** 总评价数 */
const totalCount = ref(0);

/** 是否已评价 */
const hasEvaluated = ref(false);

/** 新评价 - 评分（1~5） */
const newRating = ref(0);

/** 新评价 - 悬停评分（用于鼠标悬停效果） */
const hoverRating = ref(0);

/** 新评价 - 文字内容 */
const newContent = ref('');

/** 是否提交中 */
const submitting = ref(false);

/** 回复内容映射表（evaluationId -> 回复内容） */
const replyContents = reactive<Record<number, string>>({});

/** 回复提交状态映射表（evaluationId -> 是否提交中） */
const replying = reactive<Record<number, boolean>>({});

// ========== 计算属性 ==========

/** 平均评分 */
const averageRating = computed(() => {
  if (evaluations.value.length === 0) return 0;
  const sum = evaluations.value.reduce((acc, e) => acc + e.rating, 0);
  return (sum / evaluations.value.length).toFixed(1);
});

/** 评分文字描述 */
const ratingText = computed(() => {
  const r = hoverRating.value || newRating.value;
  const texts = ['', '非常不满意', '不满意', '一般', '满意', '非常满意'];
  return texts[r] || '';
});

// ========== 方法 ==========

/**
 * 加载评价列表
 */
const loadEvaluations = async () => {
  loading.value = true;
  try {
    const result = await getCourseEvaluations(props.courseId, {
      page: currentPage.value,
      pageSize: 10,
    });
    evaluations.value = result.items;
    totalCount.value = result.meta.total;
    totalPages.value = result.meta.totalPages;
  } catch (err) {
    console.error('加载评价失败:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * 检查当前用户是否已评价
 */
const checkEvaluated = async () => {
  if (!props.canEvaluate) return;
  try {
    const result = await checkUserEvaluated(props.courseId);
    hasEvaluated.value = result.evaluated;
  } catch {
    // 静默失败
  }
};

/**
 * 发表评价
 */
const submitEvaluation = async () => {
  if (newRating.value === 0) {
    ElMessage.warning('请选择评分');
    return;
  }
  submitting.value = true;
  try {
    await createEvaluation(props.courseId, {
      rating: newRating.value,
      content: newContent.value || undefined,
    });
    ElMessage.success('评价发表成功');
    hasEvaluated.value = true;
    newRating.value = 0;
    newContent.value = '';
    // 重新加载评价列表
    currentPage.value = 1;
    await loadEvaluations();
    emit('evaluated');
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '评价发表失败');
  } finally {
    submitting.value = false;
  }
};

/**
 * 提交教师回复
 * @param evaluationId 评价ID
 */
const submitReply = async (evaluationId: number) => {
  const content = replyContents[evaluationId]?.trim();
  if (!content) return;

  replying[evaluationId] = true;
  try {
    await replyEvaluation(props.courseId, evaluationId, {
      replyContent: content,
    });
    ElMessage.success('回复成功');
    replyContents[evaluationId] = '';
    // 重新加载评价列表刷新数据
    await loadEvaluations();
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '回复失败');
  } finally {
    replying[evaluationId] = false;
  }
};

/**
 * 格式化日期
 * @param dateStr 日期字符串
 * @returns 格式化后的日期
 */
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
};

/**
 * 翻页
 * @param page 目标页码
 */
const goPage = (page: number) => {
  currentPage.value = page;
  loadEvaluations();
};

// ========== 生命周期 ==========
onMounted(() => {
  loadEvaluations();
  checkEvaluated();
});
</script>

<style scoped>
/* ============================================================
 * CourseEvaluation 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.course-evaluation {
  padding: 1.5rem 0;
}

/* ---- 评价概览 ---- */
.evaluation-header {
  margin-bottom: 1.5rem;
}

.evaluation-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0 0 0.75rem;
}

.evaluation-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--va-warning);
}

.rating-count {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
}

/* ---- 星星图标 ---- */
.star-icon {
  width: 1rem;
  height: 1rem;
  color: var(--va-background-element);
}

.star-icon--filled {
  color: var(--va-warning);
}

.star-icon--small {
  width: 0.75rem;
  height: 0.75rem;
}

/* ---- 发表评价表单 ---- */
.evaluation-form {
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.form-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.75rem;
}

.star-input {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.star-input-label {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  margin-right: 0.25rem;
}

.star-input-star {
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: transform var(--va-transition);
}

.star-input-star:hover {
  transform: scale(1.2);
}

.star-input-text {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  margin-left: 0.5rem;
}

.evaluation-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-form-element-border-radius);
  color: var(--va-on-background-primary);
  font-size: 0.8125rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color var(--va-transition), box-shadow var(--va-transition);
}

.evaluation-textarea:focus {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
  outline: none;
}

.evaluation-textarea::placeholder {
  color: var(--va-on-background-element);
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

/* ---- 评价列表 ---- */
.evaluation-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.evaluation-item {
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  padding: 1.25rem;
}

.evaluation-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.user-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
  color: var(--va-text-inverted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.purchased-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  color: var(--va-success);
  background-color: rgba(16, 185, 129, 0.12);
  letter-spacing: 0.0375rem;
  text-transform: uppercase;
}

.unpurchased-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  color: var(--va-on-background-element);
  background-color: var(--va-background-element);
  letter-spacing: 0.0375rem;
  text-transform: uppercase;
}

.eval-date {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

.eval-rating {
  display: flex;
  gap: 0.125rem;
  flex-shrink: 0;
}

.eval-content {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  line-height: 1.6;
  margin: 0;
}

/* ---- 教师回复 ---- */
.eval-reply {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--va-background-secondary);
  border-radius: var(--va-square-border-radius);
  border-left: 3px solid var(--va-primary);
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.375rem;
  color: var(--va-primary);
}

.reply-label {
  font-size: 0.75rem;
  font-weight: 600;
}

.reply-date {
  font-size: 0.6875rem;
  color: var(--va-on-background-element);
  margin-left: auto;
}

.reply-content {
  font-size: 0.8125rem;
  color: var(--va-on-background-primary);
  line-height: 1.5;
  margin: 0;
}

/* ---- 教师回复入口 ---- */
.reply-form {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.reply-textarea {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background-color: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-form-element-border-radius);
  color: var(--va-on-background-primary);
  font-size: 0.8125rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color var(--va-transition), box-shadow var(--va-transition);
}

.reply-textarea:focus {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
  outline: none;
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

.empty-state__icon {
  font-size: 2.5rem;
  opacity: 0.5;
  margin-bottom: 0.75rem;
}

.empty-state__text {
  font-size: 0.875rem;
  margin: 0;
}

/* ---- 加载态 ---- */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-eval {
  padding: 1.25rem;
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 0.75rem;
  border-radius: var(--va-square-border-radius);
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-line--title {
  width: 30%;
  height: 1rem;
}

.skeleton-line--text {
  width: 80%;
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
  margin-top: 1.5rem;
}

.pagination-info {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
}

/* ---- 响应式 ---- */
@media (max-width: 640px) {
  .evaluation-user {
    flex-wrap: wrap;
  }

  .eval-rating {
    margin-left: auto;
  }
}
</style>
