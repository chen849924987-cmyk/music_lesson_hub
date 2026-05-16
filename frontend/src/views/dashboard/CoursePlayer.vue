<!--
 * CoursePlayer.vue - 课程播放页面
 *
 * 功能描述：课程视频播放页，重构后集成 VideoPlayer.vue 专用播放器组件，
 *           支持播放速度调节、画中画、全屏、断点续播和学习进度自动同步。
 *
 * v4.1 新增功能：
 * - 使用 VideoPlayer.vue 组件替代原生 <video> 标签
 * - 学习进度自动记录（每 30 秒 + 暂停时同步到后端）
 * - 断点续播（进入课时时从上次播放位置恢复）
 * - 课件下载（已购用户可下载附件）
 * - 侧边栏课时完成状态标记
 *
 * 权限逻辑说明：
 * - 所有课时均可点击播放，实际权限由后端 checkLessonAccess 接口控制
 * - 已购用户 → 完整播放所有课时
 * - 未购用户 → 免费课时完整播放，非免费课时限时试看（到达试看时长后暂停）
 *
 * @设计参考：Vuestic UI 双主题体系
 -->
<template>
  <div class="course-player">
    <!-- ========== 顶部导航 ========== -->
    <header class="player-header">
      <div class="player-header__left">
        <button class="btn btn-text player-back" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          返回课程详情
        </button>
        <h1 class="player-title">{{ course?.title || '加载中...' }}</h1>
      </div>
      <div class="player-header__right">
        <button class="btn btn-text player-my-courses-btn" @click="goToMyCourses">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          我的课程
        </button>
        <span v-if="isPurchased" class="badge badge--success">已购买</span>
        <span v-else class="badge badge--warning">试看模式</span>
      </div>
    </header>

    <div class="player-body">
      <!-- ========== 视频播放区 ========== -->
      <div class="player-main">
        <div class="player-container">
          <!-- 使用 VideoPlayer 组件替代原生 <video> -->
          <VideoPlayer
            v-if="currentVideoUrl"
            :src="currentVideoUrl"
            :autoResume="resumePosition"
            :isTrial="accessType === 'trial'"
            :trialDuration="trialDuration"
            :autoPlay="true"
            @progress="onProgressUpdate"
            @pause="onPlayerPause"
            @ended="onPlayerEnded"
            @trial-end="onTrialEnd"
            @ready="onPlayerReady"
          />
          <div v-else class="player-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <p>请选择一个课时开始播放</p>
          </div>
        </div>

        <!-- 课时信息 + 课件下载 -->
        <div v-if="currentLesson" class="lesson-info-bar">
          <div class="lesson-info-bar__main">
            <div class="lesson-info-bar__text">
              <h2 class="lesson-info-bar__title">{{ currentLesson.title }}</h2>
              <p v-if="currentLesson.description" class="lesson-info-bar__desc">{{ currentLesson.description }}</p>
            </div>
            <!-- 课件下载按钮（已购用户） -->
            <button
              v-if="isPurchased && hasAttachments"
              class="btn btn-text lesson-download-btn"
              @click="showAttachmentPanel = !showAttachmentPanel"
              :title="showAttachmentPanel ? '收起资料' : '查看资料'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              课件下载
              <span v-if="attachmentCount > 0" class="badge badge--info">{{ attachmentCount }}</span>
            </button>
          </div>
          <!-- 附件列表（展开/收起） -->
          <div v-if="showAttachmentPanel && attachments.length > 0" class="attachment-list">
            <div
              v-for="att in attachments"
              :key="att.id"
              class="attachment-item"
              @click="downloadAttachment(att)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span class="attachment-item__name">{{ att.originalName }}</span>
              <span class="attachment-item__size">{{ formatFileSize(att.fileSize) }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="attachment-item__icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
          </div>
          <div v-else-if="showAttachmentPanel && attachments.length === 0" class="attachment-list attachment-list--empty">
            暂无课件资料
          </div>
        </div>

        <!-- 未购买的购买提示 -->
        <div v-if="!isPurchased && !isFreeLesson" class="purchase-banner">
          <div class="purchase-banner__content">
            <span class="purchase-banner__text">
              当前为试看模式，完整课程需购买后观看
            </span>
            <div class="purchase-banner__actions">
              <span v-if="course" class="purchase-banner__price">¥{{ course.price }}</span>
              <button class="btn btn-primary" @click="goPurchase">立即购买</button>
            </div>
          </div>
        </div>

        <!-- 学习进度提示 -->
        <div v-if="isLoggedIn && totalLessons > 0" class="progress-summary">
          <div class="progress-summary__bar">
            <div
              class="progress-summary__fill"
              :style="{ width: courseProgressPercent + '%' }"
            ></div>
          </div>
          <span class="progress-summary__text">
            课程进度：{{ courseCompletedLessons }} / {{ totalLessons }} 课时（{{ Math.round(courseProgressPercent) }}%）
          </span>
        </div>
      </div>

      <!-- ========== 课时列表侧边栏 ========== -->
      <aside class="player-sidebar" ref="sidebarRef">
        <div class="sidebar-inner">
          <div class="sidebar-section">
            <h3 class="sidebar-section__title">课程内容</h3>
            <div class="sidebar-lesson-count">
              共 {{ totalLessons }} 课时
            </div>
          </div>

          <!-- 系列课：章节+课时树形列表 -->
          <template v-if="course?.courseType === 'series'">
            <div
              v-for="chapter in chapters"
              :key="chapter.id"
              class="sidebar-chapter"
            >
              <div class="sidebar-chapter__title">
                {{ chapter.title }}
              </div>
              <div
                v-for="lesson in chapter.lessons"
                :key="lesson.id"
                class="sidebar-lesson"
                :class="{
                  'sidebar-lesson--active': currentLesson?.id === lesson.id,
                  'sidebar-lesson--free': lesson.isFree,
                  'sidebar-lesson--locked': !lesson.isFree && !isPurchased,
                  'sidebar-lesson--completed': getLessonCompleted(lesson.id),
                }"
                @click="playLesson(lesson)"
              >
                <div class="sidebar-lesson__icon">
                  <!-- 已完成 -->
                  <svg v-if="getLessonCompleted(lesson.id)" width="16" height="16" viewBox="0 0 24 24" fill="var(--va-success)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  <!-- 当前播放 -->
                  <svg v-else-if="currentLesson?.id === lesson.id" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <!-- 免费图标 -->
                  <svg v-else-if="lesson.isFree" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  <!-- 锁定图标 -->
                  <svg v-else-if="!isPurchased" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--va-on-background-element)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <!-- 可用课时 -->
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <span class="sidebar-lesson__title">{{ lesson.title }}</span>
                <span v-if="lesson.isFree" class="badge badge--success sidebar-lesson__badge">试看</span>
                <span v-if="getLessonCompleted(lesson.id)" class="badge badge--success sidebar-lesson__badge">已完成</span>
              </div>
            </div>
          </template>

          <!-- 单课：平铺课时列表 -->
          <template v-else>
            <div
              v-for="lesson in lessons"
              :key="lesson.id"
              class="sidebar-lesson"
              :class="{
                'sidebar-lesson--active': currentLesson?.id === lesson.id,
                'sidebar-lesson--free': lesson.isFree,
                'sidebar-lesson--locked': !lesson.isFree && !isPurchased,
                'sidebar-lesson--completed': getLessonCompleted(lesson.id),
              }"
              @click="playLesson(lesson)"
            >
              <div class="sidebar-lesson__icon">
                <svg v-if="getLessonCompleted(lesson.id)" width="16" height="16" viewBox="0 0 24 24" fill="var(--va-success)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <svg v-else-if="currentLesson?.id === lesson.id" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <svg v-else-if="lesson.isFree" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                <svg v-else-if="!isPurchased" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--va-on-background-element)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <span class="sidebar-lesson__title">{{ lesson.title }}</span>
              <span v-if="lesson.isFree" class="badge badge--success sidebar-lesson__badge">试看</span>
              <span v-if="getLessonCompleted(lesson.id)" class="badge badge--success sidebar-lesson__badge">已完成</span>
            </div>
          </template>

          <!-- 无内容 -->
          <div v-if="totalLessons === 0" class="empty-state" style="padding: 2rem 1rem;">
            <span class="empty-state__icon">
              <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
            <p class="empty-state__text">暂无课时内容</p>
          </div>
        </div>
      </aside>
    </div>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
/**
 * CoursePlayer 课程播放组件（v4.1 重构版）
 *
 * @description 课程视频播放页的核心组件，集成 VideoPlayer 播放器和学习进度同步。
 *              支持完整播放和试看两种模式，自动记录学习进度并支持断点续播。
 *
 * v4.1 新增：
 * - VideoPlayer 组件（速度/画中画/全屏/键盘快捷键）
 * - 学习进度自动同步（每 30 秒 + 暂停时 → 后端）
 * - 断点续播（进入课时自动跳转到上次位置）
 * - 课件下载（已购用户可下载附件）
 * - 侧边栏课时完成状态标记
 *
 * @param route.params.id - 课程ID（路由参数）
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BackToTop from '../../components/BackToTop.vue';
import VideoPlayer from '../../components/VideoPlayer.vue';
import { useAuthStore } from '../../stores/auth';
import {
  getCourseDetail,
  getChapters,
  getCourseLessons,
  checkCoursePurchased,
  checkLessonAccess,
  getVideoPlayUrl,
  type CourseInfo,
  type ChapterInfo,
  type LessonInfo,
} from '../../api/course';
import {
  updateProgress,
  getLessonProgress,
  getCourseLessonProgresses,
  type LessonProgressBrief,
} from '../../api/learning';
import {
  getAttachmentDownloadUrl,
  getCourseAttachments,
  type AttachmentInfo,
} from '../../api/attachment';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ========== DOM 引用 ==========

const sidebarRef = ref<HTMLElement | null>(null);

// ========== 状态 ==========

/** 课程信息 */
const course = ref<CourseInfo | null>(null);

/** 章节列表（系列课） */
const chapters = ref<ChapterInfo[]>([]);

/** 课时列表（单课） */
const lessons = ref<LessonInfo[]>([]);

/** 当前播放的课时 */
const currentLesson = ref<LessonInfo | null>(null);

/** 当前视频播放地址 */
const currentVideoUrl = ref('');

/** 是否已购买课程 */
const isPurchased = ref(false);

/** 当前课时的访问权限类型 */
const accessType = ref<'full' | 'trial' | 'none'>('none');

/** 试看总时长（秒） */
const trialDuration = ref(0);

/** 是否免费课时 */
const isFreeLesson = ref(false);

/** 用户是否已登录 */
const isLoggedIn = computed(() => authStore.isLoggedIn);

/** 自动续播位置（秒） */
const resumePosition = ref(0);

/** 课程进度列表（lessonId -> 进度信息映射） */
const lessonProgressMap = ref<Map<number, LessonProgressBrief>>(new Map());

// ========== 附件相关 ==========

/** 附件列表 */
const attachments = ref<AttachmentInfo[]>([]);
/** 是否展开附件面板 */
const showAttachmentPanel = ref(false);
/** 是否有附件 */
const hasAttachments = computed(() => attachments.value.length > 0);
/** 附件数量 */
const attachmentCount = computed(() => attachments.value.length);

// ========== 计算属性 ==========

/** 总课时数 */
const totalLessons = computed(() => {
  if (course.value?.courseType === 'series') {
    return chapters.value.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
  }
  return lessons.value.length;
});

/** 课程中已完成的课时数 */
const courseCompletedLessons = computed(() => {
  let count = 0;
  lessonProgressMap.value.forEach((p) => {
    if (p.completed) count++;
  });
  return count;
});

/** 课程总进度百分比 */
const courseProgressPercent = computed(() => {
  if (totalLessons.value <= 0) return 0;
  return (courseCompletedLessons.value / totalLessons.value) * 100;
});

// ========== 方法 ==========

/**
 * 获取指定课时是否已完成
 * @param lessonId 课时ID
 * @returns 是否已完成
 */
const getLessonCompleted = (lessonId: number): boolean => {
  const progress = lessonProgressMap.value.get(lessonId);
  return progress?.completed ?? false;
};

/**
 * 初始化加载课程数据
 */
const loadCourse = async () => {
  try {
    const id = Number(route.params.id);
    if (!id || isNaN(id)) return;

    course.value = await getCourseDetail(id);

    if (course.value.courseType === 'series') {
      chapters.value = await getChapters(id);
    } else {
      lessons.value = await getCourseLessons(id);
    }

    // 如果已登录，检查购买状态并加载学习进度
    if (authStore.isLoggedIn) {
      try {
        const purchaseResult = await checkCoursePurchased(id);
        isPurchased.value = purchaseResult.purchased;
      } catch {
        isPurchased.value = false;
      }

      // 加载课程所有课时的进度信息（用于侧边栏完成状态标记）
      loadLessonProgresses(id);

      // 如果是已购用户，加载课程附件
      if (isPurchased.value) {
        loadAttachments(id);
      }
    }

    // 自动播放指定课时或第一个课时
    const targetLessonId = route.query.lessonId ? Number(route.query.lessonId) : null;
    let targetLesson: LessonInfo | null = null;

    if (targetLessonId) {
      if (course.value.courseType === 'series') {
        for (const ch of chapters.value) {
          const found = ch.lessons?.find(l => l.id === targetLessonId);
          if (found) { targetLesson = found; break; }
        }
      } else {
        targetLesson = lessons.value.find(l => l.id === targetLessonId) || null;
      }
    }

    if (!targetLesson) {
      targetLesson = getFirstLesson();
    }

    if (targetLesson) {
      await playLesson(targetLesson);
    }
  } catch (err) {
    console.error('加载课程失败:', err);
  }
};

/**
 * 加载课程所有课时的进度
 */
const loadLessonProgresses = async (courseId: number) => {
  try {
    const progresses = await getCourseLessonProgresses(courseId);
    const map = new Map<number, LessonProgressBrief>();
    progresses.forEach((p) => map.set(p.lessonId, p));
    lessonProgressMap.value = map;
  } catch {
    // 静默失败，不影响播放体验
  }
};

/**
 * 加载课程附件列表
 */
const loadAttachments = async (courseId: number) => {
  try {
    attachments.value = await getCourseAttachments(courseId);
  } catch {
    // 静默失败
  }
};

/**
 * 获取第一个课时
 */
const getFirstLesson = (): LessonInfo | null => {
  if (course.value?.courseType === 'series') {
    for (const ch of chapters.value) {
      if (ch.lessons && ch.lessons.length > 0) return ch.lessons[0];
    }
    return null;
  }
  return lessons.value.length > 0 ? lessons.value[0] : null;
};

/**
 * 同步当前课时学习进度到后端
 */
const syncProgress = async () => {
  if (!currentLesson.value || !course.value || !authStore.isLoggedIn) return;
  try {
    await updateProgress({
      lessonId: currentLesson.value.id,
      courseId: course.value.id,
      lastPosition: 0, // VideoPlayer 通过 progress 事件传递
      duration: currentLesson.value.duration || 0,
    });
  } catch {
    // 静默失败
  }
};

/**
 * 播放指定课时（支持断点续播）
 */
const playLesson = async (lesson: LessonInfo) => {
  currentLesson.value = lesson;
  isFreeLesson.value = lesson.isFree;
  resumePosition.value = 0;

  // 清除旧视频地址
  currentVideoUrl.value = '';
  showAttachmentPanel.value = false;

  try {
    // 检查播放权限
    const access = await checkLessonAccess(
      Number(route.params.id),
      lesson.id,
    );
    accessType.value = access.accessType;

    // 如果是已登录用户，获取断点续播位置
    if (authStore.isLoggedIn) {
      try {
        const progress = await getLessonProgress(lesson.id);
        if (progress && progress.lastPosition > 0) {
          resumePosition.value = progress.lastPosition;
        }
      } catch {
        // 没有进度记录，从头开始播放
      }
    }

    // 获取视频播放地址
    if (lesson.videoId) {
      const playUrlResult = await getVideoPlayUrl(lesson.videoId);
      currentVideoUrl.value = playUrlResult.url;
    }

    // 如果是试看模式，初始化试看时长
    if (access.accessType === 'trial') {
      trialDuration.value = access.previewDuration > 0 ? access.previewDuration : 300;
    }
  } catch (err) {
    console.error('获取播放地址失败:', err);
  }
};

// ========== VideoPlayer 事件回调 ==========

/** 播放器就绪 */
const onPlayerReady = () => {
  // 播放器已就绪，无需额外操作
};

/** 播放进度更新（每 30 秒） */
let pendingProgress: { currentTime: number; duration: number; progress: number } | null = null;
const onProgressUpdate = (payload: { currentTime: number; duration: number; progress: number }) => {
  if (!currentLesson.value || !course.value || !authStore.isLoggedIn) return;
  pendingProgress = payload;

  // 异步同步到后端（不阻塞 UI）
  updateProgress({
    lessonId: currentLesson.value.id,
    courseId: course.value.id,
    lastPosition: payload.currentTime,
    duration: payload.duration,
    progress: Math.round(payload.progress * 10) / 10,
  }).catch(() => {});
};

/** 视频暂停时同步进度 */
const onPlayerPause = (payload: { currentTime: number; progress: number }) => {
  if (!currentLesson.value || !course.value || !authStore.isLoggedIn) return;

  updateProgress({
    lessonId: currentLesson.value.id,
    courseId: course.value.id,
    lastPosition: payload.currentTime,
    duration: currentLesson.value.duration || 0,
    progress: Math.round(payload.progress * 10) / 10,
  }).catch(() => {});

  // 更新本地侧边栏进度状态
  const progress = Math.round(payload.progress * 10) / 10;
  const completed = progress >= 95;
  lessonProgressMap.value.set(currentLesson.value.id, {
    lessonId: currentLesson.value.id,
    progress,
    lastPosition: payload.currentTime,
    completed,
  });
};

/** 视频播放结束 */
const onPlayerEnded = () => {
  // 标记为已完成
  if (currentLesson.value) {
    lessonProgressMap.value.set(currentLesson.value.id, {
      lessonId: currentLesson.value.id,
      progress: 100,
      lastPosition: 0,
      completed: true,
    });
  }
};

/** 试看时间耗尽 */
const onTrialEnd = () => {
  // 暂时不做额外操作，VideoPlayer 会自动暂停
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * 下载附件
 */
const downloadAttachment = async (att: AttachmentInfo) => {
  try {
    const result = await getAttachmentDownloadUrl(att.id);
    // 在新窗口/标签页打开下载 URL
    window.open(result.url, '_blank');
  } catch (err) {
    console.error('获取下载地址失败:', err);
  }
};

/** 返回课程详情页 */
const goBack = () => {
  const id = Number(route.params.id);
  if (id && !isNaN(id)) {
    router.push({ name: 'CourseDetail', params: { id } });
  } else {
    router.back();
  }
};

/** 跳转到"我的课程"页面 */
const goToMyCourses = () => {
  router.push({ name: 'ProducerMyCourses' });
};

/** 前往购买页面 */
const goPurchase = () => {
  if (!authStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } });
    return;
  }
  router.push(`/courses/${route.params.id}`);
};

// ========== 生命周期 ==========
onMounted(() => {
  loadCourse();
});

// 页面离开前同步一次进度
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  if (pendingProgress && currentLesson.value && course.value && authStore.isLoggedIn) {
    updateProgress({
      lessonId: currentLesson.value.id,
      courseId: course.value.id,
      lastPosition: pendingProgress.currentTime,
      duration: pendingProgress.duration,
      progress: Math.round(pendingProgress.progress * 10) / 10,
    }).catch(() => {});
  }
});
</script>

<style scoped>
/* ============================================================
 * CoursePlayer 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.course-player {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--va-background-secondary);
  overflow: hidden;
}

/* ---- 顶部导航 ---- */
.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 52px;
  background-color: var(--va-background-primary);
  border-bottom: var(--va-block-border);
  flex-shrink: 0;
  z-index: 10;
}

.player-header__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.player-back {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--va-on-background-secondary);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.player-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-header__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.player-my-courses-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--va-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  padding: 0.375rem 0.625rem;
  border-radius: var(--va-square-border-radius);
  transition: background-color var(--va-transition);
}

.player-my-courses-btn:hover {
  background-color: var(--va-primary-alpha);
  color: var(--va-primary);
}

/* ---- 主体布局 ---- */
.player-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ---- 视频播放区 ---- */
.player-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.player-container {
  position: relative;
  width: 100%;
  background-color: #000;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--va-on-background-element);
  font-size: 0.875rem;
}

/* ---- 课时信息栏 ---- */
.lesson-info-bar {
  padding: 0.75rem 1.5rem;
  background-color: var(--va-background-primary);
  border-bottom: var(--va-block-border);
}

.lesson-info-bar__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.lesson-info-bar__text {
  flex: 1;
  min-width: 0;
}

.lesson-info-bar__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.125rem;
}

.lesson-info-bar__desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  margin: 0;
  line-height: 1.5;
}

.lesson-download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--va-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--va-primary-alpha);
  border-radius: var(--va-square-border-radius);
  transition: background-color var(--va-transition);
}

.lesson-download-btn:hover {
  background-color: var(--va-primary-alpha);
}

/* ---- 附件列表 ---- */
.attachment-list {
  padding: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.attachment-list--empty {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  padding: 0.5rem 0;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: var(--va-square-border-radius);
  cursor: pointer;
  transition: background-color var(--va-transition);
  color: var(--va-on-background-primary);
  font-size: 0.8125rem;
}

.attachment-item:hover {
  background-color: var(--va-background-hover);
  color: var(--va-primary);
}

.attachment-item__name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-item__size {
  color: var(--va-on-background-element);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.attachment-item__icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.attachment-item:hover .attachment-item__icon {
  opacity: 1;
}

/* ---- 购买横幅 ---- */
.purchase-banner {
  padding: 0.75rem 1.5rem;
  background-color: var(--va-primary-alpha);
  border-bottom: 1px solid var(--va-primary);
}

.purchase-banner__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.purchase-banner__text {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
}

.purchase-banner__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.purchase-banner__price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--va-danger);
}

/* ---- 学习进度统计 ---- */
.progress-summary {
  padding: 0.5rem 1.5rem;
  background-color: var(--va-background-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-summary__bar {
  flex: 1;
  height: 6px;
  background-color: var(--va-background-element);
  border-radius: 3px;
  overflow: hidden;
}

.progress-summary__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--va-primary), var(--va-success));
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-summary__text {
  font-size: 0.75rem;
  color: var(--va-on-background-secondary);
  white-space: nowrap;
}

/* ---- 侧边栏 ---- */
.player-sidebar {
  width: 320px;
  flex-shrink: 0;
  background-color: var(--va-background-primary);
  border-left: var(--va-block-border);
  overflow-y: auto;
}

.sidebar-inner {
  padding: 0.75rem;
}

.sidebar-section {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}

.sidebar-section__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.25rem;
}

.sidebar-lesson-count {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}

/* ---- 侧边栏章节 ---- */
.sidebar-chapter {
  margin-bottom: 0.75rem;
}

.sidebar-chapter__title {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  background-color: var(--va-background-secondary);
  border-radius: var(--va-square-border-radius);
  margin-bottom: 2px;
}

/* ---- 侧边栏课时项 ---- */
.sidebar-lesson {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--va-square-border-radius);
  cursor: pointer;
  transition: background-color var(--va-transition);
  margin-bottom: 1px;
}

.sidebar-lesson:hover {
  background-color: var(--va-background-hover);
}

.sidebar-lesson--active {
  background-color: var(--va-primary-alpha) !important;
  color: var(--va-primary);
}

.sidebar-lesson--active .sidebar-lesson__title {
  color: var(--va-primary);
  font-weight: 600;
}

.sidebar-lesson--locked {
  opacity: 0.55;
}

.sidebar-lesson--completed {
  opacity: 0.8;
}

.sidebar-lesson--completed .sidebar-lesson__title {
  color: var(--va-success);
}

.sidebar-lesson__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--va-on-background-element);
  width: 16px;
  height: 16px;
}

.sidebar-lesson--free .sidebar-lesson__icon {
  color: var(--va-success);
}

.sidebar-lesson__title {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--va-on-background-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-lesson__badge {
  flex-shrink: 0;
  font-size: 0.625rem;
  padding: 0 0.375rem;
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--va-muted);
}

.empty-state__icon {
  font-size: 2rem;
  opacity: 0.5;
  margin-bottom: 0.5rem;
}

.empty-state__text {
  font-size: 0.8125rem;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .player-body {
    flex-direction: column;
  }

  .player-sidebar {
    width: 100%;
    max-height: 240px;
    border-left: none;
    border-top: var(--va-block-border);
  }

  .player-container {
    aspect-ratio: 16 / 10;
  }
}
</style>
