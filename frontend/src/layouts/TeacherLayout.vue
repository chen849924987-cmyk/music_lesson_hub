<!--
 * TeacherLayout - 教师端布局组件
 *
 * 功能描述：提供教师视角的侧边栏 + 顶部栏 + 主内容区布局结构。
 *           侧边栏包含导航菜单和用户信息，顶部栏包含主题切换、欢迎语和退出按钮。
 *           支持移动端响应式：侧边栏变为抽屉式覆盖层，顶部栏显示汉堡菜单按钮。
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量实现主题切换
 -->

<template>
  <div class="teacher-layout">
    <!-- ========== 移动端侧边栏遮罩层 ========== -->
    <div
      v-if="sidebarOpen && isMobile"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- ========== 侧边栏 ========== -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <!-- 品牌标识区 + 关闭按钮（移动端） -->
      <div class="sidebar-header">
        <span class="sidebar-logo">📖</span>
        <span class="va-title">教师端</span>
        <button class="sidebar-close show-mobile" @click="sidebarOpen = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item--active': route.path.startsWith(item.path) }"
          @click="sidebarOpen = false"
        >
          <span class="nav-item__icon" v-html="item.icon"></span>
          <span class="nav-item__label">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- 用户信息底部 -->
      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-avatar">{{ authStore.userInfo?.nickname?.charAt(0) || 'T' }}</span>
          <div class="user-detail">
            <span class="user-name">{{ authStore.userInfo?.nickname }}</span>
            <span class="user-role badge badge--purple">教师</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ========== 主内容区 ========== -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <!-- 移动端汉堡菜单按钮 -->
          <button class="hamburger-btn show-mobile" @click="sidebarOpen = true" aria-label="打开菜单">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span class="topbar-title">{{ currentPageTitle }}</span>
        </div>
        <div class="topbar-right">
          <el-button type="primary" size="small" class="hide-mobile" @click="goHome">回到主页</el-button>
          <span class="topbar-greeting hide-mobile">您好，{{ authStore.userInfo?.nickname }}</span>
          <!-- 主题切换按钮 -->
          <ThemeToggle />
          <button class="btn btn-text logout-btn" @click="handleLogout">
            退出
          </button>
        </div>
      </header>

      <!-- 路由视图 -->
      <main class="main-content">
        <router-view />
        <!-- 回到顶部按钮：监听 main-content 滚动 -->
        <BackToTop containerSelector=".main-content" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherLayout 布局组件
 *
 * @description 教师端的布局容器，包含侧边栏导航和顶部操作栏
 * @param none
 * @return 渲染教师端页面框架
 */
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import ThemeToggle from '../components/ThemeToggle.vue';
import BackToTop from '../components/BackToTop.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

/** 移动端侧边栏展开状态 */
const sidebarOpen = ref(false);

/** 是否为移动端屏幕（< 768px） */
const isMobile = ref(false);

/** 检查并更新屏幕尺寸判断 */
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  // 屏幕从小变大时关闭侧边栏
  if (!isMobile.value && sidebarOpen.value) {
    sidebarOpen.value = false;
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

/**
 * 当前页面标题，根据路由 meta.title 动态显示
 */
const currentPageTitle = computed(() => {
  return (route.meta?.title as string) || '教师端';
});

/**
 * 导航菜单配置
 * icon 字段使用内联 SVG 字符串，避免引入 Element Plus 图标库
 */
const navItems = [
  {
    path: '/teacher/dashboard',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    label: '数据概览',
  },
  {
    path: '/teacher/courses',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    label: '课程管理',
  },
  {
    path: '/teacher/producers',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    label: '制作人管理',
  },
  {
    path: '/teacher/earnings',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    label: '收益中心',
  },
  {
    path: '/teacher/profile',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    label: '个人中心',
  },
];

/**
 * 跳转到公开首页
 */
const goHome = () => {
  router.push('/home');
};

/**
 * 退出登录
 * 清除认证信息并跳转到登录页
 */
const handleLogout = () => {
  authStore.logout();
  router.push('/auth/login');
};
</script>

<style scoped>
/* ============================================================
 * TeacherLayout 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.teacher-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--va-background-secondary);
}

/* ---- 移动端遮罩层 ---- */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

@media (max-width: 767.98px) {
  .sidebar-overlay {
    display: block;
    animation: fadeIn 0.2s ease;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ---- 侧边栏 ---- */
.sidebar {
  width: 240px;
  background-color: var(--va-background-primary);
  border-right: var(--va-block-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

@media (max-width: 767.98px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  }

  .sidebar.sidebar--open {
    transform: translateX(0);
  }
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
  padding: 0 1.25rem;
  border-bottom: var(--va-block-border);
}

.sidebar-logo {
  font-size: 1.5rem;
}

.sidebar-title {
  font-family: var(--va-font-family);
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
}

/* 移动端侧边栏关闭按钮 */
.sidebar-close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--va-on-background-secondary);
  background: var(--va-background-secondary);
  cursor: pointer;
  transition: var(--va-transition);
}

.sidebar-close:hover {
  color: var(--va-on-background-primary);
  background: var(--va-background-element);
}

/* ---- 导航菜单 ---- */
.sidebar-nav {
  flex: 1;
  padding: var(--va-gap-large) 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
  padding: 0.625rem 0.875rem;
  border-radius: var(--va-square-border-radius);
  color: var(--va-on-background-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: var(--va-transition);
  position: relative;
}

.nav-item:hover {
  color: var(--va-on-background-primary);
  background-color: var(--va-background-secondary);
}

.nav-item--active {
  color: var(--va-primary);
  background-color: var(--va-primary-alpha);
}

/* 激活指示条 */
.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background-color: var(--va-primary);
  border-radius: 0 2px 2px 0;
}

.nav-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.nav-item__label {
  flex: 1;
}

/* ---- 侧边栏底部（用户信息） ---- */
.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: var(--va-block-border);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
}

.user-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--va-primary), #b388ff);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 0.8125rem;
  color: var(--va-on-background-primary);
  font-weight: 500;
}

.user-role {
  font-size: 0.625rem;
  width: fit-content;
}

/* ---- 主区域 ---- */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---- 顶部栏 ---- */
.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background-color: var(--va-background-primary);
  border-bottom: var(--va-block-border);
}

@media (max-width: 767.98px) {
  .topbar {
    height: var(--va-topbar-height-mobile, 48px);
    padding: 0 0.75rem;
  }
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 移动端汉堡菜单按钮 */
.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--va-square-border-radius);
  color: var(--va-on-background-primary);
  background: transparent;
  cursor: pointer;
  transition: var(--va-transition);
}

.hamburger-btn:hover {
  background: var(--va-background-secondary);
}

.topbar-home-link {
  display: flex;
  align-items: center;
  color: var(--va-on-background-element);
  text-decoration: none;
  transition: var(--va-transition);
}
.topbar-home-link:hover {
  color: var(--va-primary);
}
.topbar-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
}

@media (max-width: 767.98px) {
  .topbar-title {
    font-size: 0.875rem;
  }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
}

@media (max-width: 767.98px) {
  .topbar-right {
    gap: var(--va-gap-medium);
  }
}

.topbar-greeting {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
}

/* 退出按钮（文字样式） */
.logout-btn {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: var(--va-transition);
}

.logout-btn:hover {
  color: var(--va-primary);
}

/* ---- 主内容 ---- */
.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background-color: var(--va-background-secondary);
}

@media (max-width: 767.98px) {
  .main-content {
    padding: var(--va-content-padding-mobile, 0.75rem);
  }
}
</style>
