<!--
 * ProducerLayout - 制作人端布局组件
 *
 * 功能描述：提供制作人视角的侧边栏 + 顶部栏 + 主内容区布局结构。
 *           侧边栏包含精简导航菜单和用户信息，课程中心已移至公开首页。
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量实现主题切换
 * 变更说明：替代原 StudentLayout.vue，全站术语"学员/学生"统一为"制作人"
 -->

<template>
  <div class="producer-layout">
    <!-- ========== 侧边栏 ========== -->
    <aside class="sidebar">
      <!-- 品牌标识区 -->
      <div class="sidebar-header">
        <span class="sidebar-logo">🎛️</span>
        <span class="va-title">学习空间</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item--active': route.path.startsWith(item.path) }"
        >
          <span class="nav-item__icon" v-html="item.icon"></span>
          <span class="nav-item__label">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- 用户信息底部 -->
      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-avatar">{{ authStore.userInfo?.nickname?.charAt(0) || 'P' }}</span>
          <div class="user-detail">
            <span class="user-name">{{ authStore.userInfo?.nickname }}</span>
            <span class="user-role badge badge--primary">制作人</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ========== 主内容区 ========== -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <span class="topbar-title">学习空间</span>
        </div>
        <div class="topbar-right">
          <el-button type="primary" size="small" @click="goHome">回到主页</el-button>
          <span class="topbar-greeting">欢迎回来，{{ authStore.userInfo?.nickname }}</span>
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
 * ProducerLayout 布局组件
 *
 * @description 制作人端的布局容器，包含侧边栏导航和顶部操作栏
 *              课程浏览功能已移至公开首页，此处聚焦已购课程和个人管理
 */
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import ThemeToggle from '../components/ThemeToggle.vue';
import BackToTop from '../components/BackToTop.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

/**
 * 导航菜单配置
 * icon 字段使用内联 SVG 字符串，避免引入 Element Plus 图标库
 * 菜单精简为：返回首页、我的课程、订单（预留）、个人设置
 */
const navItems = [
  {
    path: '/producer/my-courses',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    label: '我的课程',
  },
  {
    path: '/producer/orders',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    label: '我的订单',
  },
  {
    path: '/producer/cart',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    label: '购物车',
  },
  {
    path: '/producer/profile',
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
 * ProducerLayout 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.producer-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--va-background-secondary);
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

/* ---- 导航菜单 ---- */
.sidebar-nav {
  flex: 1;
  padding: var(--va-gap-large) 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
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

.topbar-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--va-gap-large);
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
</style>
