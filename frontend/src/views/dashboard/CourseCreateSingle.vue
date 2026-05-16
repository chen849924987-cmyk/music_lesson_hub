<!--
 * CourseCreateSingle - 创建单课程
 *
 * 功能描述：提供单课程（single）的快速创建表单，包含基本信息、视频上传、课时信息。
 *           单课程只需一个课时，在创建时同时上传视频并创建课时。
 *           提交后：创建课程 → 创建课时并关联视频 → 跳转到课程列表。
 *
 * 设计参考：Vuestic UI 设计规范，使用 --va-* CSS 变量实现双主题适配
 -->

<template>
  <div class="course-create">
    <!-- ========== 页面头部 ========== -->
    <div class="create-header">
      <div class="create-header__left">
        <router-link to="/teacher/courses/create" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          返回选择类型
        </router-link>
        <h1 class="page-title">创建单课程</h1>
        <span class="page-subtitle">上传视频并填写课程信息，一步完成创建</span>
      </div>
      <div class="create-header__right">
        <button class="btn btn-secondary" @click="handleSaveDraft" :disabled="saving">
          {{ saving ? '保存中...' : '保存草稿' }}
        </button>
        <button class="btn btn-primary" @click="handlePublish" :disabled="saving">
          {{ saving ? '提交中...' : '发布课程' }}
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
            <label class="form-label">
              原价（元）
              <span class="form-label-hint">用于划线价展示</span>
            </label>
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
            placeholder="多个标签用逗号分隔，如：钢琴,入门,零基础"
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <span>点击上传封面</span>
            </div>
          </div>
          <input
            ref="coverInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleCoverUpload"
          />
        </div>
      </section>

      <!-- ========== 视频上传 + 课时信息 ========== -->
      <section class="form-section card">
        <h2 class="section-title">课程视频 <span class="required">*</span></h2>
        <p class="section-desc">单课程需要上传一个视频文件，即课程的主讲内容。</p>

        <!-- 课时标题 -->
        <div class="form-group">
          <label class="form-label">课时标题 <span class="required">*</span></label>
          <input
            v-model="lessonTitle"
            type="text"
            class="form-input"
            placeholder="默认为课程标题，也可单独命名"
            maxlength="50"
          />
          <span class="form-hint">默认为课程标题，可自定义课时名称</span>
        </div>

        <!-- 视频上传区域 -->
        <div class="form-group">
          <label class="form-label">视频文件 <span class="required">*</span></label>

          <!-- 未上传状态 -->
          <div v-if="!uploadedVideo && !uploadingVideo" class="upload-area" @drop.prevent="handleVideoDrop" @dragover.prevent @click="triggerVideoUpload">
            <input ref="videoInputRef" type="file" accept="video/mp4,video/webm,video/ogg" style="display:none" @change="handleVideoFileSelect" />
            <div class="upload-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p>点击或拖拽视频文件到此处</p>
              <span class="text-muted text-sm">支持 mp4/webm/ogg 格式，最大 2GB</span>
            </div>
          </div>

          <!-- 上传进度 -->
          <div v-if="uploadingVideo" class="upload-area">
            <div class="upload-progress">
              <div class="progress-bar">
                <div class="progress-bar__fill" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <span class="text-sm">{{ uploadProgress }}% — {{ uploadStatusText }}</span>
            </div>
          </div>

          <!-- 已上传状态 -->
          <div v-if="uploadedVideo && !uploadingVideo" class="video-preview">
            <div class="video-preview__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="video-preview__info">
              <span class="video-preview__name">{{ uploadedVideo.originalName }}</span>
              <span class="text-muted text-sm">{{ formatFileSize(uploadedVideo.fileSize) }}</span>
            </div>
            <button class="btn btn-sm btn-text text-danger" @click="removeVideo">移除</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CourseCreateSingle 创建单课程页
 *
 * @description 单课程创建流程：填写基本信息 → 上传视频 → 填写课时标题 → 一键发布。
 *              提交时先创建课程，再创建课时并关联视频。
 */
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  getCategories,
  createCourse,
  createCourseLesson,
  uploadVideo,
  type CategoryInfo,
  type CreateCourseParams,
} from '../../api/course';

const router = useRouter();

// ============ 状态定义 ============

/** 保存中 */
const saving = ref(false);

/** 分类列表 */
const categories = ref<CategoryInfo[]>([]);

/** 封面文件输入引用 */
const coverInputRef = ref<HTMLInputElement | null>(null);

/** 封面文件（用于实际上传） */
const coverFile = ref<File | null>(null);

/**
 * 课程表单数据
 */
const form = reactive<CreateCourseParams>({
  title: '',
  categoryId: 0,
  courseType: 'single',
  price: 0,
  originalPrice: 0,
  description: '',
  tags: '',
  previewDuration: 0,
  trailerUrl: '',
  cover: '',
});

/** 课时标题（默认为课程标题，用户可单独修改） */
const lessonTitle = ref('');

/** 视频上传相关 */
const videoInputRef = ref<HTMLInputElement | null>(null);
const uploadingVideo = ref(false);
const uploadProgress = ref(0);
const uploadStatusText = ref('正在上传...');
const uploadedVideo = ref<{
  id: number;
  originalName: string;
  fileSize: number;
  duration?: number;
} | null>(null);

// ============ 方法 ============

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
 * @param event 上传事件
 */
const handleCoverUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  coverFile.value = file;
  form.cover = URL.createObjectURL(file);
};

/**
 * 触发视频文件选择
 */
const triggerVideoUpload = () => {
  videoInputRef.value?.click();
};

/**
 * 处理视频拖拽上传
 */
const handleVideoDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('video/')) {
    startVideoUpload(file);
  }
};

/**
 * 处理视频文件选择
 */
const handleVideoFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) startVideoUpload(file);
};

/**
 * 开始上传视频
 * @param file 视频文件
 */
const startVideoUpload = async (file: File) => {
  // 文件类型校验
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.warning('仅支持 mp4/webm/ogg 格式的视频文件');
    return;
  }

  uploadingVideo.value = true;
  uploadProgress.value = 0;
  uploadStatusText.value = '正在上传...';

  try {
    const result = await uploadVideo(file, {
      onProgress: (p) => {
        uploadProgress.value = p;
        if (p < 100) {
          uploadStatusText.value = '正在上传...';
        } else {
          uploadStatusText.value = '正在处理...';
        }
      },
    });
    uploadedVideo.value = {
      id: result.id,
      originalName: result.originalName || file.name,
      fileSize: result.fileSize || file.size,
      duration: result.duration,
    };
    ElMessage.success('视频上传成功');
  } catch (error: any) {
    ElMessage.error(error.message || '视频上传失败，请重试');
    uploadedVideo.value = null;
  } finally {
    uploadingVideo.value = false;
    uploadProgress.value = 0;
  }
};

/**
 * 移除已上传的视频
 */
const removeVideo = () => {
  uploadedVideo.value = null;
  // 清除 input 的选中状态，以便重新选择同一文件
  if (videoInputRef.value) {
    videoInputRef.value.value = '';
  }
};

/**
 * 保存草稿（只创建课程基本信息，不要求视频）
 */
const handleSaveDraft = async () => {
  if (!validateBasicInfo()) return;
  saving.value = true;
  try {
    const course = await createCourse({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      tags: form.tags?.trim() || '',
    });
    ElMessage.success('单课程草稿已保存，请继续完善视频和课时信息');
    // 跳转到编辑页补充视频
    router.push(`/teacher/courses/${course.id}/edit`);
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 发布课程（创建课程 + 创建课时并关联视频，一步完成）
 */
const handlePublish = async () => {
  // 校验完整信息
  if (!validateBasicInfo()) return;
  if (!uploadedVideo.value) {
    ElMessage.warning('请上传课程视频');
    return;
  }

  saving.value = true;
  try {
    // 第一步：创建课程
    const course = await createCourse({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      tags: form.tags?.trim() || '',
    });

    // 第二步：为课程创建课时并关联已上传的视频
    // 单课程不关联章节（chapterId 不传，后端支持）
    const lessonTitleToUse = lessonTitle.value.trim() || course.title;
    await createCourseLesson(course.id, {
      title: lessonTitleToUse,
      videoId: uploadedVideo.value.id,
      duration: uploadedVideo.value.duration || 0,
      isFree: false,
    });

    // 第三步：如果有封面文件，上传封面
    if (coverFile.value) {
      try {
        const formData = new FormData();
        formData.append('file', coverFile.value);
        const axios = (await import('../../api/request')).default;
        await axios.post(`/courses/${course.id}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        // 封面上传失败不影响主流程
        console.warn('封面上传失败，可后续在编辑页重新上传');
      }
    }

    ElMessage.success('课程已创建并发布！');
    router.push('/teacher/courses');
  } catch (error: any) {
    ElMessage.error(error.message || '发布失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 校验基本信息
 * @returns 是否通过校验
 */
const validateBasicInfo = (): boolean => {
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

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的字符串
 */
const formatFileSize = (bytes: number): string => {
  if (!bytes) return '未知大小';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// ============ 生命周期 ============

onMounted(() => {
  initPage();
});
</script>

<style scoped>
/* ============================================================
 * CourseCreateSingle 样式
 * ============================================================ */

/* ---- 页面头部 ---- */
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

/* ---- 表单区域 ---- */
.create-body {
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  padding: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: var(--va-block-border);
}

.section-desc {
  font-size: 0.8125rem;
  color: var(--va-muted);
  margin: -0.5rem 0 1rem;
}

/* ---- 表单组 ---- */
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

.form-label-hint {
  font-weight: 400;
  color: var(--va-on-background-element);
  margin-left: 0.5rem;
  font-size: 0.75rem;
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

/* ---- 封面上传 ---- */
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

/* ---- 视频上传 ---- */
.upload-area {
  border: 2px dashed var(--va-background-border);
  border-radius: var(--va-block-border-radius);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: var(--va-transition);
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--va-primary);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--va-muted);
}

.upload-placeholder p {
  margin: 0;
  font-size: 0.875rem;
}

.upload-progress {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--va-background-element);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background-color: var(--va-primary);
  border-radius: 4px;
  transition: width 0.3s;
  min-width: 2%;
}

/* ---- 已上传视频预览 ---- */
.video-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-secondary);
}

.video-preview__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--va-background-primary);
  border-radius: var(--va-square-border-radius);
}

.video-preview__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.video-preview__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--va-on-background-primary);
  word-break: break-all;
}

/* ---- 工具类 ---- */
.btn-sm { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
.btn-text { background: none; border: none; color: var(--va-on-background-secondary); cursor: pointer; }
.btn-text:hover { color: var(--va-primary); }
.text-sm { font-size: 0.8125rem; }
.text-muted { color: var(--va-muted); }
.text-danger { color: var(--va-danger) !important; }
</style>
