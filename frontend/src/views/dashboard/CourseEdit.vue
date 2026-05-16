<!--
 * CourseEdit - 课程编辑页（按课程类型区分 Tab）
 *
 * 功能描述：根据课程类型（single/series）动态显示不同的编辑 Tab。
 *           - 单课程：基本信息、课程视频、课程资料（附件）、试看设置 四个 Tab
 *           - 系列课程：基本信息、章节编排（含视频）、课程资料（附件）、试看设置 四个 Tab
 *           - 系列课的课时弹窗集成了视频上传/选择功能，无需切换到独立 Tab
 *           - 课程资料（附件）独立审核，未通过不影响课程展示
 *
 * 设计参考：Vuestic UI 设计规范，使用 --va-* CSS 变量实现双主题适配
 -->

<template>
  <div class="course-edit">
    <!-- ========== 视频预览弹窗 ========== -->
    <div v-if="showVideoPreview" class="modal-overlay" @click.self="closeVideoPreview">
      <div class="modal-dialog video-preview-modal">
        <div class="modal-header">
          <h3 class="modal-title">视频预览</h3>
          <button class="modal-close" @click="closeVideoPreview">&times;</button>
        </div>
        <div class="modal-body video-preview-body">
          <video
            v-if="videoPreviewUrl"
            :src="videoPreviewUrl"
            controls
            autoplay
            class="video-player"
          ></video>
          <div v-else class="video-loading">
            <span class="text-muted">正在加载视频...</span>
          </div>
        </div>
      </div>
    </div>
    <!-- ========== 页面头部 ========== -->
    <div class="edit-header">
      <div class="edit-header__left">
        <router-link to="/teacher/courses" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          返回课程列表
        </router-link>
        <h1 class="page-title">编辑课程</h1>
        <span class="page-subtitle">
          {{ courseData?.title || '加载中...' }}
          <span v-if="courseData" class="course-type-badge" :class="isSingleCourse ? 'badge--info' : 'badge--primary'">
            {{ isSingleCourse ? '单课程' : '系列课程' }}
          </span>
        </span>
      </div>
      <div class="edit-header__right">
        <button class="btn btn-secondary" @click="handleSaveDraft" :disabled="saving">
          {{ saving ? '保存中...' : '保存草稿' }}
        </button>
        <button class="btn btn-primary" @click="handleSubmitReview" :disabled="saving">
          {{ saving ? '提交中...' : '提交审核' }}
        </button>
      </div>
    </div>

    <!-- ========== Pending Edit 提醒 ========== -->
    <div v-if="courseData?.pendingEdit" class="alert alert--warning card">
      <div class="alert__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="alert__content">
        <strong>此课程已上架</strong>，当前编辑的内容将创建新版本，需要重新审核后才能生效。<br/>
        已上架的旧版本内容在审核通过前仍对外可见。
      </div>
    </div>

    <!-- ========== 驳回信息展示 ========== -->
    <div v-if="courseData?.reviewComment" class="alert alert--danger card">
      <div class="alert__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="alert__content">
        <strong>课程被驳回</strong>：{{ courseData.reviewComment }}
      </div>
    </div>

    <!-- ========== Tab 导航（按课程类型动态显示） ========== -->
    <div class="tab-bar card">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        class="tab-item"
        :class="{ 'tab-item--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ========== Tab 内容 ========== -->

    <!-- Tab 1: 基本信息（单课 & 系列课通用） -->
    <section v-if="activeTab === 'info'" class="tab-content">
      <div class="form-section card">
        <h2 class="section-title">基本信息</h2>

        <div class="form-group">
          <label class="form-label">课程标题 <span class="required">*</span></label>
          <input v-model="form.title" type="text" class="form-input" placeholder="请输入课程标题" maxlength="50" />
          <span class="form-hint" v-if="form.title">{{ form.title.length }}/50</span>
        </div>

        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label">课程分类 <span class="required">*</span></label>
            <select v-model="form.categoryId" class="form-input">
              <option value="">请选择分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group form-group--half">
            <label class="form-label">课程类型</label>
            <input type="text" class="form-input" :value="isSingleCourse ? '单课程' : '系列课程'" disabled />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label">价格（元）</label>
            <input v-model.number="form.price" type="number" class="form-input" placeholder="0" min="0" step="0.01" />
          </div>
          <div class="form-group form-group--half">
            <label class="form-label">原价（元）</label>
            <input v-model.number="form.originalPrice" type="number" class="form-input" placeholder="可选" min="0" step="0.01" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">课程简介</label>
          <textarea v-model="form.description" class="form-input form-textarea" placeholder="请简要描述课程内容" rows="4" maxlength="500"></textarea>
          <span v-if="form.description" class="form-hint">{{ form.description.length }}/500</span>
        </div>

        <div class="form-group">
          <label class="form-label">课程标签</label>
          <input v-model="form.tags" type="text" class="form-input" placeholder="多个标签用逗号分隔" />
        </div>
      </div>

      <!-- 封面上传 -->
      <div class="form-section card">
        <h2 class="section-title">课程封面</h2>
        <div class="cover-upload" @click="triggerCoverUpload">
          <img v-if="coverPreview" :src="coverPreview" class="cover-preview" />
          <div v-else class="cover-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <span>点击上传封面</span>
          </div>
        </div>
        <input ref="coverInputRef" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="handleCoverUpload" />
      </div>
    </section>

    <!-- ======================================================================== -->
    <!-- 单课程专用：课程视频 Tab（直接显示一个课时，上传/替换视频） -->
    <!-- ======================================================================== -->
    <section v-if="isSingleCourse && activeTab === 'singleVideo'" class="tab-content">
      <div class="form-section card">
        <h2 class="section-title">课程视频</h2>
        <p class="section-desc">单课程只有一个课时，在此直接管理课程视频。</p>

        <!-- 课时标题 -->
        <div class="form-group">
          <label class="form-label">课时标题 <span class="required">*</span></label>
          <input
            v-model="singleLessonTitle"
            type="text"
            class="form-input"
            placeholder="默认为课程标题"
            maxlength="50"
          />
          <span class="form-hint">默认为课程标题，可自定义</span>
        </div>

        <!-- 已有视频信息 -->
        <div v-if="singleLessonData" class="form-group">
          <div class="video-info-card">
            <div class="video-info-card__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--va-primary)" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div class="video-info-card__body">
              <span class="video-info-card__name">{{ singleLessonData.title }}</span>
              <span class="text-muted text-sm" v-if="singleLessonData.videoId">已关联视频 ID: {{ singleLessonData.videoId }}</span>
              <span class="text-muted text-sm" v-else>未关联视频</span>
              <span class="text-muted text-sm" v-if="singleLessonData.duration">时长: {{ singleLessonData.duration }}秒</span>
            </div>
            <div class="video-info-card__actions">
              <button
                v-if="singleLessonData.videoId"
                class="btn btn-sm btn-secondary"
                @click="previewVideo(singleLessonData.videoId)"
              >
                预览视频
              </button>
              <button class="btn btn-sm btn-danger" @click="removeSingleVideo">移除视频</button>
            </div>
          </div>
        </div>

        <!-- 视频上传区域 -->
        <div class="form-group">
          <label class="form-label">{{ singleLessonData?.videoId ? '更换视频' : '上传视频' }}</label>

          <!-- 未上传状态 -->
          <div v-if="!uploadedVideo && !uploadingVideo" class="upload-area" @drop.prevent="handleSingleVideoDrop" @dragover.prevent @click="triggerSingleVideoUpload">
            <input ref="singleVideoInputRef" type="file" accept="video/mp4,video/webm,video/ogg" style="display:none" @change="handleSingleVideoFileSelect" />
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

          <!-- 已上传新视频（预览） -->
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
            <button class="btn btn-sm btn-text text-danger" @click="removeUploadedVideo">移除</button>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveSingleLessonVideo" :disabled="savingSingleVideo">
            {{ savingSingleVideo ? '保存中...' : '保存课时视频' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ======================================================================== -->
    <!-- 系列课程专用：章节编排 Tab（集成了课时视频上传） -->
    <!-- ======================================================================== -->
    <section v-if="!isSingleCourse && activeTab === 'chapters'" class="tab-content">
      <div class="form-section card">
        <h2 class="section-title">
          章节编排
          <button class="btn btn-sm btn-primary" @click="openChapterDialog()">+ 添加章节</button>
        </h2>

        <div v-if="chapters.length === 0" class="empty-tip">暂无章节，请点击上方按钮添加章节，然后在章节下添加课时</div>
        <div v-else class="chapter-list">
          <div v-for="(chapter, index) in chapters" :key="chapter.id || index" class="chapter-item">
            <div class="chapter-header">
              <span class="chapter-order">第{{ index + 1 }}章</span>
              <span class="chapter-title">{{ chapter.title }}</span>
              <div class="chapter-actions">
                <button class="btn btn-sm btn-text" @click="openLessonDialog(chapter)">+ 课时</button>
                <button class="btn btn-sm btn-text" @click="editChapter(chapter)">编辑</button>
                <button class="btn btn-sm btn-text text-danger" @click="confirmDeleteChapter(chapter)">删除</button>
              </div>
            </div>
            <div v-if="chapter.lessons && chapter.lessons.length > 0" class="lesson-list">
              <div v-for="(lesson, lIndex) in chapter.lessons" :key="lesson.id || lIndex" class="lesson-item">
                <span class="lesson-order">课时{{ lIndex + 1 }}</span>
                <span class="lesson-title">{{ lesson.title }}</span>
                <span class="lesson-duration">{{ lesson.duration ? lesson.duration + 's' : '' }}</span>
                <!-- 视频状态标记 -->
                <span class="lesson-video-status" :class="lesson.videoId ? 'status--linked' : 'status--empty'">
                  {{ lesson.videoId ? '已关联' : '无视频' }}
                </span>
                <span class="lesson-free-badge badge badge--primary" v-if="lesson.isFree">试看</span>
                <div class="lesson-actions">
                  <button v-if="lesson.videoId" class="btn btn-sm btn-text" @click="previewVideo(lesson.videoId)">预览</button>
                  <button class="btn btn-sm btn-text" @click="editLesson(chapter, lesson)">编辑</button>
                  <button class="btn btn-sm btn-text text-danger" @click="confirmDeleteLesson(chapter, lesson)">删除</button>
                </div>
              </div>
            </div>
            <div v-else class="empty-lessons">暂无课时，点击"+ 课时"添加</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================================== -->
    <!-- 通用：课程资料 Tab（附件管理，单课 & 系列课通用） -->
    <!-- ======================================================================== -->
    <section v-if="activeTab === 'attachments'" class="tab-content">
      <div class="form-section card">
        <AttachmentManager :course-id="courseId" />
      </div>
    </section>

    <!-- ======================================================================== -->
    <!-- 通用：试看设置 Tab（单课 & 系列课通用） -->
    <!-- ======================================================================== -->
    <section v-if="activeTab === 'preview'" class="tab-content">
      <div class="form-section card">
        <h2 class="section-title">试看设置</h2>
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label">课程级试看时长（秒）</label>
            <input v-model.number="form.previewDuration" type="number" class="form-input" placeholder="0 表示不可试看" min="0" max="600" />
            <span class="form-hint">范围 0~600 秒，0 表示不可试看</span>
          </div>
        </div>
      </div>

      <!-- 单课程的课时级试看设置 -->
      <div v-if="isSingleCourse && singleLessonData" class="form-section card">
        <h2 class="section-title">课时试看设置</h2>
        <div class="form-group">
          <label class="radio-item">
            <input type="checkbox" :checked="singleLessonData.isFree" @change="toggleSingleLessonFree" />
            <span>设为试看课时（免费试看）</span>
          </label>
        </div>
      </div>
    </section>

    <!-- ============ 系列课：章节弹窗 ============ -->
    <div v-if="chapterDialogVisible" class="modal-overlay" @click.self="chapterDialogVisible = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingChapter ? '编辑章节' : '添加章节' }}</h3>
          <button class="modal-close" @click="chapterDialogVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">章节标题 <span class="required">*</span></label>
            <input v-model="chapterForm.title" type="text" class="form-input" placeholder="请输入章节标题" />
          </div>
          <div class="form-group">
            <label class="form-label">章节描述</label>
            <textarea v-model="chapterForm.description" class="form-input form-textarea" rows="3" placeholder="可选"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="chapterDialogVisible = false">取消</button>
          <button class="btn btn-primary" @click="saveChapter">{{ editingChapter ? '保存' : '添加' }}</button>
        </div>
      </div>
    </div>

    <!-- ============ 系列课：课时弹窗（含视频上传/选择） ============ -->
    <div v-if="lessonDialogVisible" class="modal-overlay" @click.self="lessonDialogVisible = false">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingLesson ? '编辑课时' : '添加课时' }}</h3>
          <button class="modal-close" @click="lessonDialogVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <!-- 课时标题 -->
          <div class="form-group">
            <label class="form-label">课时标题 <span class="required">*</span></label>
            <input v-model="lessonForm.title" type="text" class="form-input" placeholder="请输入课时标题" />
          </div>

          <!-- 时长展示（由视频自动获取，无需手动填写） -->
          <div class="form-row">
            <div class="form-group form-group--half">
              <label class="form-label">时长（秒）</label>
              <div class="duration-display">
                <span v-if="lessonForm.duration > 0" class="duration-value">{{ lessonForm.duration }} 秒</span>
                <span v-else class="duration-empty">上传视频后自动获取</span>
              </div>
            </div>
            <div class="form-group form-group--half flex items-end">
              <label class="radio-item" style="margin-bottom: 0.625rem;">
                <input type="checkbox" v-model="lessonForm.isFree" />
                <span>设为试看课时</span>
              </label>
            </div>
          </div>

          <!-- ===== 视频关联（集成到课时弹窗中） ===== -->
          <div class="form-group">
            <label class="form-label">课时视频</label>
            <p class="text-muted text-sm" style="margin: -0.25rem 0 0.75rem;">上传新视频或从已有视频库中选择，保存课时时自动关联。</p>

            <!-- 已关联视频展示 -->
            <div v-if="lessonFormVideoId && !lessonVideoMode" class="lesson-video-attached">
              <div class="lesson-video-attached__info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>已关联视频 ID: {{ lessonFormVideoId }}</span>
              </div>
              <div class="lesson-video-attached__actions">
                <button class="btn btn-sm btn-text" @click="lessonVideoMode = 'upload'">更换视频</button>
                <button class="btn btn-sm btn-text text-danger" @click="removeLessonVideo">移除</button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div v-if="!lessonFormVideoId || lessonVideoMode" class="lesson-video-actions">
              <button
                class="btn btn-sm"
                :class="lessonVideoTab === 'upload' ? 'btn-primary' : 'btn-secondary'"
                @click="lessonVideoTab = 'upload'"
              >上传新视频</button>
              <button
                class="btn btn-sm"
                :class="lessonVideoTab === 'select' ? 'btn-primary' : 'btn-secondary'"
                @click="switchToVideoSelect"
              >从视频库选择</button>
              <button
                v-if="lessonFormVideoId"
                class="btn btn-sm btn-text"
                @click="cancelLessonVideoChange"
              >取消变更</button>
            </div>

            <!-- 上传新视频区域 -->
            <div v-if="lessonVideoTab === 'upload' && (!lessonFormVideoId || lessonVideoMode)" class="lesson-video-upload-area">
              <div v-if="!lessonUploadedVideo && !lessonUploadingVideo" class="upload-area upload-area--small" @click="triggerLessonVideoUpload">
                <input ref="lessonVideoInputRef" type="file" accept="video/mp4,video/webm,video/ogg" style="display:none" @change="handleLessonVideoFileSelect" />
                <div class="upload-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <p>点击选择视频文件</p>
                </div>
              </div>
              <div v-if="lessonUploadingVideo" class="upload-area upload-area--small">
                <div class="upload-progress">
                  <div class="progress-bar"><div class="progress-bar__fill" :style="{ width: lessonUploadProgress + '%' }"></div></div>
                  <span class="text-sm">{{ lessonUploadProgress }}%</span>
                </div>
              </div>
              <div v-if="lessonUploadedVideo && !lessonUploadingVideo" class="video-preview">
                <div class="video-preview__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--va-success)" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div class="video-preview__info">
                  <span class="video-preview__name">{{ lessonUploadedVideo.originalName }}</span>
                  <span class="text-muted text-sm">{{ formatFileSize(lessonUploadedVideo.fileSize) }}</span>
                </div>
                <button class="btn btn-sm btn-text text-danger" @click="removeLessonUploadedVideo">移除</button>
              </div>
            </div>

          <!-- ===== 课时课件附件 ===== -->
          <div class="form-group" v-if="editingLesson && editingLesson.id">
            <label class="form-label">课时课件</label>
            <p class="text-muted text-sm" style="margin: -0.25rem 0 0.75rem;">
              课件等资料将挂在该课时下，学生观看该课时时可查看。
            </p>
            <AttachmentManager
              :course-id="courseId"
              :lesson-id="editingLesson.id"
            />
          </div>

          <!-- 视频库选择列表 -->
          <div v-if="lessonVideoTab === 'select'" class="lesson-video-select">
              <div v-if="lessonMyVideos.length === 0" class="empty-tip text-sm">暂无已上传的视频</div>
              <div v-else class="lesson-video-list-scroll">
                <div
                  v-for="video in lessonMyVideos"
                  :key="video.id"
                  class="lesson-video-select-item"
                  :class="{ 'is-selected': lessonFormVideoId === video.id }"
                  @click="lessonFormVideoId = video.id"
                >
                  <div class="lesson-video-select-item__radio">
                    <div class="radio-circle" :class="{ 'radio-circle--active': lessonFormVideoId === video.id }"></div>
                  </div>
                  <div class="lesson-video-select-item__info">
                    <span>{{ video.originalName || '未命名' }}</span>
                    <span class="text-muted text-sm">{{ formatFileSize(video.fileSize) }} · ID: {{ video.id }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="lessonDialogVisible = false">取消</button>
          <button class="btn btn-primary" @click="saveLesson">{{ editingLesson ? '保存' : '添加' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CourseEdit 课程编辑页
 *
 * @description 根据 courseType 动态显示编辑 Tab：
 *              - 单课程（single）：基本信息 | 课程视频 | 试看设置
 *              - 系列课程（series）：基本信息 | 章节编排 | 试看设置
 *              系列课的课时弹窗已集成视频上传/选择功能，无需独立 Tab
 *
 * @param route.params.id - 课程ID
 */
import { ref, reactive, computed, onMounted } from 'vue';
import AttachmentManager from '../../components/AttachmentManager.vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  getCategories,
  getChapters,
  getCourseDetail,
  getCourseLessons,
  updateCourse,
  createChapter,
  updateChapter,
  deleteChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  updateCourseStatus,
  getMyVideos,
  uploadVideo,
  getVideoPlayUrl,
  createCourseLesson,
  updateCourseLesson,
  type CategoryInfo,
  type ChapterInfo,
  type LessonInfo,
  type CourseInfo,
  type CreateCourseParams,
} from '../../api/course';

const route = useRoute();
const router = useRouter();

const courseId = Number(route.params.id);
const saving = ref(false);
const categories = ref<CategoryInfo[]>([]);
const chapters = ref<ChapterInfo[]>([]);
const courseData = ref<CourseInfo | null>(null);

/** 是否为单课程 */
const isSingleCourse = computed(() => courseData.value?.courseType === 'single');

/** 可见的 Tab 列表（根据课程类型动态生成） */
const visibleTabs = computed(() => {
  if (isSingleCourse.value) {
    return [
      { key: 'info', label: '基本信息' },
      { key: 'singleVideo', label: '课程视频' },
      { key: 'attachments', label: '课程资料' },
      { key: 'preview', label: '试看设置' },
    ];
  }
  return [
    { key: 'info', label: '基本信息' },
    { key: 'chapters', label: '章节编排' },
    { key: 'attachments', label: '课程资料' },
    { key: 'preview', label: '试看设置' },
  ];
});

/** 当前激活 Tab */
const activeTab = ref('info');

// 封面上传
const coverInputRef = ref<HTMLInputElement | null>(null);
const coverPreview = ref<string>('');
const coverFile = ref<File | null>(null);

// 表单数据
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

// ============ 单课程：课时视频 ============

/** 单课程的课时数据（从后端加载） */
const singleLessonData = ref<LessonInfo | null>(null);
const singleLessonTitle = ref('');

/** 新上传的视频信息 */
const uploadedVideo = ref<{ id: number; originalName: string; fileSize: number; duration?: number } | null>(null);
const singleVideoInputRef = ref<HTMLInputElement | null>(null);
const uploadingVideo = ref(false);
const uploadProgress = ref(0);
const uploadStatusText = ref('正在上传...');
const savingSingleVideo = ref(false);

// ============ 系列课：章节弹窗 ============

const chapterDialogVisible = ref(false);
const editingChapter = ref<ChapterInfo | null>(null);
const chapterForm = reactive({ title: '', description: '' });

// ============ 系列课：课时弹窗（含视频） ============

const lessonDialogVisible = ref(false);
const editingLesson = ref<LessonInfo | null>(null);
const activeChapterForLesson = ref<ChapterInfo | null>(null);
const lessonForm = reactive({
  title: '',
  description: '',
  duration: 0,
  isFree: false,
});

/** 课时弹窗中的视频ID */
const lessonFormVideoId = ref<number>(0);
/** 课时弹窗中的视频操作模式 */
const lessonVideoMode = ref<'upload' | 'select' | null>(null);
/** 课时弹窗中的视频 Tab */
const lessonVideoTab = ref<'upload' | 'select'>('upload');
/** 课时弹窗中保存变更前的视频ID */
const lessonFormVideoBeforeChange = ref<number>(0);

/** 课时弹窗中的视频上传 */
const lessonVideoInputRef = ref<HTMLInputElement | null>(null);
const lessonUploadingVideo = ref(false);
const lessonUploadProgress = ref(0);
const lessonUploadedVideo = ref<{ id: number; originalName: string; fileSize: number; duration?: number } | null>(null);
const lessonMyVideos = ref<any[]>([]);

// ============ 视频预览 ============
/** 视频预览弹窗 */
const showVideoPreview = ref(false);
/** 视频预览临时 URL */
const videoPreviewUrl = ref('');

/**
 * 预览视频
 * 功能描述：通过视频ID获取播放地址并打开预览弹窗
 * @param videoId 视频ID
 */
const previewVideo = async (videoId: number) => {
  showVideoPreview.value = true;
  videoPreviewUrl.value = '';
  try {
    const result = await getVideoPlayUrl(videoId);
    videoPreviewUrl.value = result.url;
  } catch (error: any) {
    ElMessage.error('获取视频播放地址失败');
    showVideoPreview.value = false;
  }
};

/**
 * 关闭视频预览弹窗
 */
const closeVideoPreview = () => {
  showVideoPreview.value = false;
  videoPreviewUrl.value = '';
};

// ============================================================
// 初始化
// ============================================================

/**
 * 初始化页面数据
 */
const initPage = async () => {
  try {
    categories.value = await getCategories();
    const detail = await getCourseDetail(courseId);
    courseData.value = detail;

    form.title = detail.title;
    form.categoryId = detail.categoryId;
    form.courseType = detail.courseType;
    form.price = detail.price;
    form.originalPrice = detail.originalPrice;
    form.description = detail.description;
    form.tags = detail.tags;
    form.previewDuration = detail.previewDuration;
    form.cover = detail.cover;
    if (detail.cover) coverPreview.value = detail.cover;

    // 根据课程类型加载不同数据
    if (detail.courseType === 'series') {
      chapters.value = await getChapters(courseId);
      activeTab.value = 'info';
    } else {
      // 单课程：加载课时列表，取第一个作为主课时
      await loadSingleLesson();
      activeTab.value = 'info';
    }
  } catch (error: any) {
    ElMessage.error('加载课程数据失败');
    router.push('/teacher/courses');
  }
};

/**
 * 加载单课程的课时数据
 */
const loadSingleLesson = async () => {
  try {
    const lessons = await getCourseLessons(courseId);
    if (lessons && lessons.length > 0) {
      singleLessonData.value = lessons[0];
      singleLessonTitle.value = lessons[0].title || '';
    } else {
      singleLessonData.value = null;
      singleLessonTitle.value = form.title || '';
    }
  } catch {
    singleLessonData.value = null;
    singleLessonTitle.value = form.title || '';
  }
};

// ============================================================
// 封面上传
// ============================================================

const triggerCoverUpload = () => coverInputRef.value?.click();
const handleCoverUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  coverFile.value = file;
  coverPreview.value = URL.createObjectURL(file);
};

// ============================================================
// 保存与提交
// ============================================================

/**
 * 保存草稿（基本信息）
 */
const handleSaveDraft = async () => {
  if (!form.title.trim()) { ElMessage.warning('请输入课程标题'); return; }
  saving.value = true;
  try {
    await updateCourse(courseId, {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      tags: form.tags?.trim() || '',
    });
    if (coverFile.value) {
      const formData = new FormData();
      formData.append('file', coverFile.value);
      const axios = (await import('../../api/request')).default;
      await axios.post(`/courses/${courseId}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      coverFile.value = null;
    }
    ElMessage.success('课程已保存');
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally { saving.value = false; }
};

/**
 * 提交审核
 */
const handleSubmitReview = async () => {
  if (!form.title.trim()) { ElMessage.warning('请先完善课程信息'); return; }
  saving.value = true;
  try {
    await handleSaveDraft();
    await updateCourseStatus(courseId, 'pending');
    ElMessage.success('已提交审核');
    router.push('/teacher/courses');
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败');
  } finally { saving.value = false; }
};

/**
 * 切换单课程课时试看状态
 */
const toggleSingleLessonFree = async () => {
  if (!singleLessonData.value?.id) return;
  try {
    const newIsFree = !singleLessonData.value.isFree;
    await updateCourseLesson(courseId, singleLessonData.value.id, { isFree: newIsFree });
    singleLessonData.value.isFree = newIsFree;
    ElMessage.success(newIsFree ? '已设为试看课时' : '已取消试看');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

// ============================================================
// 单课程：视频管理
// ============================================================

/** 触发单课程视频上传 */
const triggerSingleVideoUpload = () => {
  singleVideoInputRef.value?.click();
};

/** 处理单课程视频拖拽 */
const handleSingleVideoDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('video/')) {
    startSingleVideoUpload(file);
  }
};

/** 处理单课程视频文件选择 */
const handleSingleVideoFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) startSingleVideoUpload(file);
};

/** 单课程视频上传 */
const startSingleVideoUpload = async (file: File) => {
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
        uploadStatusText.value = p < 100 ? '正在上传...' : '正在处理...';
      },
    });
    uploadedVideo.value = {
      id: result.id,
      originalName: result.originalName || file.name,
      fileSize: result.fileSize || file.size,
      duration: result.duration,
    };
    ElMessage.success('视频上传成功，请点击"保存课时视频"确认关联');
  } catch (error: any) {
    ElMessage.error(error.message || '视频上传失败');
    uploadedVideo.value = null;
  } finally {
    uploadingVideo.value = false;
    uploadProgress.value = 0;
  }
};

/** 移除刚上传的视频 */
const removeUploadedVideo = () => {
  uploadedVideo.value = null;
  if (singleVideoInputRef.value) singleVideoInputRef.value.value = '';
};

/** 移除单课程已关联的视频 */
const removeSingleVideo = async () => {
  if (!singleLessonData.value?.id) return;
  if (!confirm('确定移除该课时的视频关联吗？视频文件不会被删除，仅取消关联。')) return;
  try {
    // 传 videoId=0 表示清除视频关联（后端已识别此语义，不校验视频表）
    await updateCourseLesson(courseId, singleLessonData.value.id, { videoId: 0, duration: 0 });
    singleLessonData.value.videoId = 0;
    singleLessonData.value.duration = 0;
    ElMessage.success('视频已移除');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

/** 保存单课程课时视频 */
const saveSingleLessonVideo = async () => {
  const lessonId = singleLessonData.value?.id;
  const title = singleLessonTitle.value.trim() || form.title.trim();

  if (!title) { ElMessage.warning('请输入课时标题'); return; }

  savingSingleVideo.value = true;
  try {
    if (lessonId) {
      const updateData: any = { title };
      if (uploadedVideo.value) {
        updateData.videoId = uploadedVideo.value.id;
        // 如果上传时已获取了视频时长，自动填入
        if (uploadedVideo.value.duration) {
          updateData.duration = uploadedVideo.value.duration;
        }
      }
      await updateCourseLesson(courseId, lessonId, updateData);
    } else {
      if (!uploadedVideo.value) { ElMessage.warning('请先上传视频'); return; }
      const created = await createCourseLesson(courseId, {
        title,
        videoId: uploadedVideo.value.id,
        duration: uploadedVideo.value.duration || 0,
        isFree: false,
      });
      singleLessonData.value = created;
    }

    if (uploadedVideo.value) {
      if (singleLessonData.value) {
        singleLessonData.value.videoId = uploadedVideo.value.id;
        singleLessonData.value.title = title;
      }
      uploadedVideo.value = null;
    }

    ElMessage.success('课时视频已保存');
    await loadSingleLesson();
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    savingSingleVideo.value = false;
  }
};

// ============================================================
// 系列课：章节操作
// ============================================================

const openChapterDialog = () => {
  editingChapter.value = null;
  chapterForm.title = '';
  chapterForm.description = '';
  chapterDialogVisible.value = true;
};

const editChapter = (chapter: ChapterInfo) => {
  editingChapter.value = chapter;
  chapterForm.title = chapter.title;
  chapterForm.description = chapter.description || '';
  chapterDialogVisible.value = true;
};

const saveChapter = async () => {
  if (!chapterForm.title.trim()) { ElMessage.warning('请输入章节标题'); return; }
  try {
    if (editingChapter.value) {
      await updateChapter(courseId, editingChapter.value.id, {
        title: chapterForm.title.trim(),
        description: chapterForm.description.trim() || undefined,
      });
    } else {
      await createChapter(courseId, {
        title: chapterForm.title.trim(),
        description: chapterForm.description.trim() || undefined,
      });
    }
    chapterDialogVisible.value = false;
    chapters.value = await getChapters(courseId);
  } catch (error: any) { ElMessage.error(error.message || '操作失败'); }
};

const confirmDeleteChapter = async (chapter: ChapterInfo) => {
  if (!confirm(`确定删除章节「${chapter.title}」吗？该章节下的所有课时也将被删除。`)) return;
  try {
    await deleteChapter(courseId, chapter.id);
    chapters.value = await getChapters(courseId);
  } catch (error: any) { ElMessage.error(error.message || '删除失败'); }
};

// ============================================================
// 系列课：课时操作（含视频集成）
// ============================================================

const openLessonDialog = (chapter: ChapterInfo) => {
  activeChapterForLesson.value = chapter;
  editingLesson.value = null;
  resetLessonForm();
  lessonDialogVisible.value = true;
};

const editLesson = (chapter: ChapterInfo, lesson: LessonInfo) => {
  activeChapterForLesson.value = chapter;
  editingLesson.value = lesson;
  lessonForm.title = lesson.title;
  lessonForm.description = lesson.description || '';
  lessonForm.duration = lesson.duration || 0;
  lessonForm.isFree = lesson.isFree;
  lessonFormVideoId.value = lesson.videoId || 0;
  lessonFormVideoBeforeChange.value = lesson.videoId || 0;
  lessonVideoMode.value = null;
  lessonVideoTab.value = 'upload';
  lessonUploadedVideo.value = null;
  lessonDialogVisible.value = true;
};

/**
 * 重置课时表单状态
 */
const resetLessonForm = () => {
  lessonForm.title = '';
  lessonForm.description = '';
  lessonForm.duration = 0;
  lessonForm.isFree = false;
  lessonFormVideoId.value = 0;
  lessonFormVideoBeforeChange.value = 0;
  lessonVideoMode.value = null;
  lessonVideoTab.value = 'upload';
  lessonUploadedVideo.value = null;
};

/**
 * 切换到视频库选择模式
 */
const switchToVideoSelect = async () => {
  lessonVideoTab.value = 'select';
  lessonVideoMode.value = 'select';
  try {
    const res = await getMyVideos({ page: 1, pageSize: 100 });
    lessonMyVideos.value = res.items || [];
  } catch {
    lessonMyVideos.value = [];
  }
};

/**
 * 取消视频变更
 */
const cancelLessonVideoChange = () => {
  lessonFormVideoId.value = lessonFormVideoBeforeChange.value;
  lessonUploadedVideo.value = null;
  lessonVideoMode.value = null;
  lessonVideoTab.value = 'upload';
};

/**
 * 移除课时弹窗中的视频关联
 */
const removeLessonVideo = () => {
  lessonFormVideoId.value = 0;
  lessonUploadedVideo.value = null;
  lessonVideoMode.value = 'upload';
  lessonVideoTab.value = 'upload';
};

/**
 * 触发课时弹窗中的视频上传
 */
const triggerLessonVideoUpload = () => {
  lessonVideoInputRef.value?.click();
};

/**
 * 处理课时弹窗中的视频文件选择
 */
const handleLessonVideoFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) startLessonVideoUpload(file);
};

/**
 * 课时弹窗中的视频上传
 * @param file 视频文件
 */
const startLessonVideoUpload = async (file: File) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.warning('仅支持 mp4/webm/ogg 格式的视频文件');
    return;
  }
  lessonUploadingVideo.value = true;
  lessonUploadProgress.value = 0;
  try {
    const result = await uploadVideo(file, {
      onProgress: (p) => { lessonUploadProgress.value = p; },
    });
    lessonUploadedVideo.value = {
      id: result.id,
      originalName: result.originalName || file.name,
      fileSize: result.fileSize || file.size,
      duration: result.duration,
    };
    lessonFormVideoId.value = result.id;
    // 自动从上传结果中填充时长，避免手动输入
    if (result.duration > 0) {
      lessonForm.duration = result.duration;
    }
    lessonVideoMode.value = null;
    ElMessage.success('视频上传成功，时长已自动填入');
  } catch (error: any) {
    ElMessage.error(error.message || '视频上传失败');
    lessonUploadedVideo.value = null;
  } finally {
    lessonUploadingVideo.value = false;
    lessonUploadProgress.value = 0;
  }
};

/**
 * 移除课时弹窗中新上传的视频
 */
const removeLessonUploadedVideo = () => {
  lessonUploadedVideo.value = null;
  lessonFormVideoId.value = lessonFormVideoBeforeChange.value;
  if (lessonVideoInputRef.value) lessonVideoInputRef.value.value = '';
};

/**
 * 保存课时（添加或更新，含视频关联）
 */
const saveLesson = async () => {
  if (!lessonForm.title.trim()) { ElMessage.warning('请输入课时标题'); return; }
  if (!activeChapterForLesson.value) return;

  const chapterId = activeChapterForLesson.value.id;
  const videoId = lessonFormVideoId.value || undefined;

  try {
    if (editingLesson.value) {
      await updateLesson(courseId, chapterId, editingLesson.value.id, {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim() || undefined,
        duration: lessonForm.duration || undefined,
        videoId: videoId,
        isFree: lessonForm.isFree,
      });
      ElMessage.success('课时已更新');
    } else {
      if (!videoId) {
        ElMessage.warning('请上传或选择课时视频');
        return;
      }
      await createLesson(courseId, chapterId, {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim() || undefined,
        duration: lessonForm.duration || undefined,
        videoId: videoId,
        isFree: lessonForm.isFree,
      });
      ElMessage.success('课时已添加');
    }
    lessonDialogVisible.value = false;
    chapters.value = await getChapters(courseId);
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

const confirmDeleteLesson = async (chapter: ChapterInfo, lesson: LessonInfo) => {
  if (!confirm(`确定删除课时「${lesson.title}」吗？`)) return;
  try {
    await deleteLesson(courseId, chapter.id, lesson.id);
    chapters.value = await getChapters(courseId);
  } catch (error: any) { ElMessage.error(error.message || '删除失败'); }
};

// ============================================================
// 工具函数
// ============================================================

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '未知';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ============================================================

onMounted(() => { initPage(); });
</script>

<style scoped>
/* ============================================================
 * 页面头部
 * ============================================================ */
.edit-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.edit-header__left { display: flex; flex-direction: column; gap: 0.5rem; }
.edit-header__right { display: flex; gap: 0.75rem; flex-shrink: 0; }

.back-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--va-on-background-secondary);
  text-decoration: none;
  transition: var(--va-transition);
}
.back-link:hover { color: var(--va-primary); }

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0;
}

.page-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--va-muted);
}

.course-type-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.0375rem;
  text-transform: uppercase;
  background-color: var(--va-primary-alpha);
  color: var(--va-primary);
}

/* ---- Alert 提示 ---- */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--va-block-border-radius);
  margin-bottom: 1rem;
  font-size: 0.8125rem;
  line-height: 1.5;
}
.alert--warning {
  background-color: rgba(245,158,11,0.1);
  color: var(--va-warning);
  border: 1px solid rgba(245,158,11,0.2);
}
.alert--danger {
  background-color: rgba(239,68,68,0.1);
  color: var(--va-danger);
  border: 1px solid rgba(239,68,68,0.2);
}
.alert__icon { flex-shrink: 0; margin-top: 0.125rem; }
.alert__content { flex: 1; }

/* ---- Tab 导航 ---- */
.tab-bar {
  display: flex;
  gap: 0;
  padding: 0;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--va-on-background-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: var(--va-transition);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}
.tab-item:hover { color: var(--va-on-background-primary); background-color: var(--va-background-hover); }
.tab-item--active { color: var(--va-primary); border-bottom-color: var(--va-primary); }

/* ---- Tab 内容 ---- */
.tab-content { display: flex; flex-direction: column; gap: 1.5rem; max-width: 800px; }
.form-section { padding: 1.5rem; }

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: var(--va-block-border);
}

.section-desc {
  font-size: 0.8125rem;
  color: var(--va-muted);
  margin: -0.5rem 0 1rem;
}

/* ---- 表单 ---- */
.form-group { margin-bottom: 1rem; position: relative; }
.form-row { display: flex; gap: 1rem; }
.form-group--half { flex: 1; min-width: 0; }

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  margin-bottom: 0.375rem;
  letter-spacing: var(--va-letter-spacing);
}
.required { color: var(--va-danger); }

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
.form-input:focus { border-color: var(--va-primary); box-shadow: 0 0 0 2px var(--va-primary-alpha); }
.form-input::placeholder { color: var(--va-on-background-element); }
.form-input:disabled { background-color: var(--va-background-secondary); color: var(--va-muted); }
.form-textarea { resize: vertical; min-height: 80px; }
.form-hint { display: block; font-size: 0.75rem; color: var(--va-muted); margin-top: 0.25rem; text-align: right; }
select.form-input { appearance: auto; }

.radio-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--va-on-background-secondary);
}

.form-actions { margin-top: 1rem; text-align: right; }

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
.cover-upload:hover { border-color: var(--va-primary); border-style: solid; }

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
.cover-preview { width: 100%; height: 100%; object-fit: cover; }

/* ---- 视频信息卡片（单课程） ---- */
.video-info-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-secondary);
}
.video-info-card__icon { flex-shrink: 0; }
.video-info-card__body { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.video-info-card__name { font-size: 0.875rem; font-weight: 500; color: var(--va-on-background-primary); }

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
.upload-area:hover { border-color: var(--va-primary); }
.upload-area--small { min-height: 100px; padding: 1rem; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: var(--va-muted); }
.upload-placeholder p { margin: 0; font-size: 0.875rem; }
.upload-progress { width: 100%; max-width: 300px; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }

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

.video-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-secondary);
}
.video-preview__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--va-background-primary);
  border-radius: var(--va-square-border-radius);
}
.video-preview__info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.video-preview__name { font-size: 0.875rem; font-weight: 500; color: var(--va-on-background-primary); word-break: break-all; }

/* ---- 章节 ---- */
.empty-tip { text-align: center; padding: 2rem; color: var(--va-muted); font-size: 0.875rem; }
.chapter-list { display: flex; flex-direction: column; gap: 0.75rem; }
.chapter-item { border: var(--va-block-border); border-radius: var(--va-square-border-radius); overflow: hidden; }
.chapter-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--va-background-secondary);
}
.chapter-order { font-size: 0.75rem; font-weight: 600; color: var(--va-primary); white-space: nowrap; }
.chapter-title { flex: 1; font-size: 0.875rem; font-weight: 500; color: var(--va-on-background-primary); }
.chapter-actions { display: flex; gap: 0.25rem; }

.lesson-list { padding: 0.5rem 1rem 0.5rem 2rem; }
.lesson-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--va-background-element);
}
.lesson-item:last-child { border-bottom: none; }
.lesson-order { font-size: 0.75rem; font-weight: 600; color: var(--va-on-background-element); white-space: nowrap; min-width: 3rem; }
.lesson-title { flex: 1; font-size: 0.875rem; color: var(--va-on-background-primary); }
.lesson-duration { font-size: 0.75rem; color: var(--va-muted); white-space: nowrap; }
.lesson-video-status { font-size: 0.625rem; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-weight: 600; }
.status--linked { color: var(--va-success); background-color: rgba(16,185,129,0.12); }
.status--empty { color: var(--va-muted); background-color: var(--va-background-element); }
.lesson-free-badge { font-size: 0.625rem; padding: 0.1rem 0.3rem; }
.lesson-actions { display: flex; gap: 0.25rem; }
.empty-lessons { padding: 0.5rem 1rem 0.5rem 2rem; font-size: 0.75rem; color: var(--va-muted); }

/* ---- 课时弹窗：视频关联 ---- */
.lesson-video-attached {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  background-color: var(--va-background-secondary);
  margin-bottom: 0.75rem;
}
.lesson-video-attached__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--va-on-background-primary);
}
.lesson-video-attached__actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}
.lesson-video-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.lesson-video-upload-area {
  margin-bottom: 0.5rem;
}
.lesson-video-select {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
}
.lesson-video-list-scroll { padding: 0.25rem; }
.lesson-video-select-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--va-square-border-radius);
  cursor: pointer;
  transition: var(--va-transition);
}
.lesson-video-select-item:hover { background-color: var(--va-background-hover); }
.lesson-video-select-item.is-selected { background-color: var(--va-primary-light-alpha); }
.lesson-video-select-item__radio { flex-shrink: 0; }
.radio-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--va-background-border);
  transition: var(--va-transition);
}
.radio-circle--active {
  border-color: var(--va-primary);
  background-color: var(--va-primary);
  box-shadow: inset 0 0 0 3px var(--va-background-primary);
}
.lesson-video-select-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  font-size: 0.8125rem;
}

/* ---- 弹窗 ---- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-dialog {
  background-color: var(--va-background-primary);
  border-radius: var(--va-block-border-radius);
  box-shadow: var(--va-box-shadow);
  width: 480px;
  max-width: 90vw;
}
.modal-lg { width: 640px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: var(--va-block-border);
}
.modal-title { font-size: 1.0625rem; font-weight: 600; color: var(--va-on-background-primary); margin: 0; }
.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--va-on-background-element);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.modal-body { padding: 1.25rem; max-height: 70vh; overflow-y: auto; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: var(--va-block-border);
}

/* ---- 工具类 ---- */
.btn-sm { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
.btn-text { background: none; border: none; color: var(--va-on-background-secondary); cursor: pointer; }
.btn-text:hover { color: var(--va-primary); }
.text-sm { font-size: 0.8125rem; }
.text-base { font-size: 0.875rem; }
.text-muted { color: var(--va-muted); }
.text-primary { color: var(--va-primary); }
.text-danger { color: var(--va-danger) !important; }
.mb-2 { margin-bottom: 0.5rem; }
.flex { display: flex; }
.items-end { align-items: flex-end; }
.gap-sm { gap: 0.375rem; }

/* ---- 视频预览弹窗 ---- */
.video-preview-modal {
  width: 720px;
  max-width: 95vw;
}

.video-preview-body {
  padding: 0;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.video-player {
  width: 100%;
  max-height: 70vh;
  display: block;
}

.video-loading {
  padding: 3rem;
  text-align: center;
}

.video-info-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
