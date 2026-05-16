<!--
 * ProducerMyCourses.vue - 制作人端"我的课程"页
 *
 * 功能描述：展示已登录制作人购买的课程列表，包含学习进度追踪和继续学习入口。
 *           卡片式布局 + 进度条，进度数据对接后端 learning_progress API。
 *
 * v4.1 更新：courseProgress 从返回 0 改为调用后端 getCourseProgress API 获取实际进度
 *
 * 设计参考：Vuestic UI 双主题体系
 -->
<template>
  <div class="producer-courses">
    <!-- ========== 页面标题 ========== -->
    <div class="page-header">
      <h2 class="page-title">我的课程</h2>
      <router-link to="/courses" class="btn btn-secondary btn-sm">
        浏览更多课程
      </router-link>
    </div>

    <!-- ========== 加载态 ========== -->
    <template v-if="loading">
      <div class="courses-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card">
          <div class="skeleton-card__cover"></div>
          <div class="skeleton-card__body">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--text"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 空状态 ========== -->
    <template v-else-if="!loading && courses.length === 0">
      <div class="empty-state">
        <span class="empty-state__icon">
          <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </span>
        <p class="empty-state__text">你还没有加入任何课程</p>
        <p class="empty-state__hint">前往课程中心，开启你的制作人学习之旅</p>
        <router-link to="/courses" class="btn btn-primary" style="margin-top: 1rem;">
          浏览课程
        </router-link>
      </div>
    </template>

    <!-- ========== 课程列表 ========== -->
    <template v-else>
      <div class="courses-grid">
        <div
          v-for="course in courses"
          :key="course.id"
          class="course-card"
          @click="goToCourse(course.id)"
        >
          <!-- 封面 -->
          <div class="course-card__cover">
            <img
              v-if="course.cover"
              :src="course.cover"
              :alt="course.title"
            />
            <div v-else class="course-card__cover-placeholder">
              <svg class="placeholder-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
            <div class="course-card__badges">
              <span class="badge" :class="course.courseType === 'series' ? 'badge--info' : 'badge--primary'">
                {{ course.courseType === 'series' ? '系列课' : '单课' }}
              </span>
            </div>
          </div>

          <!-- 内容 -->
          <div class="course-card__body">
            <h3 class="course-card__title">{{ course.title }}</h3>
            <p v-if="course.description" class="course-card__desc">
              {{ course.description }}
            </p>

            <!-- 进度条：对接后端 learning_progress API -->
            <div class="course-progress">
              <div class="course-progress__bar">
                <div
                  class="course-progress__fill"
                  :style="{ width: courseProgress(course) + '%' }"
                ></div>
              </div>
              <span class="course-progress__text">{{ courseProgress(course) }}%</span>
            </div>

            <!-- 底部操作 -->
            <div class="course-card__footer">
              <span class="course-card__stats">
                {{ totalLessonCount(course) }} 课时
              </span>
              <button class="btn btn-primary btn-sm">继续学习</button>
            </div>
          </div>
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
        <span class="pagination-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="currentPage >= totalPages"
          @click="goPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * ProducerMyCourses 制作人"我的课程"组件
 *
 * @description 展示制作人已购买/加入的课程列表，支持分页浏览。
 *              v4.1: 课程进度从后端 learning_progress API 获取实时数据。
 *
 * @import getCourseProgress - 从 learning.ts 导入，获取课程总进度百分比
 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPurchasedCourses, type CourseInfo } from '../../api/course';
import { getCourseProgress } from '../../api/learning';

const router = useRouter();

// ========== 状态 ==========

/** 加载态 */
const loading = ref(true);

/** 课程列表 */
const courses = ref<CourseInfo[]>([]);

/** 当前页码 */
const currentPage = ref(1);

/** 总页数 */
const totalPages = ref(1);

/** 每页条数 */
const pageSize = 8;

/** 课程进度映射表（courseId -> 进度百分比 0~100） */
const courseProgressMap = ref<Map<number, number>>(new Map());

// ========== 方法 ==========

/**
 * 加载我的课程列表
 * 功能描述：从后端获取已登录制作人的课程列表，并并行加载每门课程的进度数据
 */
const loadCourses = async () => {
  loading.value = true;
  try {
    const result = await getPurchasedCourses();
    courses.value = result;
    totalPages.value = 1;
    currentPage.value = 1;

    // 并行加载所有课程的进度数据
    await loadAllProgress(result);
  } catch (err) {
    console.error('加载我的课程失败:', err);
    courses.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 并行加载所有课程的进度数据
 *
 * @param courseList - 课程列表
 * @description 使用 Promise.allSettled 并发请求所有课程的进度，
 *              避免串行请求导致的加载延迟。
 *              某个课程加载失败不影响其他课程的进度展示。
 */
const loadAllProgress = async (courseList: CourseInfo[]) => {
  const map = new Map<number, number>();
  try {
    const results = await Promise.allSettled(
      courseList.map((c) => getCourseProgress(c.id))
    );
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        map.set(courseList[index].id, Math.round(result.value.progress));
      } else {
        map.set(courseList[index].id, 0);
      }
    });
  } catch {
    // 静默失败，不影响课程列表展示
  }
  courseProgressMap.value = map;
};

/**
 * 计算课程总课时数
 * @param course 课程信息
 * @returns 课时总数
 */
const totalLessonCount = (course: CourseInfo): number => {
  if (Array.isArray(course.lessons)) {
    return course.lessons.length;
  }
  if (course.lessons && typeof course.lessons === 'object' && 'length' in course.lessons) {
    return course.lessons.length;
  }
  return 0;
};

/**
 * 计算课程学习进度（百分比）
 *
 * @param course 课程信息
 * @returns 进度百分比（0~100）
 *
 * @description 从后端 learning_progress 表获取实际进度数据。
 *              数据在 loadCourses 时通过 loadAllProgress 并行加载完成。
 *              如果尚未加载完成或加载失败，返回 0。
 */
const courseProgress = (course: CourseInfo): number => {
  return courseProgressMap.value.get(course.id) ?? 0;
};

/**
 * 跳转到课程详情/学习页
 * @param id 课程ID
 */
const goToCourse = (id: number) => {
  router.push(`/producer/courses/${id}`);
};

/**
 * 翻页
 * @param page 目标页码
 */
const goPage = (page: number) => {
  currentPage.value = page;
  loadCourses();
};

// ========== 生命周期 ==========
onMounted(() => {
  loadCourses();
});
</script>

<style scoped>
/* ============================================================
 * ProducerMyCourses 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.producer-courses {
  max-width: 1200px;
  margin: 0 auto;
}

/* ---- 页面标题 ---- */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

/* ---- 课程网格 ---- */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* ---- 课程卡片 ---- */
.course-card {
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--va-transition), transform var(--va-transition);
}

.course-card:hover {
  box-shadow: var(--va-box-shadow);
  transform: translateY(-2px);
}

/* ---- 卡片封面 ---- */
.course-card__cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: var(--va-background-element);
}

.course-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-card__cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
}

.course-card__cover-placeholder span {
  font-size: 2.5rem;
  opacity: 0.5;
}

.course-card__badges {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  gap: var(--va-gap-small);
}

/* ---- 卡片内容 ---- */
.course-card__body {
  padding: 1rem;
}

.course-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.375rem;

  /* 单行截断 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-card__desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  margin: 0 0 0.75rem;
  line-height: 1.4;

  /* 两行截断 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---- 进度条 ---- */
.course-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.course-progress__bar {
  flex: 1;
  height: 6px;
  background-color: var(--va-background-element);
  border-radius: 3px;
  overflow: hidden;
}

.course-progress__fill {
  height: 100%;
  background-color: var(--va-primary);
  border-radius: 3px;
  transition: width var(--va-transition);
  min-width: 0;
}

.course-progress__text {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
  font-weight: 500;
  min-width: 2.5rem;
  text-align: right;
}

/* ---- 卡片底部 ---- */
.course-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-card__stats {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

/* ---- 分页 ---- */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-info {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
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
  margin-bottom: 0.75rem;
}

.empty-state__text {
  font-size: 0.9375rem;
  font-weight: 500;
  margin: 0;
}

.empty-state__hint {
  font-size: 0.8125rem;
  margin: 0.375rem 0 0;
  color: var(--va-on-background-element);
}

/* ---- 骨架屏 ---- */
.skeleton-card {
  background-color: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
}

.skeleton-card__cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-card__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  height: 0.75rem;
  border-radius: var(--va-square-border-radius);
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-line--title {
  width: 60%;
  height: 1rem;
}

.skeleton-line--text {
  width: 100%;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 响应式 ---- */
@media (max-width: 640px) {
  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
