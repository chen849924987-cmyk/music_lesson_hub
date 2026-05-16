<!--
 * 主题切换按钮组件
 *
 * 功能描述：提供一个可点击的图标按钮，用于在亮色/暗色主题之间切换。
 *           使用 Pinia 的 useThemeStore 管理主题状态，并自动适配当前主题。
 *
 * 使用方式：
 *   <ThemeToggle />
 *
 * 设计参考：Vuestic UI 的图标按钮规范，采用简洁的圆形按钮 + SVG 图标
 -->

<template>
  <button
    class="theme-toggle"
    :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
    aria-label="切换主题"
    @click="themeStore.toggleTheme()"
  >
    <!-- 亮色模式图标：太阳 -->
    <svg
      v-if="!themeStore.isDark"
      class="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>

    <!-- 暗色模式图标：月亮 -->
    <svg
      v-else
      class="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
/**
 * ThemeToggle 组件
 *
 * @description 亮色/暗色主题切换按钮，使用太阳/月亮图标表示当前模式
 */
import { useThemeStore } from '../stores/theme';

/** 主题 Store 实例 */
const themeStore = useThemeStore();

</script>

<style scoped>
/*
 * 主题切换按钮样式
 * 遵循 Vuestic UI 设计规范，采用圆形按钮 + 柔和阴影
 */
.theme-toggle {
  /* 尺寸与布局 */
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* 外观 */
  border-radius: 50%;
  background-color: var(--va-background-secondary);
  color: var(--va-on-background-primary);
  border: var(--va-block-border);

  /* 交互反馈 */
  cursor: pointer;
  transition: var(--va-swing-transition);
}

/* 悬停效果：轻微提升阴影并变亮 */
.theme-toggle:hover {
  box-shadow: var(--va-box-shadow);
  background-color: var(--va-background-element);
  transform: scale(1.05);
}

/* 点击效果 */
.theme-toggle:active {
  transform: scale(0.95);
}

/*
 * SVG 图标样式
 * 统一的尺寸和过渡动画
 */
.theme-toggle__icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: var(--va-transition);
}
</style>
