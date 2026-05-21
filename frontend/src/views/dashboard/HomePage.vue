<!--
 * HomePage - 公开首页（课程门户）
 *
 * 功能描述：音乐制作教学平台的公开首页，面向未登录访客和已登录制作人。
 *           包含：公告状态栏、Hero 视频背景区、课程分类卡片、热门课程推荐（含 hover 简介浮层）、
 *           「关于我们」讲师介绍、CTA 行动召唤、丰富化页脚（链接+社交媒体）。
 *           导航栏集成全局搜索入口，导师数据由超级管理员在后台配置，视频背景支持后台替换。
 *
 * 设计参考：Vuestic UI 双主题设计体系，个人授课品牌定位
 * 变更说明：
 *   - 所有界面图标从 emoji 替换为 @heroicons/vue 24 outline 风格 SVG 图标
 *   - 业务数据图标（分类图标、导师头像等）使用 SVG 图标替代 emoji
 -->
<template>
  <div class="home-page">
    <!-- ========== 公开顶栏 ========== -->
    <header class="header">
      <div class="header-content">
        <!-- Logo -->
        <router-link to="/" class="header-logo">
          <MusicalNoteIcon class="logo-icon" />
          <span class="logo-text">SoundCraft</span>
        </router-link>

        <!-- 导航 -->
        <nav class="nav">
          <router-link to="/" class="nav-link nav-link--active">首页</router-link>
          <router-link to="/courses" class="nav-link">课程中心</router-link>
          <a href="#about" class="nav-link" @click.prevent="scrollToSection('about')">关于我们</a>

          <!-- 未登录 -->
          <template v-if="!authStore.isLoggedIn">
            <router-link to="/auth/login" class="nav-link">登录</router-link>
            <router-link to="/auth/register" class="nav-btn">免费注册</router-link>
          </template>

          <!-- 已登录 -->
          <template v-if="authStore.isLoggedIn">
            <router-link :to="dashboardLink" class="nav-link nav-link--dashboard">
              {{ dashboardLabel }}
            </router-link>
            <a class="nav-link" @click="handleLogout">退出</a>
          </template>

          <!-- 全局搜索入口 -->
          <div class="nav-search" :class="{ 'nav-search--open': searchOpen }">
            <button
              class="nav-search-btn"
              @click="toggleSearch"
              :title="searchOpen ? '关闭搜索' : '搜索课程'"
            >
              <MagnifyingGlassIcon v-if="!searchOpen" class="nav-search-icon" />
              <span v-else class="nav-search-close">✕</span>
            </button>
            <Transition name="search-expand">
              <input
                v-if="searchOpen"
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="nav-search-input"
                placeholder="搜索课程..."
                @keyup.enter="handleSearch"
                @keyup.escape="closeSearch"
              />
            </transition>
          </div>

          <!-- 主题切换 -->
          <ThemeToggle />
        </nav>
      </div>
    </header>

    <main class="main">
      <!-- ============================================================
       * Section 0: 公告/状态栏
       * ============================================================ -->
      <section v-if="!bannerClosed" class="announcement-bar">
        <div class="announcement-content">
          <MegaphoneIcon class="announcement-icon" />
          <span class="announcement-text">{{ announcementText }}</span>
          <router-link to="/courses" class="announcement-link">查看课程 →</router-link>
          <button class="announcement-close" @click="closeBanner" title="关闭">✕</button>
        </div>
        <div class="resource-tag">
          <GiftIcon class="resource-tag-icon" />
          <span class="resource-tag-text">资源分享</span>
          <span class="resource-tag-badge">即将上线</span>
        </div>
      </section>

      <!-- ========== Section 1: Hero 区（视频背景） ========== -->
      <section class="hero">
        <div class="hero-video-bg">
          <video
            ref="heroVideoRef"
            class="hero-video"
            :src="heroVideoUrl"
            autoplay
            muted
            loop
            playsinline
            preload="auto"
          ></video>
        <div class="hero-video-overlay"></div>
      </div>

      <!-- 动态 EQ 波形层（柱状） -->
      <div class="hero-wave-bg">
        <div class="hero-eq-bars">
          <span v-for="n in 28" :key="n" class="eq-bar" :style="{ '--i': n }"></span>
        </div>
      </div>

      <div class="hero-content">
          <div class="hero-badge badge badge--orange">
            <MusicalNoteIcon class="hero-badge-icon" /> 专业音乐制作教学
          </div>
          <h1 class="hero-title">从零到职业制作人</h1>
          <p class="hero-desc">
            系统化音乐制作课程 · 一对一指导<br>
            跟随资深制作人，掌握编曲、混音、母带全流程技能
          </p>
          <div class="hero-actions">
            <router-link to="/courses" class="btn-primary">
              <SparklesIcon class="btn-icon" /> 探索课程
            </router-link>
            <a href="#about" class="btn-secondary" @click.prevent="scrollToSection('about')">了解讲师</a>
          </div>
        </div>
      </section>

      <!-- ========== Section 2: 课程分类卡片 ========== -->
      <section class="categories-section">
        <div class="section-header">
          <h2 class="section-title gradient-text">探索课程分类</h2>
          <p class="section-subtitle">找到最适合你的学习方向</p>
        </div>

        <div v-if="categoryLoading" class="categories-grid">
          <div v-for="n in 4" :key="n" class="category-card-skeleton">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-cat-title"></div>
            <div class="skeleton skeleton-cat-count"></div>
          </div>
        </div>

        <div v-else class="categories-grid">
          <router-link
            v-for="cat in categories"
            :key="cat.name"
            :to="`/courses?category=${encodeURIComponent(cat.name)}`"
            class="category-card"
          >
            <span class="category-icon" v-html="cat.icon"></span>
            <h3 class="category-name">{{ cat.name }}</h3>
            <span class="category-count">{{ cat.count }} 门课程</span>
          </router-link>
        </div>
      </section>

      <!-- ========== Section 3: 热门课程推荐（含 hover 简介浮层） ========== -->
      <section id="courses" class="courses-section" ref="coursesSectionRef">
        <div class="section-header">
          <h2 class="section-title gradient-text">热门课程</h2>
          <p class="section-subtitle">精选优质课程，助你快速成长</p>
        </div>

        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            class="filter-tab"
            :class="{ 'filter-tab--active': activeFilter === tab.key }"
            @click="activeFilter = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="loading" class="courses-grid">
          <div v-for="n in 4" :key="n" class="course-card-skeleton">
            <div class="skeleton skeleton-cover"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>

        <div v-else-if="filteredCourses.length === 0" class="empty-state">
          <BookOpenIcon class="empty-icon" />
          <span class="empty-text">暂无课程，敬请期待</span>
        </div>

        <div v-else class="courses-grid">
          <router-link
            v-for="course in filteredCourses"
            :key="course.id"
            :to="`/courses/${course.id}`"
            class="course-card card"
          >
            <div class="course-cover">
              <img
                v-if="course.cover"
                :src="course.cover"
                :alt="course.title"
                class="course-cover-img"
              />
              <MusicalNoteIcon v-else class="course-cover-placeholder" />
              <span
                class="course-type-badge badge"
                :class="course.courseType === 'series' ? 'badge--info' : 'badge--success'"
              >
                {{ course.courseType === 'series' ? '系列课' : '单课' }}
              </span>
            </div>
            <div class="course-body">
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-meta">{{ course.studentCount || 0 }} 名制作人已加入</p>
              <div class="course-footer">
                <span class="course-price">{{ course.price > 0 ? `¥${course.price}` : '免费' }}</span>
                <span class="course-rating" v-if="course.rating">
                  <StarIcon class="star-icon" /> {{ course.rating }}
                </span>
              </div>
            </div>

            <div class="course-hover-overlay">
              <p class="course-hover-desc">
                {{ course.description || '暂无课程简介，点击查看详情' }}
              </p>
              <span class="course-hover-cta">查看详情 →</span>
            </div>
          </router-link>
        </div>

        <!-- 加载更多按钮：当课程总数超过已加载数量时显示 -->
        <div v-if="courses.length > 0 && hasMore" class="courses-more">
          <button
            class="btn-text"
            :disabled="loadingMore"
            @click="loadMoreCourses"
          >
            {{ loadingMore ? '加载中...' : '加载更多课程 ↓' }}
          </button>
        </div>
        <!-- 全部加载完毕提示 -->
        <div v-else-if="courses.length > 0 && !hasMore && totalCourses > 12" class="courses-more">
          <span class="courses-more-done">已加载全部 {{ totalCourses }} 门课程</span>
        </div>
      </section>

      <!-- ========== Section 4: 关于我们 — 讲师 IP 展示 ========== -->
      <section id="about" class="about-section" ref="aboutSectionRef">
        <div class="section-header">
          <h2 class="section-title gradient-text">关于我们</h2>
          <p class="section-subtitle">资深音乐制作人倾囊相授，用经验点亮你的创作之路</p>
        </div>

        <div v-if="mentors.length > 0" class="primary-mentor-card">
          <article class="mentor-hero-card card">
            <div class="primary-mentor-avatar-wrap" :class="{ 'primary-mentor-avatar-wrap--female': mentors[0].gender === 'female' }">
              <div class="primary-mentor-avatar-ring">
                <span class="primary-mentor-avatar-emoji" v-html="getAvatarSvg(mentors[0].avatar)"></span>
              </div>
              <div class="primary-mentor-avatar-glow"></div>
            </div>

            <div class="primary-mentor-info">
              <div class="primary-mentor-badges">
                <span class="badge badge--orange">
                  <AcademicCapIcon class="badge-icon" /> 创始人 / 主讲师
                </span>
                <span class="badge" :class="mentorRoleBadge(mentors[0])">{{ mentors[0].role }}</span>
              </div>
              <h3 class="primary-mentor-name">{{ mentors[0].name }}</h3>
              <p class="primary-mentor-bio">{{ mentors[0].bio }}</p>

              <div v-if="mentors[0].skills?.length" class="primary-mentor-skills">
                <span
                  v-for="skill in mentors[0].skills"
                  :key="skill"
                  class="mentor-skill-tag"
                >{{ skill }}</span>
              </div>

              <div class="primary-mentor-stats">
                <div class="primary-mentor-stat">
                  <span class="primary-mentor-stat-value">{{ mentors[0].years }}+</span>
                  <span class="primary-mentor-stat-label">年经验</span>
                </div>
                <div class="primary-mentor-stat">
                  <span class="primary-mentor-stat-value">{{ mentors[0].courses }}</span>
                  <span class="primary-mentor-stat-label">门课程</span>
                </div>
                <div class="primary-mentor-stat">
                  <span class="primary-mentor-stat-value">{{ mentors[0].students }}+</span>
                  <span class="primary-mentor-stat-label">制作人</span>
                </div>
              </div>

              <div v-if="mentors[0].social?.length" class="mentor-socials">
                <a
                  v-for="s in mentors[0].social"
                  :key="s.label"
                  :href="s.url"
                  :title="s.label"
                  class="mentor-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                ><span v-html="s.icon"></span></a>
              </div>
            </div>
          </article>
        </div>

        <div v-if="mentors.length > 1" class="secondary-mentors-grid">
          <article
            v-for="mentor in mentors.slice(1)"
            :key="mentor.name"
            class="secondary-mentor-card card"
          >
            <div class="secondary-mentor-avatar-wrap" :class="{ 'secondary-mentor-avatar-wrap--female': mentor.gender === 'female' }">
              <div class="secondary-mentor-avatar-ring">
                <span class="secondary-mentor-avatar-emoji" v-html="getAvatarSvg(mentor.avatar)"></span>
              </div>
              <div class="secondary-mentor-avatar-glow"></div>
            </div>

            <div class="secondary-mentor-info">
              <h3 class="secondary-mentor-name">{{ mentor.name }}</h3>
              <p class="badge" :class="mentorRoleBadge(mentor)">{{ mentor.role }}</p>
              <p class="secondary-mentor-bio">{{ mentor.bio }}</p>

              <div v-if="mentor.skills?.length" class="mentor-skills">
                <span
                  v-for="skill in mentor.skills"
                  :key="skill"
                  class="mentor-skill-tag"
                >{{ skill }}</span>
              </div>

              <div class="secondary-mentor-stats">
                <div class="secondary-mentor-stat">
                  <span class="secondary-mentor-stat-value">{{ mentor.years }}+</span>
                  <span class="secondary-mentor-stat-label">年经验</span>
                </div>
                <div class="secondary-mentor-stat">
                  <span class="secondary-mentor-stat-value">{{ mentor.courses }}</span>
                  <span class="secondary-mentor-stat-label">门课程</span>
                </div>
                <div class="secondary-mentor-stat">
                  <span class="secondary-mentor-stat-value">{{ mentor.students }}+</span>
                  <span class="secondary-mentor-stat-label">制作人</span>
                </div>
              </div>

              <div v-if="mentor.social?.length" class="mentor-socials">
                <a
                  v-for="s in mentor.social"
                  :key="s.label"
                  :href="s.url"
                  :title="s.label"
                  class="mentor-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                ><span v-html="s.icon"></span></a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- ========== Section 5: CTA 行动召唤 ========== -->
      <section class="cta-section">
        <div class="cta-card">
          <div class="cta-content">
            <h2 class="cta-title">准备好开启你的音乐制作之旅了吗？</h2>
            <p class="cta-desc">加入数百位制作人，系统化提升你的音乐制作技能</p>
            <div class="cta-actions">
              <router-link v-if="!authStore.isLoggedIn" to="/auth/register" class="btn-primary">
                <RocketLaunchIcon class="btn-icon" /> 立即加入
              </router-link>
              <router-link v-else to="/courses" class="btn-primary">
                <SparklesIcon class="btn-icon" /> 探索课程
              </router-link>
              <a href="#courses" class="btn-secondary" @click.prevent="scrollToSection('courses')">
                浏览热门课程
              </a>
            </div>
          </div>
          <div class="cta-decoration">
            <MusicalNoteIcon class="cta-emojii" />
          </div>
        </div>
      </section>
    </main>

    <!-- ========== 页脚 ========== -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <MusicalNoteIcon class="footer-logo" />
          <span class="footer-name">SoundCraft</span>
          <span class="footer-tagline">专业音乐制作教学平台</span>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">快速链接</h4>
          <router-link to="/courses" class="footer-link">课程中心</router-link>
          <a href="#about" class="footer-link" @click.prevent="scrollToSection('about')">关于我们</a>
          <router-link v-if="!authStore.isLoggedIn" to="/auth/register" class="footer-link">免费注册</router-link>
          <router-link
            v-if="authStore.isLoggedIn"
            :to="dashboardLink"
            class="footer-link"
          >{{ dashboardLabel }}</router-link>
        </div>

        <div class="footer-col">
          <h4 class="footer-col-title">关注我们</h4>
          <div class="footer-socials">
            <a href="#" class="footer-social-link" title="B站" target="_blank" rel="noopener noreferrer">
              <VideoCameraIcon class="social-icon" />
            </a>
            <a href="#" class="footer-social-link" title="微博" target="_blank" rel="noopener noreferrer">
              <ChatBubbleLeftRightIcon class="social-icon" />
            </a>
            <a href="#" class="footer-social-link" title="网易云音乐" target="_blank" rel="noopener noreferrer">
              <MusicalNoteIcon class="social-icon" />
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span class="footer-copy">&copy; {{ new Date().getFullYear() }} SoundCraft. All rights reserved.</span>
      </div>
    </footer>

    <!-- 回到顶部按钮 - 基于 window 滚动 -->
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { getPublishedCourses, getCategories } from '../../api/course';
import type { CourseInfo, PaginationMeta } from '../../api/course';
import ThemeToggle from '../../components/ThemeToggle.vue';
import BackToTop from '../../components/BackToTop.vue';

import {
  MusicalNoteIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  GiftIcon,
  SparklesIcon,
  BookOpenIcon,
  StarIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline';

/** 音乐主题分类 SVG 图标映射 */
const categorySvgIcons: Record<string, string> = {
  '电子音乐': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  '编曲': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  '混音': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M8 9h8"/><path d="M6 13h12"/><path d="M4 17h16"/></svg>`,
  '母带': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>`,
  'Beat制作': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  '流行音乐': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  '嘻哈': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16L9 9l3 3-7 7"/><circle cx="18" cy="8" r="4"/><path d="M18 12v8"/></svg>`,
  '影视配乐': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`,
  '声乐': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M12 20v3"/></svg>`,
  '默认': `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
};

/** 默认分类 SVG 图标（电子音乐/编曲混音/Beat制作/声乐演唱） */
const defaultCategorySvgIcons: string[] = [
  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12v8"/><path d="M8 16h8"/><rect x="2" y="6" width="20" height="8" rx="2"/></svg>`,
  `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M12 20v3"/></svg>`,
];

/**
 * 获取导师头像 SVG
 * @param type - 头像类型标识
 * @returns SVG 字符串
 */
function getAvatarSvg(type: string): string {
  const svgMap: Record<string, string> = {
    'piano': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v12"/><path d="M10 4v12"/><path d="M14 4v12"/><path d="M18 4v12"/></svg>`,
    'mic': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M12 20v3"/></svg>`,
    'headphone': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  };
  return svgMap[type] || svgMap['piano'];
}

/**
 * 获取社交图标 SVG
 * @param type - 社交平台类型
 * @returns SVG 字符串
 */
function getSocialSvg(type: string): string {
  const svgMap: Record<string, string> = {
    'weibo': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.98 5.83c.37 0 .66.3.66.66 0 .37-.3.66-.66.66-1.09 0-1.97.88-1.97 1.97 0 .36-.3.66-.66.66s-.66-.3-.66-.66c0-1.82 1.48-3.3 3.3-3.3z"/><path d="M13.75 3.24c-2.55 0-4.62 2.07-4.62 4.62 0 .37.3.66.66.66s.66-.3.66-.66c0-1.82 1.48-3.3 3.3-3.3.37 0 .66-.3.66-.66s-.29-.66-.66-.66zM20.76 7.76c-1.41-1.58-3.51-2.56-5.79-2.69-.37-.02-.67.25-.7.62-.02.37.25.67.62.7 1.93.11 3.71.93 4.92 2.26 1.1 1.22 1.72 2.74 1.72 4.34 0 .37.3.66.66.66s.66-.3.66-.66c0-1.88-.73-3.71-2.09-5.23z"/><path d="M19.35 10.92c-.97 0-1.75.79-1.75 1.75 0 .37.3.66.66.66s.66-.3.66-.66c0-.24.19-.44.44-.44.23 0 .41.2.41.44 0 .37.3.66.66.66s.66-.3.66-.66c0-.97-.79-1.75-1.74-1.75z"/><path d="M5.72 11.5c-1.97.85-3.72 2.03-3.72 3.61 0 3.1 4.12 5.62 9.2 5.62s9.2-2.52 9.2-5.62c0-1.78-2.03-3.33-4.66-4.3-.38-.14-.8.07-.94.45-.14.38.07.8.45.94 2.21.83 3.85 2.05 3.85 2.91 0 2.08-3.4 4.31-7.9 4.31s-7.9-2.23-7.9-4.31c0-.86 1.63-2.08 3.85-2.91.38-.14.59-.56.45-.94-.14-.38-.56-.59-.94-.45z"/></svg>`,
    'bilibili': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.562 3.76v7.36c-.038 1.51-.558 2.765-1.562 3.761s-2.263 1.52-3.773 1.574H5.333c-1.51-.054-2.769-.578-3.773-1.574C.556 20.112.036 18.858-.002 17.347v-7.36c.038-1.511.558-2.765 1.562-3.76C1.564 5.23 2.824 4.707 4.333 4.653h.854l1.6-1.707L8.267 1.28c.49-.427 1.024-.64 1.6-.64.576 0 1.108.213 1.6.64l1.28 1.386 1.706 1.987h1.387zM10.24 6.46c-.32 0-.533.106-.64.32-.107.214-.16.48-.16.8v2.773c0 .32.053.586.16.8.107.214.32.32.64.32.32 0 .533-.106.64-.32.107-.214.16-.48.16-.8V7.58c0-.32-.053-.586-.16-.8-.107-.214-.32-.32-.64-.32zm3.52 0c-.32 0-.533.106-.64.32-.107.214-.16.48-.16.8v2.773c0 .32.053.586.16.8.107.214.32.32.64.32.32 0 .533-.106.64-.32.107-.214.16-.48.16-.8V7.58c0-.32-.053-.586-.16-.8-.107-.214-.32-.32-.64-.32z"/></svg>`,
    'netease': `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.243 17.002c.295-.412.524-.862.686-1.338-.076-2.006-.419-4.72-1.227-5.734-.551-.694-1.382-1.518-2.579-2.077-1.025-.477-2.333-.67-3.85-.391-1.093.203-1.753.714-2.018 1.165-.227.387-.19.754.069.997.322.302.797.26 1.044.047.343-.295.918-.637 1.797-.812 1.257-.249 2.312-.115 3.045.255 1.022.517 1.532 1.41 1.832 2.42.227.76.333 1.681.368 2.818a5.202 5.202 0 0 1-1.86 4.088c-1.457 1.322-3.127 2.044-5.222 1.888-1.942-.146-3.469-.896-4.464-2.21-1.046-1.383-1.366-3.002-.892-4.481.061-.188.136-.375.225-.564.013-.03.088-.198-.022-.406-.093-.179-.308-.283-.578-.283-.287 0-.53.12-.7.327a5.14 5.14 0 0 0-.513.772c-.678 1.422-.732 3.259-.05 4.916.821 1.994 2.604 3.324 4.676 3.719a9.26 9.26 0 0 0 1.777.174c2.656 0 5.145-1.125 7.003-2.915.426-.41.802-.857 1.122-1.336l.134-.218.106.127.085.087.053.03c.099.06.2.078.292.016.086-.058.114-.17.065-.3-.046-.122-.125-.215-.211-.257zm-3.378-5.114c.176.22.2.556-.015.802-.216.245-.493.302-.583.413-.089.112-.066.336.053.504.047.067.132.151.256.24.32.229.743.128.924-.093.154-.188.498-.614.577-1.002.08-.387-.079-.637-.199-.804l.064-.047c.138-.103.31-.24.446-.422.244-.325.36-.678.2-.895-.16-.218-.492-.163-.752.011-.06.04-.12.084-.173.128-.174.145-.306.284-.386.323.035-.012.078-.02.115-.033.187-.067.348-.18.361-.34.013-.16-.125-.305-.309-.323-.38-.037-.547.382-.612.664-.072.313.083.653.302.848z"/></svg>`,
  };
  return svgMap[type] || svgMap['weibo'];
}

const router = useRouter();
const authStore = useAuthStore();

const bannerClosed = ref(false);
const announcementText = ref('最新课程已上线，快来探索吧！');

const closeBanner = () => {
  bannerClosed.value = true;
  try {
    localStorage.setItem('soundcraft_banner_closed_at', String(Date.now()));
  } catch {
    // localStorage 不可用时静默降级
  }
};

const checkBannerExpiry = () => {
  try {
    const closedAt = localStorage.getItem('soundcraft_banner_closed_at');
    if (closedAt) {
      const elapsed = Date.now() - Number(closedAt);
      if (elapsed < 24 * 60 * 60 * 1000) {
        bannerClosed.value = true;
      } else {
        localStorage.removeItem('soundcraft_banner_closed_at');
      }
    }
  } catch {
    // localStorage 不可用时静默降级
  }
};

const heroVideoRef = ref<HTMLVideoElement | null>(null);
void heroVideoRef;

const heroVideoUrl = ref('/videos/hero-bg.mp4');

const categoryLoading = ref(true);

const categories = ref<{ name: string; icon: string; count: number }[]>([]);

const defaultCategories = [
  { name: '电子音乐', icon: defaultCategorySvgIcons[0], count: 0 },
  { name: '编曲混音', icon: defaultCategorySvgIcons[1], count: 0 },
  { name: 'Beat制作', icon: defaultCategorySvgIcons[2], count: 0 },
  { name: '声乐演唱', icon: defaultCategorySvgIcons[3], count: 0 },
];

const courses = ref<CourseInfo[]>([]);
const loading = ref(true);

const filterTabs = ref([
  { key: 'all', label: '全部' },
]);
const activeFilter = ref('all');

const filteredCourses = computed(() => {
  if (activeFilter.value === 'all') return courses.value;
  return courses.value.filter(c => {
    const catName = typeof c.category === 'object' && c.category ? c.category.name : c.category;
    return catName === activeFilter.value;
  });
});

const mentors = ref([
  {
    name: '陈彦锜',
    avatar: 'piano',
    role: '资深音乐制作人',
    roleType: 'orange',
    gender: 'male',
    bio: '拥有 12 年音乐制作经验，曾为多位知名艺人制作专辑，擅长电子音乐、影视配乐。致力于用系统化的教学方式帮助每位制作人从入门到精通。',
    skills: ['编曲', '混音', '母带', '影视配乐', '电子音乐'],
    years: 12,
    courses: 36,
    students: 800,
    social: [
      { label: '微博', icon: getSocialSvg('weibo'), url: '#' },
      { label: 'B站', icon: getSocialSvg('bilibili'), url: '#' },
    ],
  },
  {
    name: '林雪霏',
    avatar: 'mic',
    role: '声乐导师·词曲创作人',
    roleType: 'primary',
    gender: 'female',
    bio: '专业声乐教练，擅长流行与 R&B 唱法教学，已帮助数百位学员突破唱歌瓶颈。',
    skills: ['声乐', '发声训练', '流行', 'R&B', '词曲创作'],
    years: 8,
    courses: 22,
    students: 500,
    social: [
      { label: '微博', icon: getSocialSvg('weibo'), url: '#' },
      { label: '网易云', icon: getSocialSvg('netease'), url: '#' },
    ],
  },
  {
    name: '赵一凡',
    avatar: 'headphone',
    role: '混音工程师',
    roleType: 'info',
    gender: 'male',
    bio: '专业混音工作室主理人，擅长各类风格的分轨混音，作品多次登上热歌榜。',
    skills: ['混音', '母带', '后期处理', '现场调音'],
    years: 10,
    courses: 18,
    students: 320,
    social: [{ label: 'B站', icon: getSocialSvg('bilibili'), url: '#' }],
  },
]);

const mentorRoleBadge = (mentor: (typeof mentors.value)[number]) => {
  const map: Record<string, string> = {
    primary: 'badge--primary',
    orange: 'badge--orange',
    success: 'badge--success',
    info: 'badge--info',
    warning: 'badge--warning',
  };
  return map[mentor.roleType] || 'badge--orange';
};

const dashboardLink = computed(() => {
  if (authStore.isAdmin || authStore.isSuperAdmin) return '/admin/dashboard';
  if (authStore.isTeacher) return '/teacher/courses';
  return '/producer/my-courses';
});

const dashboardLabel = computed(() => {
  if (authStore.isAdmin || authStore.isSuperAdmin) return '管理后台';
  if (authStore.isTeacher) return '教学中心';
  return '学习空间';
});

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

const searchOpen = ref(false);
const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

const toggleSearch = () => {
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) {
    setTimeout(() => {
      searchInputRef.value?.focus();
    }, 150);
  }
};

const closeSearch = () => {
  searchOpen.value = false;
  searchQuery.value = '';
};

const handleSearch = () => {
  const keyword = searchQuery.value.trim();
  if (keyword) {
    router.push(`/courses?keyword=${encodeURIComponent(keyword)}`);
    closeSearch();
  }
};

const aboutSectionRef = ref<HTMLElement | null>(null);
void aboutSectionRef;

const coursesSectionRef = ref<HTMLElement | null>(null);
void coursesSectionRef;

const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/** 分页状态：当前页码 */
const currentPage = ref(1);
/** 分页状态：课程总数（来自后端 meta） */
const totalCourses = ref(0);
/** 分页状态：是否正在加载更多 */
const loadingMore = ref(false);
/** 分页状态：是否还有更多课程可加载 */
const hasMore = computed(() => courses.value.length < totalCourses.value);

/**
 * 加载首页数据（分类 + 课程列表）
 * 功能描述：独立获取分类数据（不受分页影响），分页获取课程列表
 */
async function loadHomePageData() {
  try {
    // 并行加载分类和课程列表
    const [categoriesRes, coursesRes] = await Promise.all([
      getCategories().catch(() => null),
      getPublishedCourses({ status: 'approved', page: 1, pageSize: 12 }),
    ]);

    // ---- 处理分类数据 ----
    const categoriesData = ((categoriesRes as any)?.data ?? categoriesRes) as any[];
    if (categoriesData && categoriesData.length > 0) {
      categories.value = categoriesData.map((cat: any) => ({
        name: cat.name,
        icon: categorySvgIcons[cat.name] || categorySvgIcons['默认'],
        count: 0, // 分类API不返回课程数，从课程列表推断
      }));
      // 从已加载的课程中统计分类课程数
      const coursesData = ((coursesRes as any)?.data ?? coursesRes) as { items?: CourseInfo[] };
      const items = coursesData?.items ?? [];
      const countMap = new Map<string, number>();
      for (const c of items) {
        if (c.category) {
          const catName = typeof c.category === 'object' && c.category ? c.category.name : c.category;
          countMap.set(catName, (countMap.get(catName) || 0) + 1);
        }
      }
      categories.value = categories.value.map(cat => ({
        ...cat,
        count: countMap.get(cat.name) || 0,
      }));
    } else {
      categories.value = defaultCategories;
    }

    // ---- 处理课程列表数据 ----
    const coursesData = ((coursesRes as any)?.data ?? coursesRes) as { items?: CourseInfo[]; meta?: PaginationMeta };
    const allCourses: CourseInfo[] = coursesData?.items ?? [];
    const meta = coursesData?.meta;

    // 保存分页信息
    totalCourses.value = meta?.total ?? allCourses.length;

    // 排序：推荐的课程优先展示，再按创建时间降序排列
    const sorted = [...allCourses].sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) {
        return a.isRecommended ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    // 限制展示前6条（视觉上更整齐）
    courses.value = sorted.slice(0, 6);

    // 构建筛选标签（基于所有分类）
    buildFilterTabs(categoriesData);

    // 更新公告栏
    if (allCourses.length > 0) {
      announcementText.value = `最新课程「${allCourses[0].title}」已上线`;
    }
  } catch {
    courses.value = [];
    categories.value = defaultCategories;
  } finally {
    loading.value = false;
    categoryLoading.value = false;
  }
}

/**
 * 加载更多课程
 * 功能描述：点击"加载更多"按钮时，请求下一页课程数据并追加到当前列表
 */
async function loadMoreCourses() {
  if (loadingMore.value) return;
  loadingMore.value = true;
  try {
    const nextPage = currentPage.value + 1;
    const res = await getPublishedCourses({ status: 'approved', page: nextPage, pageSize: 12 });
    const data = (res as any)?.data ?? res;
    const newCourses: CourseInfo[] = data?.items ?? [];
    const meta = data?.meta as PaginationMeta | undefined;

    // 追加到现有课程列表
    courses.value = [...courses.value, ...newCourses];
    currentPage.value = nextPage;

    // 更新总数
    if (meta?.total !== undefined) {
      totalCourses.value = meta.total;
    }
  } catch {
    // 加载更多失败时静默处理，用户可再次点击
  } finally {
    loadingMore.value = false;
  }
}

/**
 * 构建分类卡片数据
 * @param categoriesData - 从分类API获取的原始分类数据
 */
function buildCategories(categoriesData: any) {
  // 不再使用此函数，分类数据在 loadHomePageData 中直接处理
}

/**
 * 构建筛选标签
 * @param categoriesData - 从分类API获取的原始分类数据
 */
function buildFilterTabs(categoriesData: any) {
  if (categoriesData && categoriesData.length > 0) {
    filterTabs.value = [
      { key: 'all', label: '全部' },
      ...categoriesData.map((cat: any) => ({
        key: cat.name,
        label: cat.name,
      })),
    ];
  } else {
    filterTabs.value = [{ key: 'all', label: '全部' }];
  }
}

onMounted(async () => {
  checkBannerExpiry();

  // 在数据加载前先检查路由 hash，若有锚点则立即执行平滑滚动
  // #about 和 #courses 区域是静态渲染的，不等 API 完成
  nextTick(() => {
    const routeHash = window.location.hash;
    if (routeHash) {
      const sectionId = routeHash.replace('#', '');
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  await loadHomePageData();

  // 数据加载完成后检查路由 hash，若有锚点则执行平滑滚动
  const routeHash = window.location.hash;
  if (routeHash) {
    const sectionId = routeHash.replace('#', '');
    const el = document.getElementById(sectionId);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--va-background-secondary);
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--va-topbar-background);
  backdrop-filter: blur(12px);
  border-bottom: var(--va-block-border);
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.logo-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--va-primary);
}
.logo-text {
  font-family: var(--va-font-family);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
}
.nav {
  display: flex;
  gap: 8px;
  align-items: center;
}
.nav-link {
  color: var(--va-on-background-secondary);
  text-decoration: none;
  font-size: 0.875rem;
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
.nav-link--dashboard {
  color: var(--va-primary);
  border: 1px solid var(--va-background-border);
}
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

.nav-search {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0 4px;
}
.nav-search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--va-square-border-radius);
  background: transparent;
  color: var(--va-on-background-secondary);
  cursor: pointer;
  font-size: 1rem;
  transition: var(--va-transition);
  flex-shrink: 0;
}
.nav-search-btn:hover {
  background: var(--va-background-hover);
  color: var(--va-on-background-primary);
}
.nav-search--open .nav-search-btn {
  color: var(--va-primary);
  background: var(--va-primary-alpha);
}
.nav-search-icon {
  width: 18px;
  height: 18px;
}
.nav-search-input {
  width: 200px;
  padding: 6px 12px;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  background: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  outline: none;
  transition: var(--va-transition);
}
.nav-search-input::placeholder {
  color: var(--va-on-background-element);
}
.nav-search-input:focus {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
}

.search-expand-enter-active,
.search-expand-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}
.search-expand-enter-from {
  width: 0;
  opacity: 0;
}
.search-expand-leave-to {
  width: 0;
  opacity: 0;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.announcement-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0 0;
  padding: 10px 20px;
  background: var(--va-primary-alpha);
  border: 1px solid var(--va-primary-lighten);
  border-radius: var(--va-block-border-radius);
  gap: 16px;
  flex-wrap: wrap;
}
.announcement-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.announcement-icon {
  width: 1rem;
  height: 1rem;
  color: var(--va-primary);
  flex-shrink: 0;
}
.announcement-text {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  font-weight: 500;
}
.announcement-link {
  font-size: 0.8125rem;
  color: var(--va-primary);
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
}
.announcement-link:hover {
  text-decoration: underline;
}
.announcement-close {
  background: none;
  border: none;
  color: var(--va-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  flex-shrink: 0;
  transition: var(--va-transition);
}
.announcement-close:hover {
  color: var(--va-on-background-primary);
}
.resource-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: 20px;
  flex-shrink: 0;
  cursor: default;
}
.resource-tag-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--va-primary);
}
.resource-tag-text {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  font-weight: 500;
}
.resource-tag-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--va-background-element);
  color: var(--va-muted);
}

.hero {
  position: relative;
  text-align: center;
  padding: 100px 24px 80px;
  margin: 24px 0 64px;
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
  background: linear-gradient(135deg,
    #F5F8FF 0%,
    #F0F5FF 50%,
    #F8FAFF 100%);
}
[data-theme="dark"] .hero {
  background: linear-gradient(135deg,
    #1A2A4A 0%,
    #223D6A 40%,
    #1E3460 60%,
    #182A50 100%);
}
.hero-video-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
}
.hero-video-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(238,244,255,0.6) 0%,
    rgba(230,239,254,0.3) 50%,
    rgba(238,244,255,0.6) 100%
  );
}
[data-theme="dark"] .hero-video-overlay {
  background: linear-gradient(
    135deg,
    rgba(26,42,74,0.5) 0%,
    rgba(34,61,106,0.3) 50%,
    rgba(26,42,74,0.5) 100%
  );
}

/* 动态 EQ 波形层 - 仿登录页底部波形，每根柱独立上下波动 */
.hero-wave-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.15;
}

.hero-eq-bars {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 55%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  padding: 0 8%;
}

.eq-bar {
  display: block;
  width: 5%;
  max-width: 24px;
  min-width: 8px;
  border-radius: 3px 3px 0 0;
  background: linear-gradient(to top, var(--va-primary), rgba(0, 196, 255, 0.3));
  animation: waveHeight 1.6s ease-in-out infinite alternate;
  animation-delay: calc(var(--i) * 0.08s);
  animation-duration: calc(1.4s + (var(--i) * 0.04s));
  height: var(--bar-h);
}

/* 每根柱不同的基座高度 - 通过 CSS 变量设置 */
.eq-bar:nth-child(1)  { --bar-h: 35%; } .eq-bar:nth-child(2)  { --bar-h: 55%; }
.eq-bar:nth-child(3)  { --bar-h: 25%; } .eq-bar:nth-child(4)  { --bar-h: 70%; }
.eq-bar:nth-child(5)  { --bar-h: 40%; } .eq-bar:nth-child(6)  { --bar-h: 60%; }
.eq-bar:nth-child(7)  { --bar-h: 30%; } .eq-bar:nth-child(8)  { --bar-h: 75%; }
.eq-bar:nth-child(9)  { --bar-h: 45%; } .eq-bar:nth-child(10) { --bar-h: 50%; }
.eq-bar:nth-child(11) { --bar-h: 35%; } .eq-bar:nth-child(12) { --bar-h: 65%; }
.eq-bar:nth-child(13) { --bar-h: 20%; } .eq-bar:nth-child(14) { --bar-h: 55%; }
.eq-bar:nth-child(15) { --bar-h: 40%; } .eq-bar:nth-child(16) { --bar-h: 70%; }
.eq-bar:nth-child(17) { --bar-h: 30%; } .eq-bar:nth-child(18) { --bar-h: 60%; }
.eq-bar:nth-child(19) { --bar-h: 45%; } .eq-bar:nth-child(20) { --bar-h: 50%; }
.eq-bar:nth-child(21) { --bar-h: 25%; } .eq-bar:nth-child(22) { --bar-h: 65%; }
.eq-bar:nth-child(23) { --bar-h: 35%; } .eq-bar:nth-child(24) { --bar-h: 75%; }
.eq-bar:nth-child(25) { --bar-h: 40%; } .eq-bar:nth-child(26) { --bar-h: 55%; }
.eq-bar:nth-child(27) { --bar-h: 30%; } .eq-bar:nth-child(28) { --bar-h: 60%; }

@keyframes waveHeight {
  0% {
    height: calc(var(--bar-h) * 0.55);
  }
  100% {
    height: calc(var(--bar-h) * 1.05);
  }
}
.hero-content {
  position: relative;
  z-index: 1;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
}
.hero-badge-icon {
  width: 1rem;
  height: 1rem;
}
.hero-title {
  font-family: var(--va-font-family);
  font-size: 2.75rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0 0 16px;
  line-height: 1.15;
}
[data-theme="dark"] .hero-title {
  color: #F1F5F9;
  text-shadow: 0 2px 20px rgba(0,0,0,0.4);
}
.hero-desc {
  font-size: 1.125rem;
  color: var(--va-on-background-secondary);
  margin: 0 0 40px;
  line-height: 1.7;
}
[data-theme="dark"] .hero-desc {
  color: rgba(203,213,225,0.9);
}
.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
.hero .btn-secondary {
  color: var(--va-on-background-primary);
  background: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
}
.hero .btn-secondary:hover {
  background: var(--va-background-secondary);
  color: var(--va-on-background-primary);
}
[data-theme="dark"] .hero .btn-secondary {
  color: rgba(241,245,249,0.9);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.25);
}
[data-theme="dark"] .hero .btn-secondary:hover {
  background: rgba(255,255,255,0.15);
  color: #FFFFFF;
}
.btn-icon {
  width: 1rem;
  height: 1rem;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-primary);
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
  border: none;
  border-radius: var(--va-square-border-radius);
  text-decoration: none;
  cursor: pointer;
  transition: var(--va-swing-transition);
}
[data-theme="dark"] .btn-primary {
  background: var(--va-primary-darken);
}
.btn-primary:hover {
  box-shadow: 0 6px 24px var(--va-primary-alpha);
  transform: translateY(-1px);
  color: var(--va-on-primary);
}
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  background: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  text-decoration: none;
  cursor: pointer;
  transition: var(--va-swing-transition);
}
.btn-secondary:hover {
  background: var(--va-background-secondary);
}

.categories-section {
  margin-bottom: 80px;
}
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 1.5rem 1rem;
  background: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  text-decoration: none;
  transition: var(--va-swing-transition);
  cursor: pointer;
}
.category-card:hover {
  box-shadow: var(--va-box-shadow);
  transform: translateY(-2px);
  border-color: var(--va-primary);
}
.category-icon {
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--va-primary);
}
.category-icon svg {
  width: 1.75rem;
  height: 1.75rem;
}
.category-name {
  font-family: var(--va-font-family);
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0;
}
.category-count {
  font-size: 0.8125rem;
  color: var(--va-muted);
}
.category-card-skeleton {
  background: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.skeleton-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.skeleton-cat-title {
  width: 60%;
  height: 18px;
  border-radius: var(--va-square-border-radius);
}
.skeleton-cat-count {
  width: 40%;
  height: 14px;
  border-radius: var(--va-square-border-radius);
}

.courses-section {
  margin-bottom: 80px;
}
.section-header {
  text-align: center;
  margin-bottom: 32px;
}
.section-title {
  font-family: var(--va-font-family);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0 0 8px;
}
.gradient-text {
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.section-subtitle {
  font-size: 0.9375rem;
  color: var(--va-on-background-secondary);
  margin: 0;
}
.filter-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.filter-tab {
  padding: 6px 18px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  background: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: 20px;
  cursor: pointer;
  transition: var(--va-transition);
}
.filter-tab:hover {
  border-color: var(--va-primary);
  color: var(--va-primary);
}
.filter-tab--active {
  background: var(--va-primary-alpha);
  color: var(--va-primary);
  border-color: var(--va-primary);
}
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.course-card {
  position: relative;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  overflow: hidden;
  transition: var(--va-swing-transition);
}
.course-card:hover {
  box-shadow: var(--va-box-shadow);
  transform: translateY(-2px);
}
.course-cover {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, var(--va-background-element), var(--va-background-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.course-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.course-cover-placeholder {
  width: 3rem;
  height: 3rem;
  opacity: 0.4;
  color: var(--va-on-background-primary);
}
.course-type-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}
.course-body {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.course-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.course-meta {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  margin: 0 0 12px;
}
.course-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.course-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--va-primary);
}
.course-rating {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.8125rem;
  color: var(--va-warning);
}
.star-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--va-warning);
}
.course-hover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.85);
  color: #F1F5F9;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 5;
}
.course-card:hover .course-hover-overlay {
  opacity: 1;
}
.course-hover-desc {
  font-size: 0.8125rem;
  line-height: 1.6;
  text-align: center;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.course-hover-cta {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-primary-lighten);
  letter-spacing: 0.3px;
}
.courses-more {
  text-align: center;
  margin-top: 32px;
}
.btn-text {
  font-size: 0.9375rem;
  color: var(--va-primary);
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: var(--va-transition);
}
.btn-text:hover {
  color: var(--va-primary-lighten);
}
.btn-text:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.courses-more-done {
  font-size: 0.8125rem;
  color: var(--va-muted);
}
.course-card-skeleton {
  background: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
  padding: 0;
}
.skeleton {
  background: linear-gradient(90deg,
    var(--va-background-element) 25%,
    var(--va-background-secondary) 50%,
    var(--va-background-element) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}
.skeleton-cover { height: 160px; }
.skeleton-title {
  height: 20px;
  margin: 1rem 1rem 8px;
  border-radius: var(--va-square-border-radius);
}
.skeleton-text {
  height: 14px;
  margin: 0 1rem 1rem;
  width: 60%;
  border-radius: var(--va-square-border-radius);
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: var(--va-muted);
}
.empty-icon { width: 3rem; height: 3rem; opacity: 0.5; margin-bottom: 0.75rem; }
.empty-text { font-size: 0.875rem; }

.about-section {
  margin-bottom: 80px;
}
.primary-mentor-card {
  margin-bottom: 32px;
}
.mentor-hero-card {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  padding: 2rem 2.5rem;
  transition: var(--va-swing-transition);
}
.mentor-hero-card:hover {
  box-shadow: var(--va-box-shadow);
  transform: translateY(-2px);
}
.primary-mentor-avatar-wrap {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.primary-mentor-avatar-ring {
  position: relative;
  z-index: 2;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--va-primary), #00c4ff, var(--va-primary), #00c4ff);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: mentorRingSpin 6s linear infinite;
}
.primary-mentor-avatar-wrap--female .primary-mentor-avatar-ring {
  background: conic-gradient(from 0deg, #e040fb, #ff80ab, #e040fb, #ff80ab);
}
.primary-mentor-avatar-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: var(--va-background-primary);
  position: relative;
  z-index: 3;
  color: var(--va-primary);
}
.primary-mentor-avatar-emoji svg {
  width: 2.5rem;
  height: 2.5rem;
}
.primary-mentor-avatar-glow {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--va-primary-alpha) 0%, transparent 70%);
  animation: pulseGlow 2.5s ease-in-out infinite;
  pointer-events: none;
}
.primary-mentor-avatar-wrap--female .primary-mentor-avatar-glow {
  background: radial-gradient(circle, rgba(224,64,251,0.18) 0%, transparent 70%);
}
.primary-mentor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.primary-mentor-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.badge-icon {
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 2px;
}
.primary-mentor-name {
  font-family: var(--va-font-family);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}
.primary-mentor-bio {
  font-size: 0.9375rem;
  color: var(--va-on-background-secondary);
  line-height: 1.7;
  margin: 0;
  max-width: 560px;
}
.primary-mentor-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.primary-mentor-stats {
  display: flex;
  gap: 2rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--va-background-element);
}
.primary-mentor-stat {
  text-align: center;
}
.primary-mentor-stat-value {
  display: block;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--va-primary);
}
.primary-mentor-stat-label {
  font-size: 0.75rem;
  color: var(--va-muted);
}

.secondary-mentors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.secondary-mentor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.75rem 1.5rem;
  gap: 0.75rem;
  transition: var(--va-swing-transition);
}
.secondary-mentor-card:hover {
  box-shadow: var(--va-box-shadow);
  transform: translateY(-3px);
}
.secondary-mentor-avatar-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.secondary-mentor-avatar-ring {
  position: relative;
  z-index: 2;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--va-primary), #00c4ff, var(--va-primary), #00c4ff);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: mentorRingSpin 6s linear infinite;
}
.secondary-mentor-avatar-wrap--female .secondary-mentor-avatar-ring {
  background: conic-gradient(from 0deg, #e040fb, #ff80ab, #e040fb, #ff80ab);
}
.secondary-mentor-avatar-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--va-background-primary);
  position: relative;
  z-index: 3;
  color: var(--va-primary);
}
.secondary-mentor-avatar-emoji svg {
  width: 1.5rem;
  height: 1.5rem;
}
.secondary-mentor-avatar-glow {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--va-primary-alpha) 0%, transparent 70%);
  animation: pulseGlow 2.5s ease-in-out infinite;
  pointer-events: none;
}
.secondary-mentor-avatar-wrap--female .secondary-mentor-avatar-glow {
  background: radial-gradient(circle, rgba(224,64,251,0.18) 0%, transparent 70%);
}
.secondary-mentor-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.secondary-mentor-name {
  font-family: var(--va-font-family);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}
.secondary-mentor-bio {
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  line-height: 1.6;
  margin: 0;
  max-width: 280px;
}
.secondary-mentor-stats {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--va-background-element);
}
.secondary-mentor-stat {
  text-align: center;
}
.secondary-mentor-stat-value {
  display: block;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--va-primary);
}
.secondary-mentor-stat-label {
  font-size: 0.6875rem;
  color: var(--va-muted);
}
.mentor-skills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}
.mentor-skill-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  background: var(--va-background-element);
  border-radius: 20px;
  letter-spacing: 0.3px;
}
.mentor-socials {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.mentor-social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--va-background-element);
  color: var(--va-on-background-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 700;
  transition: var(--va-swing-transition);
}
.mentor-social-link:hover {
  background: var(--va-primary-alpha);
  color: var(--va-primary);
  transform: translateY(-2px);
}
.mentor-social-link svg {
  width: 1rem;
  height: 1rem;
}
@keyframes mentorRingSpin {
  to { transform: rotate(360deg); }
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.cta-section {
  margin-bottom: 80px;
}
.cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--va-primary), #00c4ff);
  border-radius: var(--va-block-border-radius);
  padding: 2.5rem 3rem;
  gap: 2rem;
  position: relative;
  overflow: hidden;
}
.cta-content {
  position: relative;
  z-index: 1;
}
.cta-title {
  font-family: var(--va-font-family);
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 8px;
}
.cta-desc {
  font-size: 1rem;
  color: rgba(255,255,255,0.9);
  margin: 0 0 24px;
  line-height: 1.6;
}
.cta-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.cta-actions .btn-primary {
  background: #FFFFFF;
  color: var(--va-primary);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.cta-actions .btn-primary:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.25);
  transform: translateY(-1px);
  color: var(--va-primary);
}
.cta-actions .btn-secondary {
  background: rgba(255,255,255,0.15);
  color: #FFFFFF;
  border: 1px solid rgba(255,255,255,0.4);
}
.cta-actions .btn-secondary:hover {
  background: rgba(255,255,255,0.25);
}
[data-theme="dark"] .cta-card {
  background: var(--va-primary-darken);
}
[data-theme="dark"] .cta-actions .btn-primary {
  color: var(--va-primary-darken);
}
[data-theme="dark"] .cta-actions .btn-primary:hover {
  color: var(--va-primary-darken);
}
.cta-decoration {
  position: relative;
  z-index: 0;
  flex-shrink: 0;
}
.cta-emojii {
  width: 5rem;
  height: 5rem;
  opacity: 0.3;
  filter: grayscale(0.3);
  user-select: none;
  pointer-events: none;
}

.footer {
  border-top: var(--va-block-border);
  background: var(--va-background-primary);
  padding: 2.5rem 0 0;
}
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2.5rem;
}
.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-width: 240px;
}
.footer-brand .footer-logo {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--va-primary);
}
.footer-brand .footer-name {
  font-weight: 700;
  color: var(--va-on-background-primary);
  font-size: 1.125rem;
}
.footer-brand .footer-tagline {
  font-size: 0.8125rem;
  color: var(--va-muted);
  margin-top: 4px;
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.footer-col-title {
  font-family: var(--va-font-family);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--va-on-background-element);
  margin: 0 0 4px;
}
.footer-link {
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
  text-decoration: none;
  transition: var(--va-transition);
}
.footer-link:hover {
  color: var(--va-primary);
}
.footer-socials {
  display: flex;
  gap: 10px;
}
.footer-social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--va-background-element);
  color: var(--va-on-background-secondary);
  text-decoration: none;
  transition: var(--va-swing-transition);
}
.footer-social-link:hover {
  background: var(--va-primary-alpha);
  color: var(--va-primary);
  transform: translateY(-2px);
}
.social-icon {
  width: 1.125rem;
  height: 1.125rem;
}
.footer-bottom {
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 1.25rem 24px;
  border-top: 1px solid var(--va-background-element);
  text-align: center;
}
.footer-copy {
  font-size: 0.8125rem;
  color: var(--va-muted);
}

.badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0 0.375rem;
  border-radius: 0.6rem;
  letter-spacing: 0.0375rem;
  line-height: 1.6;
  text-transform: uppercase;
}
.badge--orange {
  background: rgba(249,115,22,0.12);
  color: #F97316;
}
.badge--primary {
  background: var(--va-primary-alpha);
  color: var(--va-primary);
}
.badge--success {
  background: rgba(16,185,129,0.12);
  color: var(--va-success);
}
.badge--info {
  background: rgba(59,130,246,0.12);
  color: var(--va-info);
}
.badge--warning {
  background: rgba(245,158,11,0.12);
  color: var(--va-warning);
}

/* ============================================================
 * 移动端响应式适配
 * ============================================================ */
@media (max-width: 767.98px) {
  /* ---- 顶栏 ---- */
  .header-content {
    padding: 0 12px;
    height: 56px;
  }

  .logo-text {
    font-size: 0.9375rem;
  }

  /* 导航栏在移动端只显示关键链接 + 主题切换 */
  .nav {
    gap: 4px;
  }

  .nav-link {
    display: none;
    padding: 6px 10px;
    font-size: 0.8125rem;
  }

  /* 只显示首页和登录/仪表盘等关键链接 */
  .nav-link:nth-child(1),
  .nav-link:nth-child(2),
  .nav-link--dashboard,
  .nav-link:last-child {
    display: inline-flex;
  }

  .nav-btn {
    display: inline-flex !important;
    padding: 6px 14px;
    font-size: 0.8125rem;
  }

  .nav-search {
    display: none;
  }

  /* ---- 公告栏 ---- */
  .announcement-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    margin: 12px 0 0;
  }

  .announcement-content {
    width: 100%;
    flex-wrap: wrap;
  }

  .announcement-text {
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .resource-tag {
    align-self: flex-start;
  }

  /* ---- Hero 区 ---- */
  .hero {
    padding: 60px 16px 48px;
    margin: 16px 0 40px;
  }

  .hero-title {
    font-size: 1.625rem;
    line-height: 1.2;
  }

  .hero-desc {
    font-size: 0.9375rem;
    margin-bottom: 28px;
    line-height: 1.5;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .hero .btn-primary,
  .hero .btn-secondary {
    width: 100%;
    max-width: 280px;
    justify-content: center;
    padding: 0.625rem 1.5rem;
    font-size: 0.875rem;
  }

  .hero-badge {
    margin-bottom: 16px;
  }

  /* 隐藏 EQ 波形减少移动端性能开销 */
  .hero-wave-bg {
    opacity: 0.08;
  }
  .eq-bar {
    min-width: 4px;
  }

  /* ---- 分类卡片 ---- */
  .categories-section {
    margin-bottom: 48px;
  }

  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .category-card {
    padding: 1rem 0.75rem;
  }

  .category-name {
    font-size: 0.8125rem;
  }

  .category-icon svg {
    width: 1.375rem;
    height: 1.375rem;
  }

  /* ---- 课程列表 ---- */
  .courses-section {
    margin-bottom: 48px;
  }

  .section-header {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 1.375rem;
  }

  .section-subtitle {
    font-size: 0.8125rem;
  }

  .filter-tabs {
    gap: 6px;
    margin-bottom: 20px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 0 4px;
    scrollbar-width: none;
  }

  .filter-tabs::-webkit-scrollbar {
    display: none;
  }

  .filter-tab {
    padding: 5px 14px;
    font-size: 0.75rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .course-cover {
    height: 180px;
  }

  .course-body {
    padding: 0.75rem;
  }

  .course-title {
    font-size: 0.875rem;
  }

  /* 隐藏 hover 浮层（触摸设备无 hover） */
  .course-hover-overlay {
    display: none;
  }

  .courses-more {
    margin-top: 20px;
  }

  /* ---- 关于我们（导师卡片） ---- */
  .about-section {
    margin-bottom: 48px;
  }

  .mentor-hero-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
    padding: 1.25rem 1rem;
  }

  .primary-mentor-avatar-wrap {
    width: 100px;
    height: 100px;
  }

  .primary-mentor-avatar-ring {
    width: 92px;
    height: 92px;
  }

  .primary-mentor-avatar-emoji {
    width: 80px;
    height: 80px;
  }

  .primary-mentor-avatar-emoji svg {
    width: 2rem;
    height: 2rem;
  }

  .primary-mentor-info {
    align-items: center;
  }

  .primary-mentor-badges {
    justify-content: center;
  }

  .primary-mentor-name {
    font-size: 1.25rem;
  }

  .primary-mentor-bio {
    font-size: 0.8125rem;
    max-width: 100%;
    line-height: 1.5;
    /* 防止文本溢出容器 */
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .primary-mentor-skills {
    justify-content: center;
  }

  .primary-mentor-stats {
    gap: 1rem;
    width: 100%;
    justify-content: space-around;
  }

  .primary-mentor-stat-value {
    font-size: 1.125rem;
  }

  /* 次级导师卡片 */
  .secondary-mentors-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .secondary-mentor-card {
    padding: 1.25rem 1rem;
  }

  .secondary-mentor-bio {
    max-width: 100%;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .secondary-mentor-stats {
    gap: 0.75rem;
  }

  /* ---- CTA 区 ---- */
  .cta-section {
    margin-bottom: 48px;
  }

  .cta-card {
    flex-direction: column;
    padding: 1.5rem 1.25rem;
    text-align: center;
    gap: 1rem;
  }

  .cta-title {
    font-size: 1.25rem;
  }

  .cta-desc {
    font-size: 0.875rem;
    margin-bottom: 18px;
  }

  .cta-actions {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .cta-actions .btn-primary,
  .cta-actions .btn-secondary {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }

  .cta-decoration {
    display: none;
  }

  .cta-emojii {
    width: 3rem;
    height: 3rem;
  }

  /* ---- 页脚 ---- */
  .footer-content {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 16px;
  }

  .footer-brand {
    max-width: 100%;
    align-items: center;
    text-align: center;
  }

  .footer-col {
    align-items: center;
    text-align: center;
  }

  .footer-socials {
    justify-content: center;
  }

  .footer-bottom {
    padding: 1rem 16px;
  }
}
</style>
