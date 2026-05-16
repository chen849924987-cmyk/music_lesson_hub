<!--
 * CourseCreatePage - 课程创建类型选择页
 *
 * 功能描述：在创建课程前让用户选择课程类型（单课程/系列课程），
 *           提供两种类型的说明和适用场景提示。
 *
 * 设计参考：Vuestic UI 设计规范，使用 --va-* CSS 变量实现双主题适配
 -->

<template>
  <div class="course-create">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <div class="page-header__left">
        <router-link to="/teacher/courses" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          返回课程列表
        </router-link>
        <h1 class="page-title">创建课程</h1>
        <p class="page-desc">请选择要创建的课程类型</p>
      </div>
    </div>

    <!-- ========== 类型选择卡片 ========== -->
    <div class="type-selector">
      <!-- 单课程卡片 -->
      <div class="type-card card" @click="goToCreate('single')">
        <div class="type-card__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <line x1="8" y1="7" x2="16" y2="7"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <div class="type-card__body">
          <h2 class="type-card__title">单课程</h2>
          <p class="type-card__desc">适合独立的单节课程，不需要按章节组织。</p>
          <ul class="type-card__features">
            <li>一个课程直接包含多个课时</li>
            <li>无需章节层级，结构更简单</li>
            <li>适合一次性的专题课程</li>
          </ul>
        </div>
        <div class="type-card__action">
          <span class="btn btn-primary">创建单课程</span>
        </div>
      </div>

      <!-- 系列课程卡片 -->
      <div class="type-card card" @click="goToCreate('series')">
        <div class="type-card__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <path d="M2 10h20"/>
            <path d="M2 14h20"/>
            <path d="M2 18h20"/>
          </svg>
        </div>
        <div class="type-card__body">
          <h2 class="type-card__title">系列课程</h2>
          <p class="type-card__desc">适合按章节组织的完整课程体系，支持分章编排。</p>
          <ul class="type-card__features">
            <li>按「章节 → 课时」双层结构组织</li>
            <li>每个章节可包含多个课时</li>
            <li>适合系统性的教学课程</li>
          </ul>
        </div>
        <div class="type-card__action">
          <span class="btn btn-primary">创建系列课程</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CourseCreatePage 课程创建类型选择页
 *
 * @description 引导用户选择课程类型后再进入对应的创建表单
 */
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * 跳转到对应的创建页
 * @param type 课程类型：single（单课程）/ series（系列课程）
 */
const goToCreate = (type: 'single' | 'series') => {
  router.push(`/teacher/courses/create/${type}`);
};
</script>

<style scoped>
/* ---- 页面头部 ---- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-header__left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  text-decoration: none;
  transition: var(--va-transition);
}

.back-link:hover {
  color: var(--va-primary);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

.page-desc {
  font-size: 0.875rem;
  color: var(--va-on-background-element);
  margin: 0;
}

/* ---- 类型选择器 ---- */
.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 900px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;
  border: 2px solid var(--va-background-border);
  border-radius: var(--va-block-border-radius);
  cursor: pointer;
  transition: var(--va-swing-transition);
  background-color: var(--va-background-primary);
}

.type-card:hover {
  border-color: var(--va-primary);
  box-shadow: var(--va-box-shadow);
  transform: translateY(-2px);
}

.type-card__icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--va-primary-alpha);
  border-radius: 50%;
  color: var(--va-primary);
  margin-bottom: 1.25rem;
}

.type-card__body {
  flex: 1;
  margin-bottom: 1.25rem;
}

.type-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0 0 0.5rem;
}

.type-card__desc {
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.type-card__features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  display: inline-block;
}

.type-card__features li {
  position: relative;
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  padding: 0.25rem 0 0.25rem 1.25rem;
  line-height: 1.5;
}

.type-card__features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.625rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--va-primary);
  opacity: 0.5;
}

.type-card__action .btn {
  width: 100%;
  min-width: 180px;
  justify-content: center;
}
</style>
