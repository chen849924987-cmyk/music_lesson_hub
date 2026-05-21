<!--
 * CourseCatalog.vue - 公开课程中心页面
 *
 * 功能描述：面向所有访客的课程浏览页面，无需登录即可查看已上架课程。
 *           支持按分类、价格筛选和关键词搜索，课程卡片引导访客进入详情页。
 *
 * 设计参考：Vuestic UI 双主题体系，卡片 + 筛选栏布局
 -->
<template>
  <div class="course-catalog">
    <!-- ========== 顶部导航栏（公开页专用，与首页样式统一） ========== -->
    <header class="catalog-header">
      <div class="header-inner">
        <!-- 品牌标识 -->
        <router-link to="/home" class="brand">
          <MusicalNoteIcon class="brand-icon" /> SoundCraft
        </router-link>

        <!-- 右侧导航链接与操作 -->
        <div class="header-right">
          <!-- 导航链接（与首页样式一致：圆角、hover背景、active背景） -->
          <nav class="header-nav">
            <router-link to="/home" class="nav-link">首页</router-link>
            <router-link to="/courses" class="nav-link nav-link--active">课程中心</router-link>
            <router-link to="/home#about" class="nav-link">关于我们</router-link>
          </nav>

          <!-- 未登录：与首页一致的登录/注册按钮 -->
          <template v-if="!authStore.isLoggedIn">
            <router-link to="/auth/login" class="nav-link">登录</router-link>
            <router-link to="/auth/register" class="nav-btn">免费注册</router-link>
          </template>

          <!-- 已登录：与首页一致的导航 -->
          <template v-else>
            <router-link :to="dashboardLink" class="nav-link nav-link--dashboard">
              {{ dashboardLabel }}
            </router-link>
            <a class="nav-link" @click="handleLogout">退出</a>
          </template>

          <!-- 主题切换（最右侧，与首页一致） -->
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- ========== 筛选栏 ========== -->
    <div class="catalog-filter-bar">
      <div class="filter-inner">
        <!-- 搜索框 -->
        <input
          v-model="searchKeyword"
          type="text"
          class="input filter-search"
          placeholder="搜索课程..."
          @keyup.enter="handleSearch"
        />

        <!-- 分类筛选 -->
        <div class="filter-categories">
          <button
            :class="['filter-tag', { 'filter-tag--active': selectedCategory === null }]"
            @click="selectCategory(null)"
          >
            全部
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="['filter-tag', { 'filter-tag--active': selectedCategory === cat.id }]"
            @click="selectCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 课程列表 ========== -->
    <main class="catalog-main">
      <!-- 加载态：骨架屏 -->
      <div v-if="loading" class="course-grid">
        <div v-for="i in 6" :key="i" class="course-card skeleton">
          <div class="skeleton-cover"></div>
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--text"></div>
            <div class="skeleton-line skeleton-line--text short"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="courses.length === 0" class="empty-state">
        <InboxIcon class="empty-state__icon" />
        <p class="empty-state__text">暂无课程，敬请期待</p>
      </div>

      <!-- 课程卡片网格 -->
      <div v-else class="course-grid">
        <router-link
          v-for="course in courses"
          :key="course.id"
          :to="`/courses/${course.id}`"
          class="course-card"
        >
          <!-- 封面 -->
          <div class="card-cover">
            <img
              v-if="course.cover"
              :src="course.cover"
              :alt="course.title"
              class="card-cover-img"
            />
            <div v-else class="card-cover-placeholder">
              <MusicalNoteIcon class="placeholder-icon" />
            </div>
            <!-- 课程类型标签 -->
            <span class="card-type-badge badge" :class="course.courseType === 'series' ? 'badge--info' : 'badge--primary'">
              {{ course.courseType === 'series' ? '系列课' : '单课' }}
            </span>
          </div>

          <!-- 内容 -->
          <div class="card-body">
            <h3 class="card-title">{{ course.title }}</h3>
            <p class="card-desc">{{ course.description || '暂无简介' }}</p>

            <!-- 元信息 -->
            <div class="card-meta">
              <span class="card-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ course.lessonCount ?? (course.chapters?.length || (course.lessons ? (Array.isArray(course.lessons) ? course.lessons.length : course.lessons.length) : 0)) }} 课时
              </span>
              <span class="card-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {{ course.studentCount }} 位制作人
              </span>
            </div>

            <!-- 价格与操作 -->
            <div class="card-footer">
              <span class="card-price" :class="{ 'card-price--free': course.price === 0 }">
                {{ course.price === 0 ? '免费' : `¥${course.price}` }}
              </span>
              <span class="card-action">
                查看详情 →
              </span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="btn btn-secondary btn-sm"
          :disabled="currentPage <= 1"
          @click="goPage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="pagination-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="currentPage >= totalPages"
          @click="goPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </main>

    <!-- ========== 页脚 ========== -->
    <footer class="catalog-footer">
      <p>&copy; {{ new Date().getFullYear() }} SoundCraft. All rights reserved.</p>
    </footer>

    <!-- 回到顶部按钮 -->
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
/**
 * CourseCatalog 课程中心组件
 *
 * @description 公开的课程浏览页面，访客可浏览所有已上架课程，按分类/搜索筛选。
 *              登录用户可从顶部导航快速跳转制作人中心/教师中心/管理后台。
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import ThemeToggle from '../../components/ThemeToggle.vue';
import BackToTop from '../../components/BackToTop.vue';
import { MusicalNoteIcon, InboxIcon } from '@heroicons/vue/24/outline';
import {
  getPublishedCourses,
  getCategories,
  type CourseInfo,
  type CategoryInfo,
} from '../../api/course';

const router = useRouter();
const authStore = useAuthStore();

// ========== 已登录用户的 dashboard 导航 ==========

/** 根据用户角色跳转到对应中心页 */
const dashboardLink = computed(() => {
  if (authStore.isAdmin || authStore.isSuperAdmin) return '/admin/dashboard';
  if (authStore.isTeacher) return '/teacher/courses';
  return '/producer/my-courses';
});

/** 按钮文字 */
const dashboardLabel = computed(() => {
  if (authStore.isAdmin || authStore.isSuperAdmin) return '管理后台';
  if (authStore.isTeacher) return '教学中心';
  return '学习空间';
});

/** 退出登录 */
const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

// ========== 状态 ==========

/** 课程列表 */
const courses = ref<CourseInfo[]>([]);

/** 分类列表 */
const categories = ref<CategoryInfo[]>([]);

/** 加载态 */
const loading = ref(true);

/** 当前页码 */
const currentPage = ref(1);

/** 总页数 */
const totalPages = ref(1);

/** 每页数量 */
const pageSize = 12;

/** 搜索关键词 */
const searchKeyword = ref('');

/** 选中的分类ID（null 表示全部） */
const selectedCategory = ref<number | null>(null);

// ========== 方法 ==========

/**
 * 加载课程数据
 * 功能描述：根据当前筛选条件加载已上架课程列表
 */
const loadCourses = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize,
      status: 'approved', // 只显示已上架
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };

    if (selectedCategory.value !== null) {
      params.categoryId = selectedCategory.value;
    }
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim();
    }

    const result = await getPublishedCourses(params);
    courses.value = result.items;
    totalPages.value = result.meta.totalPages;
  } catch (err) {
    console.error('加载课程列表失败:', err);
    courses.value = [];
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
};

/**
 * 加载分类列表
 */
const loadCategories = async () => {
  try {
    categories.value = await getCategories();
  } catch (err) {
    console.error('加载分类列表失败:', err);
  }
};

/**
 * 按分类筛选
 * @param categoryId 分类ID，null 表示全部
 */
const selectCategory = (categoryId: number | null) => {
  selectedCategory.value = categoryId;
  currentPage.value = 1;
  loadCourses();
};

/**
 * 按关键词搜索
 */
const handleSearch = () => {
  currentPage.value = 1;
  loadCourses();
};

/**
 * 翻页
 * @param page 目标页码
 */
const goPage = (page: number) => {
  currentPage.value = page;
  loadCourses();
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ========== 导航方法 ==========

/** 跳转登录页 */
const goLogin = () => {
  router.push({ name: 'Login', query: { redirect: '/courses' } });
};

/** 跳转制作人中心 */
const goProducer = () => {
  router.push('/producer');
};

/** 跳转教师中心 */
const goTeacher = () => {
  router.push('/teacher');
};

/** 跳转管理后台 */
const goAdmin = () => {
  router.push('/admin');
};

// ========== 生命周期 ==========
onMounted(() => {
  loadCourses();
  loadCategories();
});
</script>

<style scoped>
/* ============================================================
 * CourseCatalog 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.course-catalog {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--va-background-secondary);
}

/* ---- 顶部导航栏（与首页样式统一） ---- */
.catalog-header {
  background-color: var(--va-background-primary);
  border-bottom: var(--va-block-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  height: 64px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  text-decoration: none;
  flex-shrink: 0;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-nav {
  display: flex;
  gap: 4px;
  align-items: center;
}

.nav-link {
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: var(--va-square-border-radius);
  transition: var(--va-transition);
}

.nav-link:hover {
  color: var(--va-on-background-primary);
  background: var(--va-background-hover);
}

.nav-link--active {
  color: var(--va-primary);
  background: var(--va-primary-alpha);
}

/* 与首页一致的导航按钮样式 */
.nav-btn {
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
  color: var(--va-on-primary);
  padding: 8px 20px;
  border-radius: var(--va-square-border-radius);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: var(--va-swing-transition);
}
[data-theme="dark"] .nav-btn {
  background: var(--va-primary-darken);
}
.nav-btn:hover {
  box-shadow: 0 4px 16px var(--va-primary-alpha);
  color: var(--va-on-primary);
}
.nav-link--dashboard {
  color: var(--va-primary);
  border: 1px solid var(--va-background-border);
}

.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
}

/* ---- 筛选栏 ---- */
.catalog-filter-bar {
  background-color: var(--va-background-primary);
  border-bottom: var(--va-block-border);
}

.filter-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-search {
  width: 240px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.filter-categories {
  display: flex;
  gap: var(--va-gap-small);
  flex-wrap: wrap;
}

.filter-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--va-on-background-secondary);
  background-color: transparent;
  border: 1px solid var(--va-background-border);
  cursor: pointer;
  transition: var(--va-transition);
}

.filter-tag:hover {
  color: var(--va-primary);
  border-color: var(--va-primary);
}

.filter-tag--active {
  color: var(--va-on-primary);
  background-color: var(--va-primary);
  border-color: var(--va-primary);
}

/* 暗色主题下分类按钮激活态使用降饱和度版本 */
[data-theme="dark"] .filter-tag--active {
  background-color: var(--va-primary-darken);
  border-color: var(--va-primary-darken);
}

/* ---- 主内容区 ---- */
.catalog-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* ---- 课程网格 ---- */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ---- 课程卡片 ---- */
.course-card {
  display: flex;
  flex-direction: column;
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
  text-decoration: none;
  transition: var(--va-swing-transition);
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--va-box-shadow);
}

/* 封面 */
.card-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例 */
  overflow: hidden;
  background-color: var(--va-background-element);
}

.card-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-cover-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
}

/* 暗色主题下无封面课程底色使用降饱和度版本 */
[data-theme="dark"] .card-cover-placeholder {
  background: var(--va-primary-darken);
}

.placeholder-icon {
  width: 2.5rem;
  height: 2.5rem;
  opacity: 0.8;
  color: var(--va-on-primary);
}

.brand-icon {
  width: 1.25rem;
  height: 1.25rem;
  vertical-align: middle;
  margin-right: 0.25rem;
  color: var(--va-primary);
}

.card-type-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
}

/* 内容 */
.card-body {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.375rem;
  line-height: 1.4;

  /* 两行截断 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  margin: 0 0 0.75rem;
  line-height: 1.5;

  /* 两行截断 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: 1rem;
  margin-top: auto;
  margin-bottom: 0.75rem;
}

.card-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

/* 价格区 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: var(--va-block-border);
}

.card-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-primary);
}

.card-price--free {
  color: var(--va-success);
}

.card-action {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--va-primary);
  transition: var(--va-transition);
}

.course-card:hover .card-action {
  color: var(--va-primary-darken);
}

/* ---- 分页 ---- */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: var(--va-block-border);
}

.pagination-info {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  color: var(--va-muted);
}

.empty-state__icon {
  width: 3rem;
  height: 3rem;
  opacity: 0.5;
  margin-bottom: 1rem;
  color: var(--va-muted);
}

.empty-state__text {
  font-size: 0.875rem;
}

/* ---- 骨架屏 ---- */
.skeleton-cover {
  width: 100%;
  padding-top: 56.25%;
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-body {
  padding: 1rem;
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
  width: 70%;
  height: 1rem;
}

.skeleton-line--text {
  width: 100%;
}

.skeleton-line--text.short {
  width: 40%;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 页脚 ---- */
.catalog-footer {
  text-align: center;
  padding: 2rem 1.5rem;
  color: var(--va-on-background-element);
  font-size: 0.8125rem;
  border-top: var(--va-block-border);
}

/* ============================================================
 * 移动端响应式适配
 * ============================================================ */
@media (max-width: 767.98px) {
  /* ---- 顶部导航栏紧凑化 ---- */
  .header-inner {
    padding: 0 0.75rem;
    height: 56px;
  }

  .brand {
    font-size: 0.9375rem;
  }

  .header-right {
    gap: 4px;
  }

  .header-nav {
    display: none;
  }

  .nav-link {
    display: none;
    padding: 6px 10px;
    font-size: 0.8125rem;
  }

  .nav-link--dashboard,
  .nav-link:last-child {
    display: inline-flex;
  }

  .nav-btn {
    display: inline-flex !important;
    padding: 6px 14px;
    font-size: 0.8125rem;
  }

  /* ---- 筛选栏紧凑化 ---- */
  .filter-inner {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
    flex-direction: column;
  }

  .filter-search {
    width: 100%;
  }

  .filter-categories {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 0 4px;
    scrollbar-width: none;
  }

  .filter-categories::-webkit-scrollbar {
    display: none;
  }

  .filter-tag {
    font-size: 0.6875rem;
    padding: 0.25rem 0.625rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ---- 课程网格单列 ---- */
  .catalog-main {
    padding: 1rem 0.75rem;
  }

  .course-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .card-body {
    padding: 0.75rem;
  }

  .card-title {
    font-size: 0.9375rem;
  }

  .card-desc {
    font-size: 0.75rem;
  }

  .card-meta {
    gap: 0.75rem;
  }

  .card-meta-item {
    font-size: 0.6875rem;
  }

  /* ---- 分页紧凑化 ---- */
  .pagination {
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
  }

  .pagination-info {
    font-size: 0.75rem;
  }
}
</style>
