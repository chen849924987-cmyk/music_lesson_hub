<!--
 * CourseCreateSeries - 创建系列课程
 *
 * 功能描述：提供系列课程（series）的创建表单，包含基本信息和章节编排。
 *           系列课程需要先创建基本信息，再编排章节和课时。
 *
 * 设计参考：Vuestic UI 设计规范，使用 --va-* CSS 变量实现双主题适配
 -->

<template>
  <div class="course-create-series">
    <!-- ========== 页面头部 ========== -->
    <div class="create-header">
      <div class="create-header__left">
        <router-link to="/teacher/courses/create" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          返回选择类型
        </router-link>
        <h1 class="page-title">创建系列课程 — 基本信息</h1>
        <span class="page-subtitle">第①步：填写课程基本信息，创建课程骨架；第②步：进入编辑页编排章节并为每个课时上传视频</span>
      </div>
      <div class="create-header__right">
        <button class="btn btn-secondary" @click="handleSaveDraft" :disabled="saving">
          {{ saving ? '保存中...' : '保存草稿' }}
        </button>
        <button class="btn btn-primary" @click="handleNextStep" :disabled="saving">
          {{ saving ? '保存中...' : '保存并编排章节 →' }}
        </button>
      </div>
    </div>

    <div class="create-body">
      <!-- ========== 基本信息表单 ========== -->
      <section class="form-section card">
        <h2 class="section-title">基本信息</h2>

        <!-- 课程标题 -->
        <div class="form-group">
          <label class="form-label">课程标题 <span class="required">*</span></label>
          <input
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="请输入课程标题，建议控制在50字以内"
            maxlength="50"
          />
          <span class="form-hint" v-if="form.title">{{ form.title.length }}/50</span>
        </div>

        <!-- 课程分类 -->
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label">课程分类 <span class="required">*</span></label>
            <select v-model="form.categoryId" class="form-input">
              <option value="">请选择分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 价格设置 -->
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label">价格（元）</label>
            <input
              v-model.number="form.price"
              type="number"
              class="form-input"
              placeholder="0 表示免费"
              min="0"
              step="0.01"
            />
          </div>
          <div class="form-group form-group--half">
            <label class="form-label">原价（元）</label>
            <input
              v-model.number="form.originalPrice"
              type="number"
              class="form-input"
              placeholder="可选"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <!-- 课程简介 -->
        <div class="form-group">
          <label class="form-label">课程简介</label>
          <textarea
            v-model="form.description"
            class="form-input form-textarea"
            placeholder="请简要描述课程内容、目标学员等"
            rows="4"
            maxlength="500"
          ></textarea>
          <span v-if="form.description" class="form-hint">{{ form.description.length }}/500</span>
        </div>

        <!-- 课程标签 -->
        <div class="form-group">
          <label class="form-label">课程标签</label>
          <input
            v-model="form.tags"
            type="text"
            class="form-input"
            placeholder="多个标签用逗号分隔"
          />
          <span class="form-hint">多个标签用英文逗号分隔</span>
        </div>

        <!-- 试看设置 -->
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label">试看时长（秒）</label>
            <input
              v-model.number="form.previewDuration"
              type="number"
              class="form-input"
              placeholder="0 表示不可试看"
              min="0"
              max="600"
            />
            <span class="form-hint">范围 1~600 秒，0 表示不可试看</span>
          </div>
        </div>

        <!-- 课程封面 -->
        <div class="form-group">
          <label class="form-label">课程封面</label>
          <div class="cover-upload" @click="triggerCoverUpload">
            <img v-if="form.cover" :src="form.cover" class="cover-preview" />
            <div v-else class="cover-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <span>点击上传封面</span>
            </div>
          </div>
          <input ref="coverInputRef" type="file" accept="image/*" style="display: none" @change="handleCoverUpload" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CourseCreateSeries 创建系列课程页
 *
 * @description 提供系列课程的两步创建流程：
 *              第①步（本页）：填写课程基本信息，创建课程骨架；
 *              第②步（编辑页）：编排章节结构，为每个课时上传视频。
 */
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  getCategories,
  createCourse,
  type CategoryInfo,
  type CreateCourseParams,
} from '../../api/course';

const router = useRouter();

/** 保存中 */
const saving = ref(false);

/** 分类列表 */
const categories = ref<CategoryInfo[]>([]);

/** 封面文件输入引用 */
const coverInputRef = ref<HTMLInputElement | null>(null);

/** 课程表单数据 */
const form = reactive<CreateCourseParams>({
  title: '',
  categoryId: 0,
  courseType: 'series',
  price: 0,
  originalPrice: 0,
  description: '',
  tags: '',
  previewDuration: 0,
  trailerUrl: '',
  cover: '',
});

/**
 * 初始化页面数据
 */
const initPage = async () => {
  try {
    categories.value = await getCategories();
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

/**
 * 触发封面文件选择
 */
const triggerCoverUpload = () => {
  coverInputRef.value?.click();
};

/**
 * 处理封面上传
 */
const handleCoverUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  form.cover = URL.createObjectURL(file);
};

/**
 * 保存草稿
 */
const handleSaveDraft = async () => {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const course = await createCourse({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      tags: form.tags?.trim() || '',
    });
    ElMessage.success('系列课程创建成功，请继续编排章节');
    router.push(`/teacher/courses/${course.id}/edit`);
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 保存并进入下一步（编排章节）
 * 系列课程先创建基本信息，再进入编辑页添加章节和课时视频
 */
const handleNextStep = async () => {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const course = await createCourse({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      tags: form.tags?.trim() || '',
    });
    ElMessage.success('系列课程骨架已创建，请继续编排章节并为每个课时上传视频');
    router.push(`/teacher/courses/${course.id}/edit`);
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 表单校验
 */
const validateForm = (): boolean => {
  if (!form.title.trim()) {
    ElMessage.warning('请输入课程标题');
    return false;
  }
  if (!form.categoryId) {
    ElMessage.warning('请选择课程分类');
    return false;
  }
  return true;
};

onMounted(() => {
  initPage();
});
</script>

<style scoped>
.create-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.create-header__left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.create-header__right {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
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

.page-subtitle {
  font-size: 0.8125rem;
  color: var(--va-muted);
}

.create-body {
  max-width: 800px;
}

.form-section {
  padding: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: var(--va-block-border);
}

.form-group {
  margin-bottom: 1rem;
  position: relative;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group--half {
  flex: 1;
  min-width: 0;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  margin-bottom: 0.375rem;
  letter-spacing: var(--va-letter-spacing);
}

.required {
  color: var(--va-danger);
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  background-color: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-form-element-border-radius);
  transition: var(--va-transition);
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
}

.form-input::placeholder {
  color: var(--va-on-background-element);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--va-muted);
  margin-top: 0.25rem;
  text-align: right;
}

select.form-input {
  appearance: auto;
}

.cover-upload {
  width: 320px;
  height: 180px;
  border: 2px dashed var(--va-background-border);
  border-radius: var(--va-block-border-radius);
  overflow: hidden;
  cursor: pointer;
  transition: var(--va-transition);
}

.cover-upload:hover {
  border-color: var(--va-primary);
  border-style: solid;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--va-muted);
  font-size: 0.8125rem;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
