<!--
 * AdminEarnings - 管理端收益看板
 *
 * 功能描述：展示平台整体收益数据，包括收益总览统计、每日收益趋势（堆叠柱状图+折线图）、课程/教师收益排行榜
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
 * 趋势图说明：采用堆叠柱状图（绿色=平台分成，黄色=教师收益）叠加折线（总流水）的混合图表，
 *            避免传统三柱并排导致的视觉混乱，清晰展示分成比例与趋势。
-->
<template>
  <div class="admin-earnings">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <h1 class="page-title">收益看板</h1>
      <span class="page-desc">平台整体收益统计与数据分析</span>
    </div>

    <!-- ========== 加载状态 ========== -->
    <div v-if="loading" class="loading-container">
      <div class="stats-grid">
        <div v-for="i in 4" :key="i" class="skeleton skeleton--card"></div>
      </div>
      <div class="skeleton skeleton--chart" style="height: 220px; margin-top: 1.5rem;"></div>
    </div>

    <template v-else>
      <!-- ========== 平台收益总览统计卡片 ========== -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-card__header">
            <span class="stat-card__label">平台总流水</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <span class="stat-card__value">¥{{ platformStats.totalRevenue.toFixed(2) }}</span>
          <span class="stat-card__sub">{{ platformStats.orderCount }} 笔订单</span>
        </div>

        <div class="stat-card card">
          <div class="stat-card__header">
            <span class="stat-card__label">平台分成收入</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <span class="stat-card__value">¥{{ platformStats.platformIncome.toFixed(2) }}</span>
          <span class="stat-card__sub">平台收益扣除分成</span>
        </div>

        <div class="stat-card card">
          <div class="stat-card__header">
            <span class="stat-card__label">教师总收益</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <span class="stat-card__value">¥{{ platformStats.teacherEarnings.toFixed(2) }}</span>
          <span class="stat-card__sub">教师结算金额</span>
        </div>

        <div class="stat-card card">
          <div class="stat-card__header">
            <span class="stat-card__label">已提现金额</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--va-info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <span class="stat-card__value">¥{{ platformStats.totalWithdrawn.toFixed(2) }}</span>
          <span class="stat-card__sub">教师已提现</span>
        </div>
      </div>

      <!-- ========== 每日收益趋势（堆叠柱状图 + 折线图） ========== -->
      <div class="card section-card">
        <h2 class="section-title">收益趋势（近30天）</h2>
        <div class="trend-chart">
          <!-- SVG 混合图表：堆叠柱状图 + 折线图 -->
          <div class="chart-wrapper">
            <svg
              :width="chartWidth"
              :height="chartHeight"
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              class="trend-svg"
            >
              <!-- 背景网格线（水平参考线） -->
              <line
                v-for="(y, i) in gridLines"
                :key="'grid-' + i"
                :x1="padding.left"
                :y1="y"
                :x2="chartWidth - padding.right"
                :y2="y"
                stroke="var(--va-background-element)"
                stroke-width="1"
                stroke-dasharray="3,3"
              />

              <!-- Y 轴标签 -->
              <text
                v-for="(label, i) in yAxisLabels"
                :key="'ylabel-' + i"
                :x="padding.left - 6"
                :y="gridLines[i] + 4"
                text-anchor="end"
                class="axis-label"
                fill="var(--va-muted)"
              >{{ label }}</text>

              <!-- 堆叠柱状图：每个日期一组堆叠柱 -->
              <g v-for="(item, idx) in trendData" :key="'bar-' + idx">
                <!-- 平台分成（绿色，底部） -->
                <rect
                  :x="getBarX(idx)"
                  :y="getStackBarY(item, 'platform')"
                  :width="barWidth"
                  :height="getStackBarHeight(item, 'platform')"
                  rx="2"
                  fill="var(--va-success)"
                  opacity="0.85"
                >
                <title>{{ formatDateFull(item.date) }} - 平台分成: ¥{{ item.platformIncome.toFixed(2) }}</title>
                </rect>
                <!-- 教师收益（黄色，堆叠在上方） -->
                <rect
                  :x="getBarX(idx)"
                  :y="getStackBarY(item, 'teacher')"
                  :width="barWidth"
                  :height="getStackBarHeight(item, 'teacher')"
                  rx="2"
                  fill="var(--va-warning)"
                  opacity="0.85"
                >
                <title>{{ formatDateFull(item.date) }} - 教师收益: ¥{{ item.teacherEarnings.toFixed(2) }}</title>
                </rect>
              </g>

              <!-- 总流水折线图 -->
              <polyline
                :points="linePoints"
                fill="none"
                stroke="var(--va-primary)"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- 折线端点圆点 -->
              <circle
                v-for="(point, idx) in linePointsArr"
                :key="'dot-' + idx"
                :cx="point.x"
                :cy="point.y"
                r="3.5"
                fill="var(--va-primary)"
                stroke="var(--va-background-primary)"
                stroke-width="2"
              >
                <title>{{ formatDateFull(trendData[idx]?.date || '') }} 总流水: ¥{{ (trendData[idx]?.revenue || 0).toFixed(2) }}</title>
              </circle>

              <!-- X 轴日期标签（每5天显示一个） -->
              <text
                v-for="(item, idx) in trendData"
                :key="'xlabel-' + idx"
                v-show="idx % 5 === 0"
                :x="getBarX(idx) + barWidth / 2"
                :y="chartHeight - padding.bottom + 16"
                text-anchor="middle"
                class="axis-label"
                fill="var(--va-muted)"
              >{{ formatDateShort(item.date) }}</text>
            </svg>
          </div>

          <!-- 图例 -->
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-line" style="background: var(--va-primary);"></span>
              总流水
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--va-success);"></span>
              平台收入
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--va-warning);"></span>
              教师收益
            </span>
          </div>
        </div>
      </div>

      <!-- ========== 排行榜 ========== -->
      <div class="rank-grid">
        <!-- 课程收益排行 -->
        <div class="card section-card">
          <h2 class="section-title">课程收益排行 TOP10</h2>
          <div v-if="topCourses.length > 0" class="rank-list">
            <div
              v-for="(item, index) in topCourses"
              :key="item.courseId"
              class="rank-item"
            >
              <span class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="rank-name text-truncate">{{ item.courseTitle }}</span>
          <span class="rank-amount">¥{{ item.totalAmount.toFixed(2) }}</span>
              <span class="rank-count">{{ item.orderCount }} 单</span>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="text-muted">暂无数据</span>
          </div>
        </div>

        <!-- 教师收益排行 -->
        <div class="card section-card">
          <h2 class="section-title">教师收益排行 TOP10</h2>
          <div v-if="topTeachers.length > 0" class="rank-list">
            <div
              v-for="(item, index) in topTeachers"
              :key="item.teacherId"
              class="rank-item"
            >
              <span class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="rank-name text-truncate">{{ item.teacherName }}</span>
              <span class="rank-amount">¥{{ item.totalAmount.toFixed(2) }}</span>
              <span class="rank-count">{{ item.orderCount }} 单</span>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="text-muted">暂无数据</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * AdminEarnings 管理端收益看板
 *
 * @description 展示平台整体收益统计、每日趋势（SVG堆叠柱状图+折线图）、课程和教师收益排行榜
 */
import { ref, computed, onMounted } from 'vue';
import {
  getPlatformEarningStats,
  getPlatformEarningTrend,
  getTopEarningCourses,
  getTopEarningTeachers,
} from '../../api/earnings';
import type {
  PlatformEarningStats,
  DailyEarningTrend,
  CourseEarningRank,
  TeacherEarningRank,
} from '../../api/earnings';

/** 加载状态 */
const loading = ref(true);

/** 平台收益总览 */
const platformStats = ref<PlatformEarningStats>({
  totalRevenue: 0,
  platformIncome: 0,
  teacherEarnings: 0,
  totalWithdrawn: 0,
  orderCount: 0,
});

/** 收益趋势数据 */
const trendData = ref<DailyEarningTrend[]>([]);

/** 课程收益排行 */
const topCourses = ref<CourseEarningRank[]>([]);

/** 教师收益排行 */
const topTeachers = ref<TeacherEarningRank[]>([]);

// ================================================================
// SVG 图表尺寸配置
// ================================================================
const chartWidth = 960;
const chartHeight = 240;
const padding = {
  top: 12,
  right: 16,
  bottom: 32,
  left: 48,
};

/** 有效绘制区域宽度 */
const plotWidth = computed(() => chartWidth - padding.left - padding.right);

/** 柱子宽度（自适应，最少6px） */
const barWidth = computed(() => {
  const count = trendData.value.length || 1;
  return Math.max(6, (plotWidth.value / count) * 0.55);
});

/** 柱子间距 */
const barGap = computed(() => {
  const count = trendData.value.length || 1;
  return (plotWidth.value - barWidth.value * count) / count;
});

/** 最大流水值（用于计算高度比例） */
const maxRevenue = computed(() => {
  return Math.max(...trendData.value.map((d) => d.revenue), 1);
});

/** 网格线Y坐标（5条水平参考线） */
const gridLines = computed(() => {
  const lines: number[] = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padding.top + ((chartHeight - padding.top - padding.bottom) * i) / steps;
    lines.push(y);
  }
  return lines;
});

/** Y轴标签（单位：元） */
const yAxisLabels = computed(() => {
  const labels: string[] = [];
  const steps = 4;
  for (let i = steps; i >= 0; i--) {
    const val = (maxRevenue.value / steps) * i;
    if (maxRevenue.value >= 10000) {
      labels.push((val / 10000).toFixed(1) + '万');
    } else {
      labels.push(val.toFixed(0));
    }
  }
  return labels;
});

/** 获取柱子的X坐标 */
const getBarX = (idx: number): number => {
  return padding.left + idx * (barWidth.value + barGap.value);
};

/** 获取堆叠柱子中某部分的Y坐标 */
const getStackBarY = (item: DailyEarningTrend, part: 'platform' | 'teacher'): number => {
  const plotHeight = chartHeight - padding.top - padding.bottom;
  if (part === 'platform') {
    // 平台分成在底部：底部Y = 底部位置
    const baseY = chartHeight - padding.bottom;
    const h = (item.platformIncome / maxRevenue.value) * plotHeight;
    return baseY - h;
  } else {
    // 教师收益堆叠在平台上：从 platform 顶部开始
    const baseY = chartHeight - padding.bottom;
    const platformH = (item.platformIncome / maxRevenue.value) * plotHeight;
    const teacherH = (item.teacherEarnings / maxRevenue.value) * plotHeight;
    return baseY - platformH - teacherH;
  }
};

/** 获取堆叠柱某部分的高度 */
const getStackBarHeight = (item: DailyEarningTrend, part: 'platform' | 'teacher'): number => {
  const plotHeight = chartHeight - padding.top - padding.bottom;
  if (part === 'platform') {
    return (item.platformIncome / maxRevenue.value) * plotHeight;
  } else {
    return (item.teacherEarnings / maxRevenue.value) * plotHeight;
  }
};

/** 折线图端点坐标数组 */
const linePointsArr = computed(() => {
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const baseY = chartHeight - padding.bottom;
  return trendData.value.map((item, idx) => ({
    x: getBarX(idx) + barWidth.value / 2,
    y: baseY - (item.revenue / maxRevenue.value) * plotHeight,
  }));
});

/** 折线图 points 属性字符串 */
const linePoints = computed(() => {
  return linePointsArr.value.map((p) => `${p.x},${p.y}`).join(' ');
});

// ================================================================
// 工具函数
// ================================================================

/**
 * 获取排名徽章样式
 * @param index 排名索引（从0开始）
 */
const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-badge--gold';
  if (index === 1) return 'rank-badge--silver';
  if (index === 2) return 'rank-badge--bronze';
  return 'rank-badge--normal';
};

/**
 * 格式化日期（短格式 MM-DD）
 * @description 后端返回 ISO 日期字符串（如 "2026-04-14T16:00:00.000Z"），
 *              在 Asia/Shanghai 时区下 new Date() 会自动 +8 小时转换
 */
const formatDateShort = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

/**
 * 格式化日期（完整格式 YYYY-MM-DD）
 */
const formatDateFull = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 加载所有数据
 */
const fetchAllData = async () => {
  loading.value = true;
  try {
    const [stats, trend, courses, teachers] = await Promise.all([
      getPlatformEarningStats(),
      getPlatformEarningTrend(30),
      getTopEarningCourses(10),
      getTopEarningTeachers(10),
    ]);
    // 后端数据以"分"为单位存储，前端展示统一除以100转换为"元"
    platformStats.value = {
      ...stats,
      totalRevenue: stats.totalRevenue / 100,
      platformIncome: stats.platformIncome / 100,
      teacherEarnings: stats.teacherEarnings / 100,
      totalWithdrawn: stats.totalWithdrawn / 100,
    };
    trendData.value = trend.map((item) => ({
      ...item,
      revenue: item.revenue / 100,
      platformIncome: item.platformIncome / 100,
      teacherEarnings: item.teacherEarnings / 100,
    }));
    topCourses.value = courses.map((item) => ({
      ...item,
      totalAmount: item.totalAmount / 100,
    }));
    topTeachers.value = teachers.map((item) => ({
      ...item,
      totalAmount: item.totalAmount / 100,
    }));
  } catch (error) {
    console.error('获取收益数据失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAllData();
});
</script>

<style scoped>
/* ============================================================
 * AdminEarnings 样式
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */

.admin-earnings {
  max-width: 1100px;
}

/* ---- 页面头部 ---- */
.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

.page-desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  margin-top: 0.25rem;
  display: block;
}

/* ---- 统计卡片网格 ---- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  padding: 1.25rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
}

.stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-card__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--va-on-background-element);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
}

.stat-card__sub {
  font-size: 0.75rem;
  color: var(--va-muted);
  display: block;
  margin-top: 0.25rem;
}

/* ---- 区块卡片 ---- */
.section-card {
  padding: 1.5rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 1rem;
}

/* ---- 趋势图（SVG） ---- */
.trend-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.trend-svg {
  display: block;
  min-width: 640px;
}

.axis-label {
  font-size: 11px;
  font-family: var(--va-font-family, 'Source Sans Pro', sans-serif);
}

/* ---- 图例 ---- */
.chart-legend {
  display: flex;
  gap: 1.25rem;
  justify-content: center;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
}

.legend-line {
  width: 20px;
  height: 3px;
  border-radius: 1.5px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* ---- 排行榜网格 ---- */
.rank-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .rank-grid {
    grid-template-columns: 1fr;
  }
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--va-square-border-radius);
  transition: var(--va-transition);
}

.rank-item:hover {
  background-color: var(--va-background-hover);
}

.rank-badge {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-badge--gold {
  background: linear-gradient(135deg, #F59E0B, #F97316);
  color: #FFFFFF;
}

.rank-badge--silver {
  background: linear-gradient(135deg, #94A3B8, #64748B);
  color: #FFFFFF;
}

.rank-badge--bronze {
  background: linear-gradient(135deg, #CD7F32, #A0522D);
  color: #FFFFFF;
}

.rank-badge--normal {
  background-color: var(--va-background-element);
  color: var(--va-on-background-secondary);
}

.rank-name {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--va-on-background-primary);
  font-weight: 500;
}

.rank-amount {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  white-space: nowrap;
}

.rank-count {
  font-size: 0.75rem;
  color: var(--va-muted);
  white-space: nowrap;
  min-width: 3rem;
  text-align: right;
}

/* ---- 空状态 ---- */
.empty-state {
  text-align: center;
  padding: 2rem;
}

.text-muted {
  color: var(--va-muted);
  font-size: 0.875rem;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 骨架屏 ---- */
.loading-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton {
  background: linear-gradient(90deg, var(--va-background-element) 25%, var(--va-background-secondary) 50%, var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--va-square-border-radius);
}

.skeleton--card {
  height: 105px;
}

.skeleton--chart {
  border-radius: var(--va-block-border-radius);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.card {
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
}
</style>
