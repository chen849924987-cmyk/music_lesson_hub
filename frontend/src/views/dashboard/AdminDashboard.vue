<!--
 * AdminDashboard - 管理员/审核员控制台页面组件
 *
 * 功能描述：DAW（数字音频工作站）主题的数据仪表盘，
 *           根据用户角色动态显示不同的统计数据和快捷操作：
 *           - 超级管理员/运营管理员：全平台数据概览
 *           - 审核员：审核待办事项概览
 *
 * 设计参考：Vuestic UI 双主题设计体系，结合 DAW 创意美学
 -->

<template>
  <div class="admin-dashboard">
    <!-- 顶部标题（DAW 工程 Header） -->
    <div class="dashboard-header">
      <h2 class="dashboard-title gradient-text">
        <AdjustmentsHorizontalIcon class="header-icon" /> 控制台
      </h2>
      <p class="dashboard-subtitle">{{ isReviewer ? '审核控制台' : '平台运营数据概览' }}</p>
    </div>

    <!-- ============ 审核员视图 ============ -->
    <template v-if="isReviewer">
      <!-- 审核待办面板 -->
      <div class="quick-panel card reveal-item" data-index="0">
        <div class="quick-panel__greeting">
          <div class="quick-panel__avatar">{{ authStore.userInfo?.nickname?.charAt(0) || 'A' }}</div>
          <div>
            <h3>欢迎回来，{{ authStore.userInfo?.nickname }}</h3>
            <p class="text-muted">内容审核中心 · 待处理任务</p>
          </div>
        </div>
        <div class="quick-panel__actions">
          <router-link to="/admin/courses/review" class="quick-action">
            <BookOpenIcon class="quick-action__icon" />
            <span>课程审核</span>
            <span class="quick-action__badge" v-if="pendingCourseCount > 0">
              <span class="badge badge--danger">{{ pendingCourseCount }}</span>
            </span>
            <span class="quick-action__arrow">→</span>
          </router-link>
          <router-link to="/admin/attachments/review" class="quick-action">
            <PaperClipIcon class="quick-action__icon" />
            <span>附件审核</span>
            <span class="quick-action__badge" v-if="pendingAttachmentCount > 0">
              <span class="badge badge--danger">{{ pendingAttachmentCount }}</span>
            </span>
            <span class="quick-action__arrow">→</span>
          </router-link>
        </div>
      </div>

      <!-- 审核待办统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card card" :style="{ '--stat-delay': '0s' }">
          <div class="stat-header">
            <BookOpenIcon class="stat-icon-type" />
            <span class="va-title va-title-info">待审核课程</span>
          </div>
          <div class="stat-value" :class="{ 'stat-value--urgent': pendingCourseCount > 0 }">
            {{ pendingCourseCount }}
          </div>
          <div class="stat-trend stat-trend--up">
            <span class="trend-text">等待审核的课程内容</span>
          </div>
          <div class="vu-meter--enhanced">
            <span
              v-for="n in 16"
              :key="n"
              class="vu-seg"
              :class="vuMeterClass(pendingCourseCount, n)"
            ></span>
          </div>
        </div>
        <div class="stat-card card" :style="{ '--stat-delay': '0.1s' }">
          <div class="stat-header">
            <PaperClipIcon class="stat-icon-type" />
            <span class="va-title va-title-info">待审核附件</span>
          </div>
          <div class="stat-value" :class="{ 'stat-value--urgent': pendingAttachmentCount > 0 }">
            {{ pendingAttachmentCount }}
          </div>
          <div class="stat-trend stat-trend--up">
            <span class="trend-text">等待审核的附件文件</span>
          </div>
          <div class="vu-meter--enhanced">
            <span
              v-for="n in 16"
              :key="n"
              class="vu-seg"
              :class="vuMeterClass(pendingAttachmentCount, n)"
            ></span>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 超级管理员/运营管理员视图 ============ -->
    <template v-else>
      <!-- 快捷操作面板（DAW 通道条风格） -->
      <div class="quick-panel card reveal-item" data-index="0">
        <div class="quick-panel__greeting">
          <div class="quick-panel__avatar">{{ authStore.userInfo?.nickname?.charAt(0) || 'A' }}</div>
          <div>
            <h3>欢迎回来，{{ authStore.userInfo?.nickname }}</h3>
            <p class="text-muted">平台管理中心 · 一切尽在掌控</p>
          </div>
        </div>
        <div class="quick-panel__actions">
          <router-link to="/admin/users" class="quick-action">
            <UsersIcon class="quick-action__icon" />
            <span>用户管理</span>
            <span class="quick-action__arrow">→</span>
          </router-link>
          <router-link to="/admin/teachers" class="quick-action">
            <AcademicCapIcon class="quick-action__icon" />
            <span>教师管理</span>
            <span class="quick-action__arrow">→</span>
          </router-link>
          <router-link to="/admin/courses" class="quick-action">
            <BookOpenIcon class="quick-action__icon" />
            <span>课程管理</span>
            <span class="quick-action__arrow">→</span>
          </router-link>
          <router-link to="/admin/courses/review" class="quick-action">
            <ClipboardDocumentCheckIcon class="quick-action__icon" />
            <span>课程审核</span>
            <span class="quick-action__badge" v-if="pendingCourseCount > 0">
              <span class="badge badge--danger">{{ pendingCourseCount }}</span>
            </span>
            <span class="quick-action__arrow">→</span>
          </router-link>
        </div>
      </div>

      <!-- 统计卡片（VU 表增强风格） -->
      <div class="stats-grid">
        <div
          class="stat-card card"
          v-for="(stat, i) in stats"
          :key="stat.label"
          :style="{ '--stat-delay': `${i * 0.1}s` }"
        >
          <div class="stat-header">
            <component :is="stat.icon" class="stat-icon-type" />
            <span class="va-title va-title-info">{{ stat.label }}</span>
          </div>
          <div class="stat-value">{{ formatNumber(stat.value) }}</div>
          <div class="stat-trend" :class="`stat-trend--${stat.trend}`">
            <span class="trend-arrow">{{ stat.trend === 'up' ? '↑' : '↓' }}</span>
            <span class="trend-text">{{ stat.trendText }}</span>
          </div>
          <!-- 增强 VU 表（16 段） -->
          <div class="vu-meter--enhanced">
            <span
              v-for="n in 16"
              :key="n"
              class="vu-seg"
              :class="vuMeterClass(stat, n)"
            ></span>
          </div>
        </div>
      </div>

      <!-- 平台概况（DAW 多轨进度条风格） -->
      <div class="progress-section card">
        <div class="section-header">
          <ChartBarIcon class="section-icon" />
          <h3 class="section-title">平台概况</h3>
        </div>
        <div class="progress-list">
          <div class="progress-item" v-for="item in progresses" :key="item.label">
            <div class="progress-info">
              <span class="progress-name">{{ item.label }}</span>
              <span class="progress-value">{{ item.value }}{{ item.unit }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar__fill" :style="{ width: `${item.percent}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * AdminDashboard 页面组件
 *
 * @description 管理员/审核员控制台，DAW 主题数据仪表盘。
 *              根据角色动态展示：
 *              - reviewer（审核员）：审核待办概览（待审核课程数、待审核附件数）
 *              - super_admin/operator（管理员/运营）：全平台数据概览（从后端 API 实时获取）
 */
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { getAdminStats } from '@/api/admin';
import { getPendingCourseCount } from '@/api/course';
import { getPendingAttachmentCount } from '@/api/attachment';

import {
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  PaperClipIcon,
  UsersIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();

/** 当前用户是否为审核员 */
const isReviewer = computed(() => authStore.role === 'reviewer');

/** 待审核课程数量 */
const pendingCourseCount = ref(0);
/** 待审核附件数量 */
const pendingAttachmentCount = ref(0);

/**
 * 生命周期：组件挂载时加载数据
 */
onMounted(async () => {
  try {
    // 并行加载待审核数量
    const [courseResult, attachmentResult] = await Promise.all([
      getPendingCourseCount().catch(() => ({ count: 0 })),
      getPendingAttachmentCount().catch(() => ({ count: 0 })),
    ]);
    pendingCourseCount.value = courseResult.count ?? 0;
    pendingAttachmentCount.value = attachmentResult.count ?? 0;

    // 管理员/运营：加载全平台统计数据
    if (!isReviewer.value) {
      const adminStats = await getAdminStats();
      stats.value = [
        { icon: UsersIcon, label: '用户总数', value: adminStats.totalUsers, trend: 'up', trendText: '平台注册用户数' },
        { icon: UserGroupIcon, label: '制作人数', value: adminStats.totalStudents, trend: 'up', trendText: '购买过课程的用户数' },
        { icon: AcademicCapIcon, label: '教师总数', value: adminStats.totalTeachers, trend: 'up', trendText: '有教师资料的用户数' },
        { icon: BookOpenIcon, label: '课程总数', value: adminStats.totalCourses, trend: 'up', trendText: '已上架课程数' },
        { icon: ClipboardDocumentCheckIcon, label: '总订单数', value: adminStats.totalOrders, trend: 'up', trendText: `已支付 ${adminStats.paidOrderCount} 单` },
        { icon: CurrencyDollarIcon, label: '总流水', value: Math.round(adminStats.totalRevenue / 100), trend: 'up', trendText: '元（含退款）' },
        { icon: PaperClipIcon, label: '待审核课程', value: adminStats.pendingCourses, trend: 'up', trendText: '等待审核' },
        { icon: PaperClipIcon, label: '待审核附件', value: adminStats.pendingAttachments, trend: 'up', trendText: '等待审核' },
      ];

      // 计算平台概况百分比
      const courseRatio = adminStats.totalCourses > 0
        ? Math.round((adminStats.totalCourses / (adminStats.totalCourses + adminStats.pendingCourses || 1)) * 100)
        : 0;
      const teacherRatio = adminStats.totalUsers > 0
        ? Math.min(100, Math.round((adminStats.totalTeachers / adminStats.totalUsers) * 100))
        : 0;
      const payRatio = adminStats.totalOrders > 0
        ? Math.min(100, Math.round((adminStats.paidOrderCount / adminStats.totalOrders) * 100))
        : 0;
      progresses.value = [
        { label: '已上架课程占比', value: courseRatio, unit: '%', percent: courseRatio },
        { label: '教师占用户比例', value: teacherRatio, unit: '%', percent: teacherRatio },
        { label: '支付转化率', value: payRatio, unit: '%', percent: payRatio },
      ];
    }
  } catch {
    // 静默处理加载失败
  }
});

/**
 * 数字格式化
 * 超过 1000 时显示为 k 单位
 *
 * @param n - 原始数字
 * @returns 格式化后的字符串
 */
const formatNumber = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

/**
 * VU 表段状态计算
 * 根据值大小决定每个段是点亮（on）、警告（warn）还是关闭
 *
 * @param stat - 统计项对象，或直接的数值（审核员视图下）
 * @param n - 段序号（1-16）
 * @returns CSS class 名称
 */
const vuMeterClass = (stat: { value: number } | number, n: number) => {
  const value = typeof stat === 'number' ? stat : stat.value;
  const ratio = Math.min(1, value / 50); // 审核员场景下阈值调低（50为最大）
  const threshold = typeof stat === 'number' ? Math.ceil(ratio * 16) : Math.ceil(Math.min(1, value / 500) * 16);
  if (n <= threshold - 4) return 'vu-seg--on';
  if (n <= threshold) return 'vu-seg--warn';
  return '';
};

/**
 * 统计项接口
 */
interface StatItem {
  icon: any;
  label: string;
  value: number;
  trend: string;
  trendText: string;
}

/** 平台基础统计数据（从后端 API 实时获取） */
const stats = ref<StatItem[]>([
  { icon: UsersIcon, label: '用户总数', value: 0, trend: 'up', trendText: '加载中...' },
  { icon: AcademicCapIcon, label: '教师总数', value: 0, trend: 'up', trendText: '加载中...' },
  { icon: BookOpenIcon, label: '课程总数', value: 0, trend: 'up', trendText: '加载中...' },
  { icon: PaperClipIcon, label: '待审核课程', value: 0, trend: 'up', trendText: '加载中...' },
]);

/** 平台概况进度数据（从后端 API 实时计算） */
const progresses = ref([
  { label: '已上架课程占比', value: 0, unit: '%', percent: 0 },
  { label: '教师占用户比例', value: 0, unit: '%', percent: 0 },
  { label: '支付转化率', value: 0, unit: '%', percent: 0 },
]);
</script>

<style scoped>
/* ============================================================
 * AdminDashboard 样式
 * 使用 --va-* 双主题 CSS 变量 + DAW 音乐美学元素
 * ============================================================ */

.admin-dashboard {
  max-width: 1200px;
}

.dashboard-header {
  margin-bottom: 24px;
}
.dashboard-title {
  font-size: 24px;
  font-family: var(--va-font-family);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--va-primary);
}
.dashboard-subtitle {
  font-size: 14px;
  color: var(--va-on-background-element);
  margin: 0;
}

/* ---- 快捷操作面板 ---- */
.quick-panel {
  padding: 24px;
  margin-bottom: 20px;
  background: var(--va-background-element);
  border-color: var(--va-primary-alpha);
  animation: sceneFadeIn 0.5s ease both;
}
.quick-panel__greeting {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--va-block-border);
}
.quick-panel__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--va-primary), var(--va-secondary));
  color: var(--va-background-element);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 0 20px var(--va-primary-alpha);
}
.quick-panel__greeting h3 {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--va-on-background-primary);
  font-weight: 600;
}
.text-muted {
  font-size: 13px;
  color: var(--va-on-background-element);
  margin: 0;
}
.quick-panel__actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--va-background-primary);
  border: 1px solid var(--va-block-border);
  border-radius: 10px;
  text-decoration: none;
  color: var(--va-on-background-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.25s ease;
  cursor: pointer;
}
.quick-action:hover {
  background: var(--va-background-hover);
  color: var(--va-on-background-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px var(--va-primary-alpha);
}
.quick-action__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.quick-action__arrow {
  margin-left: auto;
  font-size: 14px;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}
.quick-action:hover .quick-action__arrow {
  opacity: 1;
  transform: translateX(0);
}
.quick-action__badge {
  margin-left: 0;
}

/* ---- VU 表风格统计卡片 ---- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  padding: 24px;
  position: relative;
  animation: sceneFadeIn 0.5s ease both;
  animation-delay: var(--stat-delay);
}
.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.stat-icon-type {
  width: 24px;
  height: 24px;
  color: var(--va-primary);
}
.stat-value {
  font-size: 36px;
  font-weight: 700;
  font-family: var(--va-font-family);
  color: var(--va-on-background-primary);
  line-height: 1;
  margin-bottom: 8px;
}
.stat-value--urgent {
  color: var(--va-danger);
}
.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}
.stat-trend--up {
  color: var(--va-success);
}
.stat-trend--down {
  color: var(--va-danger);
}
.trend-arrow {
  font-size: 14px;
}

/* ---- 进度 ---- */
.progress-section {
  padding: 24px;
  margin-bottom: 24px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.section-icon {
  width: 22px;
  height: 22px;
  color: var(--va-primary);
}
.section-title {
  font-size: 16px;
  margin: 0;
  color: var(--va-on-background-primary);
}
.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-name {
  font-size: 13px;
  color: var(--va-on-background-secondary);
}
.progress-value {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--va-font-family);
  color: var(--va-on-background-primary);
}
.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--va-background-secondary);
  overflow: hidden;
}
.progress-bar__fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--va-primary), var(--va-success));
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
