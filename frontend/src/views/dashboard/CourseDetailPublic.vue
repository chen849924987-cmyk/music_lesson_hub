<!--
 * CourseDetailPublic.vue - 公开课程详情页
 *
 * 功能描述：面向所有访客的课程详情展示页，无需登录即可浏览。
 *           展示课程信息、章节/课时列表、试看入口，引导制作人注册/登录后购买学习。
 *
 * 设计参考：Vuestic UI 双主题体系
 -->
<template>
  <div class="course-detail-public">
        <!-- ========== 顶部导航栏（与课程中心/首页样式统一：圆角背景激活风格） ========== -->
    <header class="detail-header">
      <div class="header-inner">
        <!-- 品牌标识 -->
        <router-link to="/home" class="brand">
          <MusicalNoteIcon class="brand-icon" /> SoundCraft
        </router-link>

        <!-- 右侧导航链接与操作 -->
        <div class="header-right">
          <!-- 导航链接（与课程中心样式一致：圆角、hover背景、active背景） -->
          <nav class="header-nav">
            <router-link to="/home" class="nav-link">首页</router-link>
            <router-link to="/courses" class="nav-link nav-link--active">课程中心</router-link>
            <router-link to="/home#about" class="nav-link">关于我们</router-link>
          </nav>

          <!-- 未登录：与课程中心一致的登录/注册按钮 -->
          <template v-if="!authStore.isLoggedIn">
            <router-link to="/auth/login" class="nav-link">登录</router-link>
            <router-link to="/auth/register" class="nav-btn">免费注册</router-link>
          </template>

          <!-- 已登录：与课程中心一致的导航 -->
          <template v-else>
            <router-link :to="dashboardLink" class="nav-link nav-link--dashboard">
              {{ dashboardLabel }}
            </router-link>
            <a class="nav-link" @click="handleLogout">退出</a>
          </template>

          <!-- 主题切换（最右侧，与课程中心一致） -->
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- ========== 加载态 ========== -->
    <template v-if="loading">
      <div class="detail-skeleton">
        <div class="skeleton-hero"></div>
        <div class="detail-skeleton-body">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--text"></div>
          <div class="skeleton-line skeleton-line--text short"></div>
        </div>
      </div>
    </template>

    <!-- ========== 错误态 ========== -->
    <template v-else-if="error">
      <div class="empty-state">
        <span class="empty-state__icon">
          <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
        </span>
        <p class="empty-state__text">{{ error }}</p>
        <router-link to="/courses" class="btn btn-primary" style="margin-top: 1rem;">
          返回课程中心
        </router-link>
      </div>
    </template>

    <!-- ========== 课程内容 ========== -->
    <template v-else-if="course">
      <main class="detail-main">
        <!-- 课程 Hero 区 -->
        <section class="detail-hero">
          <div class="hero-bg">
            <img
              v-if="course.cover"
              :src="course.cover"
              :alt="course.title"
              class="hero-cover"
            />
            <div v-else class="hero-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6;">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div class="hero-overlay"></div>
          </div>
          <div class="hero-content">
            <div class="hero-meta">
              <span class="badge" :class="course.courseType === 'series' ? 'badge--info' : 'badge--primary'">
                {{ course.courseType === 'series' ? '系列课' : '单课' }}
              </span>
              <span v-if="course.category" class="badge badge--orange">
                {{ course.category.name }}
              </span>
            </div>
            <h1 class="hero-title">{{ course.title }}</h1>
            <p class="hero-desc">{{ course.description || '暂无简介' }}</p>
            <div class="hero-stats">
              <span class="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ totalLessonCount }} 课时
              </span>
              <span class="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {{ course.studentCount }} 位制作人
              </span>
              <span class="stat-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {{ course.rating || '暂无' }}
                <template v-if="course.reviewCount">（{{ course.reviewCount }} 评价）</template>
              </span>
            </div>
            <div class="hero-actions">
              <span class="hero-price" :class="{ 'hero-price--free': course.price === 0 }">
                {{ course.price === 0 ? '免费' : `¥${course.price}` }}
              </span>
              <template v-if="course.price === 0">
                <button class="btn btn-primary btn-lg" @click="goLearn">
                  开始学习
                </button>
              </template>
              <template v-else>
                <button class="btn btn-secondary btn-lg" @click="handleAddToCart">
                  加入购物车
                </button>
                <button class="btn btn-primary btn-lg" @click="handleBuyNow">
                  立即购买
                </button>
              </template>
              <button
                v-if="course.trailerVideoId"
                class="btn btn-secondary btn-lg"
                @click="playTrailer"
              >
                试看
              </button>
            </div>
          </div>
        </section>

        <!-- 课程内容区 -->
        <section class="detail-body">
          <div class="detail-content">
            <!-- 标签 -->
            <div v-if="course.tags" class="detail-tags">
              <span
                v-for="tag in tagList"
                :key="tag"
                class="detail-tag"
              >{{ tag }}</span>
            </div>

            <!-- 章节+课时列表（系列课和单课共用此模板） -->
            <div
              v-for="chapter in displayChapters"
              :key="chapter.id"
              class="detail-chapter"
            >
              <h3 class="chapter-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chapter-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                {{ chapter.title }}
              </h3>
              <p v-if="chapter.description" class="chapter-desc">{{ chapter.description }}</p>
              <ul class="lesson-list">
                <li
                  v-for="lesson in chapter.lessons"
                  :key="lesson.id"
                  class="lesson-item"
                  @click="handleLessonClick(lesson)"
                >
                  <div class="lesson-info">
                    <span class="lesson-icon">
                      <template v-if="lesson.isFree">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                      </template>
                      <template v-else>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </template>
                    </span>
                    <span class="lesson-title">{{ lesson.title }}</span>
                  </div>
                  <div class="lesson-actions">
                    <span v-if="lesson.isFree" class="lesson-free-badge badge badge--success">免费试看</span>
                    <span
                      v-else-if="lesson.canSinglePurchase && lesson.singlePrice"
                      class="lesson-single-price"
                      @click.stop="handleSinglePurchase(lesson)"
                    >
                      ¥{{ (lesson.singlePrice / 100).toFixed(2) }}
                      <span class="lesson-single-label">单独购买</span>
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- 无章节/课时内容 -->
            <div v-if="displayChapters.length === 0" class="empty-state" style="padding: 3rem 0;">
              <span class="empty-state__icon">
                <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </span>
              <p class="empty-state__text">课程内容正在制作中，敬请期待</p>
            </div>
          </div>

          <!-- 侧边栏 -->
          <aside class="detail-sidebar">
            <div class="sidebar-card">
              <h4 class="sidebar-title">课程信息</h4>
              <div class="sidebar-item">
                <span class="sidebar-label">课程类型</span>
                <span class="sidebar-value">{{ course.courseType === 'series' ? '系列课程' : '单课程' }}</span>
              </div>
              <div class="sidebar-item">
                <span class="sidebar-label">课时数</span>
                <span class="sidebar-value">{{ totalLessonCount }} 课时</span>
              </div>
              <div class="sidebar-item">
                <span class="sidebar-label">制作人</span>
                <span class="sidebar-value">{{ course.studentCount }} 位</span>
              </div>
            </div>

            <div v-if="course.price > 0" class="sidebar-card">
              <h4 class="sidebar-title">购买信息</h4>
              <div class="sidebar-item">
                <span class="sidebar-label">价格</span>
                <span class="sidebar-value sidebar-value--price">¥{{ course.price }}</span>
              </div>
              <div v-if="course.originalPrice && course.originalPrice > course.price" class="sidebar-item">
                <span class="sidebar-label">原价</span>
                <span class="sidebar-value sidebar-value--original">¥{{ course.originalPrice }}</span>
              </div>
              <button class="btn btn-primary btn-block" style="margin-top: 1rem;" @click="handleBuyNow">
                立即购买
              </button>
            </div>
          </aside>
        </section>
      </main>
    </template>

    <!-- ========== 页脚 ========== -->
    <footer class="detail-footer">
      <p>&copy; {{ new Date().getFullYear() }} SoundCraft. All rights reserved.</p>
    </footer>

    <!-- 回到顶部按钮 -->
    <BackToTop />

    <!-- ========== 试看弹窗（简版） ========== -->
    <Teleport to="body">
      <div v-if="showTrailer" class="trailer-overlay" @click.self="showTrailer = false">
        <div class="trailer-modal">
          <button class="trailer-close" @click="showTrailer = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="trailer-placeholder">
            <p>试看功能将在接入视频播放器后启用</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * CourseDetailPublic 课程详情公开页组件
 *
 * @description 展示课程详细信息，包括章节/课时列表，支持试看入口。
 *              已集成「加入购物车」和「立即购买」按钮，对接购物车与订单系统。
 *              未登录用户可浏览，购买/学习操作引导登录或注册。
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BackToTop from '../../components/BackToTop.vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../../stores/auth';
import ThemeToggle from '../../components/ThemeToggle.vue';
import { MusicalNoteIcon } from '@heroicons/vue/24/outline';
import { addToCart } from '../../api/cart';
import { createOrder } from '../../api/order';
import {
  getCourseDetail,
  getChapters,
  getCourseLessons,
  type CourseInfo,
  type ChapterInfo,
  type LessonInfo,
} from '../../api/course';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ========== 状态 ==========

/** 加载态 */
const loading = ref(true);

/** 错误信息 */
const error = ref('');

/** 课程信息 */
const course = ref<CourseInfo | null>(null);

/** 章节列表（系列课） */
const chapters = ref<ChapterInfo[]>([]);

/** 课时列表（单课） */
const lessons = ref<LessonInfo[]>([]);

/** 是否显示试看弹窗 */
const showTrailer = ref(false);

// ========== 计算属性 ==========

/** 标签列表 */
const tagList = computed(() => {
  if (!course.value?.tags) return [];
  return course.value.tags.split(',').map(t => t.trim()).filter(Boolean);
});

/** 总课时数 */
const totalLessonCount = computed(() => {
  if (course.value?.courseType === 'series' && chapters.value.length > 0) {
    return chapters.value.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
  }
  return lessons.value.length;
});

/**
 * 展示用的章节列表
 * 功能描述：统一单课和系列课的展示样式。
 *          - 系列课：直接使用后端返回的 chapters 数据
 *          - 单课：构造一个包含所有课时的伪章节，让单课也以系列课同样的章节+课时列表样式展示
 */
const displayChapters = computed(() => {
  if (course.value?.courseType === 'series') {
    return chapters.value;
  }
  // 单课：构造一个章节包裹所有课时
  if (lessons.value.length > 0) {
    return [
      {
        id: 0,
        courseId: course.value?.id || 0,
        title: course.value?.title || '课程内容',
        description: '',
        sortOrder: 0,
        lessons: lessons.value,
        createdAt: '',
        updatedAt: '',
      },
    ];
  }
  return [];
});

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

// ========== 方法 ==========

/**
 * 加载课程详情
 */
const loadCourse = async () => {
  loading.value = true;
  error.value = '';
  try {
    const id = Number(route.params.id);
    if (!id || isNaN(id)) {
      error.value = '无效的课程ID';
      return;
    }

    course.value = await getCourseDetail(id);

    // 根据课程类型加载章节或课时
    if (course.value.courseType === 'series') {
      chapters.value = await getChapters(id);
    } else {
      lessons.value = await getCourseLessons(id);
    }
  } catch (err: any) {
    console.error('加载课程详情失败:', err);
    error.value = err?.response?.data?.message || '课程不存在或已下架';
  } finally {
    loading.value = false;
  }
};

/**
 * 跳转登录页
 */
const goLogin = () => {
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
};

/**
 * 开始学习（免费课程）
 * 功能描述：免费课程直接引导到学习页面（需登录）
 */
const goLearn = () => {
  if (!authStore.isLoggedIn) {
    goLogin();
    return;
  }
  // TODO: 跳转到制作人端课程学习页
  router.push(`/producer/courses/${course.value?.id}`);
};

/**
 * 加入购物车
 * 功能描述：将当前课程添加到购物车，需登录。添加成功后给出提示。
 */
const handleAddToCart = async () => {
  if (!authStore.isLoggedIn) {
    goLogin();
    return;
  }
  if (!course.value) return;
  try {
    await addToCart(course.value.id);
    ElMessage.success('已加入购物车');
  } catch (error: any) {
    // 错误已在响应拦截器中处理（如重复添加等）
  }
};

/**
 * 立即购买
 * 功能描述：将课程加入购物车后直接跳转到下单确认页（Checkout）
 */
const handleBuyNow = async () => {
  if (!authStore.isLoggedIn) {
    goLogin();
    return;
  }
  if (!course.value) return;
  try {
    await addToCart(course.value.id);
    // 加入购物车成功后，跳转到下单确认页
    router.push(`/checkout?courseIds=${course.value.id}`);
  } catch (error: any) {
    // 如果已存在购物车中（409），仍然允许跳转
    if (error?.response?.status === 409) {
      router.push(`/checkout?courseIds=${course.value.id}`);
    }
  }
};

/**
 * 处理课时点击事件
 *
 * @description 点击课时项时，根据用户登录状态跳转到播放页或登录页
 *              为保证用户体验，无论免费/付费课时都允许点击跳转至播放页，
 *              由播放页内部的权限检查逻辑控制实际播放权限
 *
 * 跳转逻辑：
 * - 已登录用户 -> 跳转到课程播放页，并携带 lessonId 参数自动播放对应课时
 * - 未登录用户 -> 跳转到登录页，登录后重定向回当前课程详情页
 */
const handleLessonClick = (lesson: LessonInfo) => {
  if (!authStore.isLoggedIn) {
    // 未登录，跳转登录页，登录后回到当前课程详情页
    router.push({ name: 'Login', query: { redirect: route.fullPath } });
    return;
  }
  // 已登录，跳转到播放页并带上课时ID，让播放页自动播放对应的课时
  router.push({
    path: `/producer/courses/${course.value?.id}`,
    query: { lessonId: String(lesson.id) },
  });
};

/**
 * 单独购买课时
 * 功能描述：为系列课中的单课时创建订单，跳转到下单确认页
 *          - 已登录用户：直接创建课时订单跳转
 *          - 未登录用户：跳转到登录页
 * @param lesson 课时信息
 */
const handleSinglePurchase = async (lesson: LessonInfo) => {
  if (!authStore.isLoggedIn) {
    goLogin();
    return;
  }
  if (!course.value) return;
  try {
    // 直接跳转到下单确认页，携带 lessonIds 和 courseId 信息
    router.push(`/checkout?lessonIds=${lesson.id}&courseId=${course.value.id}`);
  } catch (error: any) {
    console.error('跳转下单失败:', error);
  }
};

/**
 * 播放试看
 */
const playTrailer = () => {
  showTrailer.value = true;
};
// ========== 生命周期 ==========
onMounted(() => {
  loadCourse();
});
</script>

<style scoped>
/* ============================================================
 * CourseDetailPublic 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.course-detail-public {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--va-background-secondary);
}

/* ---- 顶部导航栏（与课程中心样式统一：圆角背景激活风格） ---- */
.detail-header {
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

.brand-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--va-primary);
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
  cursor: pointer;
}

.nav-link:hover {
  color: var(--va-on-background-primary);
  background: var(--va-background-hover);
}

.nav-link--active {
  color: var(--va-primary);
  background: var(--va-primary-alpha);
}

/* 与课程中心一致的导航按钮样式 */
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

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.btn-block {
  width: 100%;
}

/* ---- Hero 区 ---- */
.detail-hero {
  position: relative;
  overflow: hidden;
}

/*
 * Hero 区域按钮适配（亮色主题下的深色背景）
 * Hero 底部有渐变的深色 overlay，导致亮色主题下普通 btn-secondary
 * 的深色文字和灰色边框完全看不清。覆写使其使用白色文字+浅色边框。
 *
 * 暗色主题下 Hero 背景也是暗色，同样需要保持按钮在深色背景上清晰。
 */
.detail-hero .btn-secondary {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.5);
}

.detail-hero .btn-secondary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fff;
}

.detail-hero .btn-primary {
  color: #fff;
}

.hero-bg {
  position: relative;
  width: 100%;
  min-height: 360px;
}

.hero-cover {
  width: 100%;
  min-height: 360px;
  object-fit: cover;
}

.hero-placeholder {
  width: 100%;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
}

.hero-placeholder span {
  font-size: 4rem;
  opacity: 0.6;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
  pointer-events: none;
}

.hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  color: #fff;
}

.hero-meta {
  display: flex;
  gap: var(--va-gap-small);
  margin-bottom: 0.75rem;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  line-height: 1.3;
}

.hero-desc {
  font-size: 0.9375rem;
  opacity: 0.85;
  line-height: 1.6;
  margin: 0 0 1rem;
  max-width: 700px;

  /* 两行截断 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-price {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--va-primary);
}

.hero-price--free {
  color: var(--va-success);
}

/* ---- 内容主体 ---- */
.detail-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.detail-body {
  display: flex;
  gap: 2rem;
  padding: 2rem 0;
}

.detail-content {
  flex: 1;
  min-width: 0;
}

/* ---- 标签 ---- */
.detail-tags {
  display: flex;
  gap: var(--va-gap-small);
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.detail-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--va-primary);
  background-color: var(--va-primary-alpha);
}

/* ---- 章节 ---- */
.detail-chapter {
  margin-bottom: 1.5rem;
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
}

.chapter-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  background-color: var(--va-background-secondary);
  border-bottom: var(--va-block-border);
}

.chapter-icon {
  color: var(--va-primary);
  flex-shrink: 0;
}

.chapter-desc {
  padding: 0.5rem 1.25rem;
  margin: 0;
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
}

.lesson-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lesson-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: var(--va-block-border);
  transition: background-color var(--va-transition);
}

.lesson-item:last-child {
  border-bottom: none;
}

.lesson-item:hover {
  background-color: var(--va-background-hover);
}

.lesson-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.lesson-icon {
  display: flex;
  align-items: center;
  color: var(--va-on-background-element);
  flex-shrink: 0;
}

.lesson-title {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
}

.lesson-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.lesson-free-badge {
  flex-shrink: 0;
}

.lesson-single-price {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-primary);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--va-square-border-radius);
  border: 1px solid var(--va-primary);
  transition: var(--va-transition);
}

.lesson-single-price:hover {
  background-color: var(--va-primary-alpha);
}

.lesson-single-label {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--va-primary);
}

/* ---- 侧边栏 ---- */
.detail-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.sidebar-card {
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.sidebar-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: var(--va-block-border);
}

.sidebar-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.8125rem;
}

.sidebar-label {
  color: var(--va-on-background-element);
}

.sidebar-value {
  color: var(--va-on-background-primary);
  font-weight: 500;
}

.sidebar-value--price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--va-primary);
}

.sidebar-value--original {
  text-decoration: line-through;
  color: var(--va-on-background-element);
}

/* ---- 页脚 ---- */
.detail-footer {
  text-align: center;
  padding: 2rem 1.5rem;
  color: var(--va-on-background-element);
  font-size: 0.8125rem;
  border-top: var(--va-block-border);
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
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-state__text {
  font-size: 0.875rem;
}

/* ---- 骨架屏 ---- */
.detail-skeleton {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.skeleton-hero {
  width: 100%;
  height: 360px;
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--va-block-border-radius);
}

.detail-skeleton-body {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-line {
  height: 0.875rem;
  border-radius: var(--va-square-border-radius);
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-line--title {
  width: 40%;
  height: 1.5rem;
}

.skeleton-line--text {
  width: 100%;
}

.skeleton-line--text.short {
  width: 60%;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 试看弹窗 ---- */
.trailer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.trailer-modal {
  position: relative;
  width: 80%;
  max-width: 800px;
  aspect-ratio: 16 / 9;
  background: var(--va-background-primary);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
}

.trailer-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0,0,0,0.5);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.trailer-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--va-on-background-element);
  font-size: 0.875rem;
  padding: 0 3rem; /* 预留关闭按钮空间，防止文字与关闭按钮重叠 */
  box-sizing: border-box;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .detail-body {
    flex-direction: column;
  }

  .detail-sidebar {
    width: 100%;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-cover,
  .hero-placeholder {
    min-height: 240px;
  }
}
</style>
