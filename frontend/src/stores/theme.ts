import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/**
 * 主题管理 Store
 *
 * 功能描述：管理亮色/暗色主题切换，将主题偏好持久化到 localStorage。
 *           通过监听主题变化，自动更新 HTML 根元素的 data-theme 属性。
 *
 * 使用方式：
 *   const themeStore = useThemeStore();
 *   themeStore.toggleTheme();       // 切换亮/暗
 *   themeStore.setTheme('dark');    // 指定主题
 *   themeStore.currentTheme;        // 当前主题（响应式）
 *   themeStore.isDark;              // 是否为暗色模式（计算属性）
 */
export const useThemeStore = defineStore('theme', () => {
  // ============ 常量 ============
  /** localStorage 存储键名 */
  const STORAGE_KEY = 'theme-preference';

  /** 支持的主题列表 */
  const THEMES = ['light', 'dark'] as const;

  // ============ 类型 ============
  type Theme = (typeof THEMES)[number];

  // ============ 状态 ============
  /**
   * 当前主题
   * 从 localStorage 读取持久化的偏好，若不存在则跟随系统偏好
   */
  const currentTheme = ref<Theme>(getInitialTheme());

  // ============ 计算属性 ============
  /** 是否为暗色模式 */
  const isDark = ref(currentTheme.value === 'dark');

  // ============ 方法 ============

  /**
   * 获取初始主题
   *
   * 优先级：
   *   1. localStorage 中用户手动设置的主题
   *   2. 系统 prefers-color-scheme 偏好
   *   3. 默认亮色主题 'light'
   *
   * @returns {'light' | 'dark'} 当前主题
   */
  function getInitialTheme(): Theme {
    // 步骤 1：检查 localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && THEMES.includes(saved)) {
      return saved;
    }

    // 步骤 2：跟随系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // 步骤 3：默认亮色
    return 'light';
  }

  /**
   * 切换主题（亮色 ↔ 暗色）
   */
  function toggleTheme(): void {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  }

  /**
   * 设置指定主题
   *
   * @param {Theme} theme - 目标主题 'light' | 'dark'
   */
  function setTheme(theme: Theme): void {
    if (THEMES.includes(theme)) {
      currentTheme.value = theme;
    }
  }

  // ============ 副作用 ============

  /**
   * 监听主题变化，更新 DOM 和 localStorage
   */
  watch(
    currentTheme,
    (newTheme) => {
      // 更新 html 根元素的 data-theme 属性
      document.documentElement.setAttribute('data-theme', newTheme);

      // 更新 isDark 计算属性
      isDark.value = newTheme === 'dark';

      // 持久化到 localStorage
      localStorage.setItem(STORAGE_KEY, newTheme);
    },
    { immediate: true }, // 初始化时立即执行一次，确保 DOM 与状态同步
  );

  // ============ 返回 ============
  return {
    // 状态
    currentTheme,
    isDark,
    // 方法
    toggleTheme,
    setTheme,
  };
});
