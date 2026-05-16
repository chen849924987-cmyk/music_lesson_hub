<!--
 * VideoPlayer.vue - 视频播放器组件
 *
 * 功能描述：基于 HTML5 Video 的增强播放器组件，支持播放速度调节、画中画、全屏、
 *           进度追踪回调（用于学习进度同步）和试看时长控制。
 *
 * @props:
 * - src: 视频源地址
 * - poster: 视频封面图
 * - autoResume: 自动续播位置（秒），从后端获取的上次播放位置
 * - isTrial: 是否试看模式
 * - trialDuration: 试看总时长（秒）
 * - autoPlay: 是否自动播放
 *
 * @emits:
 * - progress: 播放进度更新回调，参数 { currentTime, duration, progress（百分比） }
 * - pause: 视频暂停时触发，附带当前播放位置信息
 * - ended: 视频播放结束时触发
 * - trial-end: 试看时间耗尽时触发
 * - first-play: 首次播放时触发
 *
 * @设计参考：Vuestic UI 双主题体系
 -->
<template>
  <div
    class="video-player"
    ref="playerContainerRef"
    @mouseenter="showControls = true"
    @mouseleave="hideControlsAfterDelay"
    @mousemove="onMouseMove"
  >
    <!-- ======== 视频元素 ======== -->
    <video
      ref="videoRef"
      class="video-player__element"
      :src="src"
      :poster="poster || undefined"
      :autoplay="autoPlay"
      :preload="autoPlay ? 'auto' : 'metadata'"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="emitPause"
      @ended="onEnded"
      @loadedmetadata="onLoadedMetadata"
      @waiting="onWaiting"
      @canplay="onCanPlay"
      @error="onError"
      @click="togglePlay"
      @dblclick="toggleFullscreen"
      @keydown="onKeyDown"
      tabindex="0"
    ></video>

    <!-- ======== 加载中状态 ======== -->
    <div v-if="loading" class="video-player__loading">
      <div class="loading-spinner"></div>
    </div>

    <!-- ======== 错误状态 ======== -->
    <div v-if="error" class="video-player__error">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ errorMessage }}</span>
      <button class="btn btn-text" @click="retry">重试</button>
    </div>

    <!-- ======== 播放暂停居中按钮 ======== -->
    <div v-if="!loading && !error && !isPlaying" class="video-player__center-play" @click="play">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    </div>

    <!-- ======== 试看蒙层 ======== -->
    <div v-if="isTrial && isPlaying" class="video-player__trial-overlay">
      <div class="trial-badge">试看中</div>
      <div class="trial-countdown">
        剩余试看时间：{{ formattedTrialTime }}
      </div>
      <!-- 试看进度条 -->
      <div class="trial-progress-bar">
        <div class="trial-progress-bar__fill" :style="{ width: trialProgressPercent + '%' }"></div>
      </div>
    </div>

    <!-- ======== 底部控制栏 ======== -->
    <div
      v-show="showControls || !isPlaying"
      class="video-player__controls"
    >
      <!-- 进度条 -->
      <div class="controls-progress" @mousedown="startSeeking">
        <div class="controls-progress__track" ref="progressTrackRef">
          <!-- 缓冲进度 -->
          <div class="controls-progress__buffer" :style="{ width: bufferedPercent + '%' }"></div>
          <!-- 播放进度 -->
          <div class="controls-progress__played" :style="{ width: playedPercent + '%' }"></div>
          <!-- 拖拽手柄 -->
          <div class="controls-progress__thumb" :style="{ left: playedPercent + '%' }"></div>
        </div>
      </div>

      <!-- 控制按钮行 -->
      <div class="controls-actions">
        <!-- 左侧：播放/暂停 -->
        <div class="controls-actions__left">
          <button class="control-btn" @click="togglePlay" :title="isPlaying ? '暂停 (k)' : '播放 (k)'">
            <svg v-if="isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>

          <!-- 时间显示 -->
          <span class="controls-time">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </span>
        </div>

        <!-- 右侧：速度 / 画中画 / 全屏 -->
        <div class="controls-actions__right">
          <!-- 播放速度 -->
          <div class="controls-speed" @mouseenter="showSpeedMenu = true" @mouseleave="showSpeedMenu = false">
            <button class="control-btn" title="播放速度">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
            <div v-if="showSpeedMenu" class="speed-menu">
              <div
                v-for="speed in playbackSpeeds"
                :key="speed"
                class="speed-menu__item"
                :class="{ 'speed-menu__item--active': playbackSpeed === speed }"
                @click="setPlaybackSpeed(speed)"
              >
                {{ speed }}x
              </div>
            </div>
          </div>

          <!-- 画中画 -->
          <button class="control-btn" @click="togglePiP" title="画中画" v-if="supportsPiP">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><rect x="11" y="9" width="8" height="6" rx="1"/>
            </svg>
          </button>

          <!-- 全屏 -->
          <button class="control-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏 (f)' : '全屏 (f)'">
            <svg v-if="isFullscreen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * VideoPlayer 视频播放器组件
 *
 * @description 增强型 HTML5 视频播放器，支持速度调节、画中画、全屏、试看控制和学习进度回调。
 *              相比原生 <video> 标签，提供了统一的 UI 和交互体验。
 *
 * @param src - 视频源地址
 * @param poster - 视频封面图
 * @param autoResume - 自动续播位置（秒），从后端获取的上次播放位置
 * @param isTrial - 是否试看模式
 * @param trialDuration - 试看总时长（秒）
 * @param autoPlay - 是否自动播放
 *
 * @emits progress - 每 30 秒触发一次，附带 { currentTime, duration, progress } 用于同步学习进度
 * @emits pause - 视频暂停时触发
 * @emits ended - 播放结束时触发
 * @emits trial-end - 试看时间耗尽
 * @emits first-play - 首次播放
 */
import {
  ref,
  computed,
  reactive,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from 'vue';

// ========== Props & Emits ==========

const props = withDefaults(
  defineProps<{
    src: string;
    poster?: string;
    autoResume?: number;
    isTrial?: boolean;
    trialDuration?: number;
    autoPlay?: boolean;
  }>(),
  {
    poster: '',
    autoResume: 0,
    isTrial: false,
    trialDuration: 300,
    autoPlay: false,
  }
);

const emit = defineEmits<{
  progress: [payload: { currentTime: number; duration: number; progress: number }];
  pause: [payload: { currentTime: number; progress: number }];
  ended: [];
  'trial-end': [];
  'first-play': [];
  ready: [];
}>();

// ========== DOM 引用 ==========

const videoRef = ref<HTMLVideoElement | null>(null);
const playerContainerRef = ref<HTMLDivElement | null>(null);
const progressTrackRef = ref<HTMLDivElement | null>(null);

// ========== 播放状态 ==========

/** 是否在播放中 */
const isPlaying = ref(false);
/** 是否加载中 */
const loading = ref(true);
/** 是否出错 */
const error = ref(false);
/** 错误信息 */
const errorMessage = ref('');
/** 视频总时长（秒） */
const duration = ref(0);
/** 当前播放位置（秒） */
const currentTime = ref(0);
/** 播放进度百分比（0~100） */
const playedPercent = ref(0);
/** 缓冲进度百分比 */
const bufferedPercent = ref(0);
/** 是否显示控制栏 */
const showControls = ref(true);
/** 控制栏自动隐藏定时器 */
let controlsTimer: ReturnType<typeof setTimeout> | null = null;
/** 是否全屏 */
const isFullscreen = ref(false);
/** 播放速度 */
const playbackSpeed = ref(1);
/** 是否显示速度菜单 */
const showSpeedMenu = ref(false);
/** 是否正在拖拽进度条 */
const isSeeking = ref(false);
/** 是否已首次播放 */
const hasPlayed = ref(false);
/** 是否支持画中画 */
const supportsPiP = ref(false);

/** 支持的播放速度选项 */
const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ========== 试看状态 ==========

const trialState = reactive({
  /** 最大已播放进度位置（秒），只增不减 */
  maxPlayedPosition: 0,
  /** 剩余试看时间（秒），用于 UI 展示 */
  remaining: props.trialDuration,
});

/** 格式化后的试看剩余时间 */
const formattedTrialTime = computed(() => {
  const totalSecs = Math.floor(trialState.remaining);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

/** 试看剩余进度百分比 */
const trialProgressPercent = computed(() => {
  if (props.trialDuration <= 0) return 0;
  return Math.max(0, Math.min(100, (trialState.remaining / props.trialDuration) * 100));
});

// ========== 学习进度同步 ==========

/** 上次同步进度的时间（秒），用于 30 秒间隔同步 */
let lastSyncTime = 0;
/** 进度同步定时器 */
let progressSyncTimer: ReturnType<typeof setInterval> | null = null;

// ========== 方法 ==========

/** 格式化时间（秒 -> m:ss） */
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/** 播放 */
const play = async () => {
  if (!videoRef.value || error.value) return;
  try {
    await videoRef.value.play();
  } catch {
    // 自动播放被浏览器阻止时静默处理
  }
};

/** 暂停 */
const pause = () => {
  if (!videoRef.value) return;
  videoRef.value.pause();
};

/** 切换播放/暂停 */
const togglePlay = () => {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
};

/** 设置播放速度 */
const setPlaybackSpeed = (speed: number) => {
  if (!videoRef.value) return;
  videoRef.value.playbackRate = speed;
  playbackSpeed.value = speed;
  showSpeedMenu.value = false;
};

/** 切换全屏 */
const toggleFullscreen = async () => {
  if (!playerContainerRef.value) return;

  if (isFullscreen.value) {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } else {
    await playerContainerRef.value.requestFullscreen();
  }
};

/** 切换画中画 */
const togglePiP = async () => {
  if (!videoRef.value) return;

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (supportsPiP.value) {
      await videoRef.value.requestPictureInPicture();
    }
  } catch {
    // 画中画被拒绝时静默处理
  }
};

/** 拖拽进度条开始 */
const startSeeking = (e: MouseEvent) => {
  isSeeking.value = true;
  updateSeekPosition(e);

  const onMouseMove = (ev: MouseEvent) => updateSeekPosition(ev);
  const onMouseUp = () => {
    isSeeking.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

/** 更新拖拽位置 */
const updateSeekPosition = (e: MouseEvent) => {
  if (!progressTrackRef.value || !videoRef.value) return;
  const rect = progressTrackRef.value.getBoundingClientRect();
  const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const newTime = pos * duration.value;

  videoRef.value.currentTime = newTime;
  currentTime.value = newTime;
  playedPercent.value = pos * 100;
};

/** 键盘快捷键 */
const onKeyDown = (e: KeyboardEvent) => {
  if (!videoRef.value) return;

  switch (e.key) {
    case ' ':
    case 'k':
      e.preventDefault();
      togglePlay();
      break;
    case 'f':
      e.preventDefault();
      toggleFullscreen();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 10);
      break;
    case 'ArrowRight':
      e.preventDefault();
      videoRef.value.currentTime = Math.min(duration.value, videoRef.value.currentTime + 10);
      break;
    case 'ArrowUp':
      e.preventDefault();
      videoRef.value.volume = Math.min(1, (videoRef.value.volume || 0.5) + 0.1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      videoRef.value.volume = Math.max(0, (videoRef.value.volume || 0.5) - 0.1);
      break;
    case 'm':
      e.preventDefault();
      videoRef.value.muted = !videoRef.value.muted;
      break;
  }
};

/** 控制栏自动隐藏 */
const hideControlsAfterDelay = () => {
  if (controlsTimer) clearTimeout(controlsTimer);
  if (isPlaying.value) {
    controlsTimer = setTimeout(() => {
      if (isPlaying.value) showControls.value = false;
    }, 3000);
  }
};

/** 鼠标移动时显示控制栏 */
const onMouseMove = () => {
  showControls.value = true;
  hideControlsAfterDelay();
};

// ========== 视频事件回调 ==========

/** 元数据加载完成 */
const onLoadedMetadata = () => {
  if (!videoRef.value) return;
  duration.value = videoRef.value.duration || 0;

  // 设置自动续播位置
  if (props.autoResume > 0) {
    videoRef.value.currentTime = props.autoResume;
  }

  emit('ready');
};

/** 可以播放 */
const onCanPlay = () => {
  loading.value = false;
  error.value = false;
};

/** 开始缓冲 */
const onWaiting = () => {
  loading.value = true;
};

/** 播放事件 */
const onPlay = () => {
  isPlaying.value = true;
  loading.value = false;

  if (!hasPlayed.value) {
    hasPlayed.value = true;
    emit('first-play');
  }

  // 如果是试看模式，检查试看是否已耗尽
  if (props.isTrial && trialState.maxPlayedPosition >= props.trialDuration) {
    videoRef.value?.pause();
    isPlaying.value = false;
    return;
  }

  hideControlsAfterDelay();
};

/** 暂停事件 - 同步进度到后端 */
const emitPause = () => {
  isPlaying.value = false;
  showControls.value = true;

  // 发出暂停事件，供父组件同步进度到后端
  emit('pause', {
    currentTime: currentTime.value,
    progress: playedPercent.value,
  });

  // 立即同步一次进度
  emitProgress();
};

/** 播放结束 */
const onEnded = () => {
  isPlaying.value = false;
  showControls.value = true;
  emit('ended');
};

/** 视频播放错误 */
const onError = () => {
  error.value = true;
  loading.value = false;
  errorMessage.value = '视频加载失败，请检查网络后重试';
};

/** 重试加载 */
const retry = () => {
  if (!videoRef.value) return;
  error.value = false;
  loading.value = true;
  errorMessage.value = '';
  videoRef.value.load();
};

// ========== 试看逻辑 ==========

let trialMonitorId: number | null = null;

/** 启动试看监控循环（requestAnimationFrame 版） */
const startTrialMonitor = () => {
  if (!props.isTrial || !videoRef.value) return;

  const check = () => {
    if (!props.isTrial || !videoRef.value) return;

    const ct = videoRef.value.currentTime;
    if (ct <= 0) {
      trialMonitorId = requestAnimationFrame(check);
      return;
    }

    // 更新最大进度位置（只增不减）
    const newMax = Math.max(trialState.maxPlayedPosition, ct);
    trialState.maxPlayedPosition = newMax;

    // 更新剩余时间
    trialState.remaining = Math.max(0, props.trialDuration - newMax);

    // 如果试看时间耗尽
    if (newMax >= props.trialDuration) {
      videoRef.value.pause();
      isPlaying.value = false;
      trialMonitorId = null;
      emit('trial-end');
      return;
    }

    trialMonitorId = requestAnimationFrame(check);
  };

  trialMonitorId = requestAnimationFrame(check);
};

/** 停止试看监控 */
const stopTrialMonitor = () => {
  if (trialMonitorId !== null) {
    cancelAnimationFrame(trialMonitorId);
    trialMonitorId = null;
  }
};

// ========== 进度同步 ==========

/** 触发进度事件（供父组件同步） */
const emitProgress = () => {
  if (duration.value <= 0) return;
  emit('progress', {
    currentTime: currentTime.value,
    duration: duration.value,
    progress: playedPercent.value,
  });
};

// ========== 视频 timeupdate 回调 ==========

const onTimeUpdate = () => {
  if (!videoRef.value) return;

  const ct = videoRef.value.currentTime;
  const dur = videoRef.value.duration || 1;

  currentTime.value = ct;
  duration.value = dur;
  playedPercent.value = (ct / dur) * 100;

  // 更新缓冲进度
  if (videoRef.value.buffered.length > 0) {
    const bufferedEnd = videoRef.value.buffered.end(videoRef.value.buffered.length - 1);
    bufferedPercent.value = (bufferedEnd / dur) * 100;
  }

  // 试看进度追踪
  if (props.isTrial) {
    const newMax = Math.max(trialState.maxPlayedPosition, ct);
    trialState.maxPlayedPosition = newMax;
    trialState.remaining = Math.max(0, props.trialDuration - newMax);

    if (newMax >= props.trialDuration) {
      videoRef.value.pause();
      isPlaying.value = false;
      emit('trial-end');
      return;
    }
  }

  // 每 30 秒同步一次学习进度到后端
  if (ct - lastSyncTime >= 30) {
    lastSyncTime = ct;
    emitProgress();
  }
};

// ========== 生命周期 ==========

onMounted(() => {
  // 检查是否支持画中画
  supportsPiP.value = 'pictureInPictureEnabled' in document;

  // 全屏事件监听
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });

  // 键盘监听（仅在播放器聚焦时）
  videoRef.value?.addEventListener('keydown', onKeyDown);

  // 启动定时同步（每 60 秒强制同步一次，兜底）
  progressSyncTimer = setInterval(() => {
    if (isPlaying.value && currentTime.value > 0) {
      emitProgress();
    }
  }, 60000);
});

onUnmounted(() => {
  // 停止监控循环
  stopTrialMonitor();

  // 停止定时器
  if (progressSyncTimer) {
    clearInterval(progressSyncTimer);
    progressSyncTimer = null;
  }

  // 隐藏控制栏定时器
  if (controlsTimer) {
    clearTimeout(controlsTimer);
    controlsTimer = null;
  }

  // 退出画中画
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(() => {});
  }
});

// 监听 src 变化重置状态
watch(
  () => props.src,
  () => {
    // 重置所有状态
    isPlaying.value = false;
    loading.value = true;
    error.value = false;
    errorMessage.value = '';
    currentTime.value = 0;
    duration.value = 0;
    playedPercent.value = 0;
    bufferedPercent.value = 0;
    hasPlayed.value = false;
    lastSyncTime = 0;

    // 重置试看状态
    trialState.maxPlayedPosition = 0;
    trialState.remaining = props.trialDuration;

    // 停止旧监控
    stopTrialMonitor();

    // 聚焦播放器以接收键盘事件
    nextTick(() => {
      videoRef.value?.focus();
    });
  }
);

// 组件激活时自动聚焦（用于键盘快捷键）
onMounted(() => {
  nextTick(() => {
    videoRef.value?.focus();
  });
});
</script>

<style scoped>
/* ============================================================
 * VideoPlayer 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.video-player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  overflow: hidden;
  cursor: default;
  user-select: none;
}

.video-player__element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none;
}

/* ---- 加载状态 ---- */
.video-player__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--va-primary, #0066FF);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---- 错误状态 ---- */
.video-player__error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  background: rgba(0, 0, 0, 0.5);
}

.video-player__error button {
  color: var(--va-primary, #0066FF);
  font-weight: 600;
  padding: 0.375rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
}

/* ---- 居中播放按钮 ---- */
.video-player__center-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.video-player__center-play:hover svg {
  opacity: 1;
  transform: scale(1.1);
}

.video-player__center-play svg {
  transition: all 0.2s;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

/* ---- 试看蒙层 ---- */
.video-player__trial-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 48px;  /* 留出控制栏空间 */
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 1rem;
  gap: 0.375rem;
}

.trial-badge {
  padding: 0.25rem 0.75rem;
  background-color: rgba(245, 158, 11, 0.9);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.25rem;
}

.trial-countdown {
  padding: 0.375rem 0.75rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.8125rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.trial-progress-bar {
  width: 160px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.trial-progress-bar__fill {
  height: 100%;
  background: var(--va-warning, #F59E0B);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ---- 控制栏 ---- */
.video-player__controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
  padding: 0.5rem 0.75rem 0.375rem;
  transition: opacity 0.3s;
}

/* ---- 进度条 ---- */
.controls-progress {
  padding: 0.25rem 0;
  cursor: pointer;
  position: relative;
}

.controls-progress__track {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  position: relative;
  transition: height 0.15s;
}

.controls-progress:hover .controls-progress__track {
  height: 6px;
}

.controls-progress__buffer {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.controls-progress__played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--va-primary, #0066FF);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.controls-progress__thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.15s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.controls-progress:hover .controls-progress__thumb {
  transform: translate(-50%, -50%) scale(1);
}

/* ---- 控制按钮行 ---- */
.controls-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.controls-actions__left,
.controls-actions__right {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.controls-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
  margin-left: 0.25rem;
  user-select: none;
}

/* ---- 速度菜单 ---- */
.controls-speed {
  position: relative;
}

.speed-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  background: rgba(30, 30, 30, 0.95);
  border-radius: 0.375rem;
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 64px;
  margin-bottom: 4px;
  backdrop-filter: blur(8px);
}

.speed-menu__item {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: 0.25rem;
  text-align: center;
  transition: all 0.15s;
}

.speed-menu__item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.speed-menu__item--active {
  color: var(--va-primary, #0066FF);
  font-weight: 600;
}

/* ---- 全屏模式适配 ---- */
:fullscreen .video-player {
  aspect-ratio: auto;
  height: 100vh;
}
</style>
