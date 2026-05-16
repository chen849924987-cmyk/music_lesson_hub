<!--
 * BackToTop - 回到顶部按钮组件
 *
 * 功能描述：监听指定滚动容器的滚动事件，当滚动距离超过阈值时，
 *           在右下角显示悬浮按钮，点击后平滑滚动到容器顶部。
 *           适用于 AdminLayout / ProducerLayout / TeacherLayout 等
 *           带有可滚动主内容区的布局。
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
 *
 * @param {string} containerSelector - 滚动容器的 CSS 选择器（必填）
 * @param {number} threshold - 显示按钮的滚动阈值（px），默认 300
 * @param {number} right - 按钮距右侧距离（px），默认 24
 * @param {number} bottom - 按钮距底部距离（px），默认 40
-->
<template>
  <transition name="back-to-top-fade">
    <button
      v-if="visible"
      class="back-to-top"
      :style="{ right: right + 'px', bottom: bottom + 'px' }"
      @click="scrollToTop"
      :aria-label="'回到顶部'"
      :title="'回到顶部'"
    >
      <!-- 向上箭头 SVG -->
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  </transition>
</template>

<script setup lang="ts">
/**
 * BackToTop 回到顶部按钮
 *
 * @description 监听指定容器的滚动事件，超过阈值后在右下角显示悬浮按钮
 *
 * @param {string} containerSelector - 滚动容器的 CSS 选择器（必填）
 * @param {number} [threshold=300] - 显示按钮的滚动阈值（px）
 * @param {number} [right=24] - 按钮距右侧距离（px）
 * @param {number} [bottom=40] - 按钮距底部距离（px）
 * @return 无，仅渲染 UI 交互元素
 */
import { ref, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  containerSelector?: string;
  threshold?: number;
  right?: number;
  bottom?: number;
}>(), {
  containerSelector: '',
  threshold: 300,
  right: 24,
  bottom: 40,
});

/** 是否显示回到顶部按钮 */
const visible = ref(false);

/** 滚动容器 DOM 引用 */
let containerEl: HTMLElement | null = null;

/**
 * 滚动事件处理函数
 * 当容器的 scrollTop 超过阈值时显示按钮，否则隐藏
 */
const handleScroll = () => {
  if (!containerEl) return;
  visible.value = containerEl.scrollTop > props.threshold;
};

/**
 * 平滑滚动到容器顶部
 */
const scrollToTop = () => {
  if (!containerEl) return;
  containerEl.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

onMounted(() => {
  // 获取滚动容器
  if (props.containerSelector) {
    containerEl = document.querySelector(props.containerSelector);
  }
  if (containerEl) {
    // 针对布局中具有 overflow-y: auto 的滚动容器
    containerEl.addEventListener('scroll', handleScroll, { passive: true });
  } else {
    // 兜底：如果未指定容器或未找到指定容器，则监听 window 滚动（适用于独立公开页面）
    containerEl = document.documentElement;
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (containerEl) {
    if (containerEl === document.documentElement) {
      window.removeEventListener('scroll', handleScroll);
    } else {
      containerEl.removeEventListener('scroll', handleScroll);
    }
  }
});
</script>

<style scoped>
/* ============================================================
 * BackToTop 回到顶部按钮样式
 * 使用 --va-* 双主题 CSS 变量体系
 * 定位相对于最近的定位父级，使用 fixed 固定在视口右下角
 * ============================================================ */

.back-to-top {
  position: fixed;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: var(--va-primary);
  color: var(--va-on-primary);
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: var(--va-swing-transition);
  /* 防止按钮点击时触发其他事件 */
  pointer-events: auto;
}

.back-to-top:hover {
  background-color: var(--va-primary-darken);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

/* 暗色主题适配：使用降饱和度版本按钮背景 */
[data-theme="dark"] .back-to-top {
  background-color: var(--va-primary-darken);
}

[data-theme="dark"] .back-to-top:hover {
  background-color: var(--el-color-primary-dark-2);
}

/* ---- 过渡动画 ---- */
.back-to-top-fade-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.back-to-top-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.back-to-top-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.back-to-top-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
