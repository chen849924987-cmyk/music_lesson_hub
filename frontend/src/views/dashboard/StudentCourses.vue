<!--
 * StudentCourses - 学生课程中心页面组件
 *
 * 功能描述：DAW（数字音频工作站）主题的课程浏览页面，包含分类筛选栏、
 *           课程网格卡片，每张卡片配有频谱背景、浮动音符装饰和播放按钮。
 *
 * 设计参考：Vuestic UI 双主题设计体系，结合 DAW 创意美学
 * 变更说明：所有界面和业务数据图标从 emoji 替换为 SVG 图标
 -->
<template>
  <div class="student-courses">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-title gradient-text">课程中心</h2>
        <p class="page-subtitle">浏览并选择你感兴趣的课程</p>
      </div>
    </div>

    <!-- 课程分类（DAW 风格筛选栏） -->
    <div class="track-filters">
      <button
        v-for="track in tracks"
        :key="track.name"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeTrack === track.name }"
        @click="activeTrack = track.name"
      >
        <span class="filter-btn-icon" v-html="track.iconSvg"></span>
        {{ track.name }}
      </button>
    </div>

    <!-- 课程网格 -->
    <div class="course-grid">
      <div
        class="course-card card"
        :style="{ '--card-delay': `${n * 0.06}s` }"
        v-for="n in 6"
        :key="n"
      >
        <div class="course-card__image">
          <!-- 频谱背景 -->
          <div class="course-card__waveform">
            <span
              v-for="bar in 12"
              :key="bar"
              :style="{
                height: `${20 + Math.sin(bar * 0.6 + n * 1.5) * 40 + 20}%`,
                animationDelay: `${bar * 0.08 + n * 0.1}s`,
              }"
            ></span>
          </div>
          <!-- 浮动音符 -->
          <span
            class="music-note-decor"
            v-for="note in musicNotes"
            :key="note.id"
            :style="{ ...note.style, animationDelay: `${parseFloat(note.style.animationDelay) + n * 0.2}s` }"
            v-html="note.iconSvg"
          ></span>
          <!-- 播放按钮 -->
          <div class="course-card__play">
            <span class="course-card__play-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
          </div>
          <span class="course-card__duration badge badge--green">45min</span>
          <span class="course-card__track-label" v-html="trackIconSvgs[activeTrackIndex] || trackIconSvgs[0]"></span>
        </div>
        <div class="course-card__body">
          <h3 class="course-card__title">示例课程 {{ n }}</h3>
          <p class="course-card__desc">该课程的详细简介信息展示区域</p>
          <!-- VU 表装饰（课程卡片） -->
          <div class="course-card__vu">
            <span
              v-for="seg in 6"
              :key="seg"
              class="course-card__vu-seg"
              :class="{ 'course-card__vu-seg--active': seg <= n % 5 + 1 }"
            ></span>
          </div>
          <div class="course-card__meta">
            <span class="course-card__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: var(--va-warning); vertical-align: middle; margin-right: 2px;">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              4.8
            </span>
            <span class="course-card__students">128 人学习</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentCourses 页面组件
 *
 * @description 学生课程中心，DAW 主题课程浏览
 */
import { ref, computed } from 'vue';

const activeTrack = ref('全部');

const activeTrackIndex = computed(() => {
  const idx = tracks.findIndex(t => t.name === activeTrack.value);
  return idx >= 0 ? idx : 0;
});

/**
 * 曲风/分类图标 SVG 映射
 * 使用音乐主题的 inline SVG 替代 emoji
 */
const trackIconSvgs: string[] = [
  // 全部 - 音符图标
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  // 节奏与鼓组 - 鼓/节拍图标
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>`,
  // 混音与母带 - 推子/混音台图标
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M8 9h8"/><path d="M6 13h12"/><path d="M4 17h16"/></svg>`,
  // 乐理与作曲 - 乐谱/五线谱图标
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  // 编曲与制作 - 钢琴键盘图标
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v12"/><path d="M10 4v12"/><path d="M14 4v12"/><path d="M18 4v12"/></svg>`,
  // 声乐与人声 - 麦克风图标
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M12 20v3"/></svg>`,
];

const tracks = [
  { iconSvg: trackIconSvgs[0], name: '全部' },
  { iconSvg: trackIconSvgs[1], name: '节奏与鼓组' },
  { iconSvg: trackIconSvgs[2], name: '混音与母带' },
  { iconSvg: trackIconSvgs[3], name: '乐理与作曲' },
  { iconSvg: trackIconSvgs[4], name: '编曲与制作' },
  { iconSvg: trackIconSvgs[5], name: '声乐与人声' },
];

/** 浮动音符装饰的 SVG 图标数组 */
const noteSvgIcons: string[] = [
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="10" ry="8"/><path d="M12 4v16"/><path d="M8 8h8"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
];

const musicNotes = [
  { id: 1, iconSvg: noteSvgIcons[0], style: { left: '10%', top: '60%', animationDelay: '0s' } },
  { id: 2, iconSvg: noteSvgIcons[1], style: { left: '30%', top: '40%', animationDelay: '0.6s' } },
  { id: 3, iconSvg: noteSvgIcons[2], style: { left: '55%', top: '65%', animationDelay: '1.2s' } },
  { id: 4, iconSvg: noteSvgIcons[3], style: { left: '75%', top: '35%', animationDelay: '1.8s' } },
];
</script>

<style scoped>
/* ============================================================
 * StudentCourses 样式
 * 使用 --va-* 双主题 CSS 变量 + DAW 音乐美学元素
 * ============================================================ */

.student-courses {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 22px;
  margin: 0 0 4px;
  font-family: var(--va-font-family);
}
.page-subtitle {
  font-size: 13px;
  color: var(--va-on-background-secondary);
  margin: 0;
}

/* ---- 筛选栏 ---- */
.track-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--va-background-primary);
  border: 1px solid var(--va-block-border);
  border-radius: 8px;
  color: var(--va-on-background-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-btn:hover {
  border-color: var(--va-primary);
  color: var(--va-on-background-primary);
}
.filter-btn--active {
  background: var(--va-primary-alpha);
  border-color: var(--va-primary);
  color: var(--va-primary);
}
.filter-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.filter-btn-icon svg {
  width: 18px;
  height: 18px;
}

/* ---- 课程网格 ---- */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.course-card {
  overflow: hidden;
  animation: cardFadeInUp 0.5s var(--card-delay, 0s) ease both;
}

/* ---- 频谱背景 ---- */
.course-card__image {
  aspect-ratio: 16/9;
  background: var(--va-background-element);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.course-card__waveform {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 80px;
  padding: 0 12px;
  opacity: 0.25;
}
.course-card__waveform span {
  flex: 1;
  border-radius: 1px 1px 0 0;
  background: var(--va-primary);
  animation: wave 0.6s ease-in-out infinite alternate;
}

/* ---- 播放按钮 ---- */
.course-card__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: var(--va-background-element);
  opacity: 0.85;
}
.course-card:hover .course-card__play {
  opacity: 1;
}
.course-card__play-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--va-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--va-background-element);
  box-shadow: 0 0 24px var(--va-primary-alpha);
  transition: transform 0.2s ease;
}
.course-card:hover .course-card__play-btn {
  transform: scale(1.1);
}
.course-card__play-btn svg {
  width: 20px;
  height: 20px;
}

.course-card__duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
}
.course-card__body {
  padding: 16px 20px 20px;
}
.course-card__title {
  font-size: 15px;
  margin: 0 0 6px;
  color: var(--va-on-background-primary);
}
.course-card__desc {
  font-size: 13px;
  color: var(--va-on-background-secondary);
  margin: 0 0 12px;
  line-height: 1.5;
}

/* ---- VU 表（课程卡片） ---- */
.course-card__vu {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 6px;
  margin-bottom: 12px;
}
.course-card__vu-seg {
  width: 4px;
  border-radius: 1px;
  background: var(--va-background-secondary);
  transition: background 0.3s ease;
}
.course-card__vu-seg--active {
  background: var(--va-primary);
  box-shadow: 0 0 4px var(--va-primary-alpha);
}

.course-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.course-card__rating {
  font-size: 13px;
  color: var(--va-on-background-secondary);
  display: inline-flex;
  align-items: center;
}
.course-card__students {
  font-size: 12px;
  color: var(--va-on-background-secondary);
  opacity: 0.7;
}
.course-card__track-label {
  position: absolute;
  bottom: 8px;
  left: 12px;
  opacity: 0.4;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
}
.course-card__track-label svg {
  width: 18px;
  height: 18px;
}
.music-note-decor {
  position: absolute;
  color: var(--va-primary);
  opacity: 0;
  pointer-events: none;
  animation: musicNoteFloat 3s ease-in-out infinite;
}
.music-note-decor svg {
  width: 20px;
  height: 20px;
}
</style>
