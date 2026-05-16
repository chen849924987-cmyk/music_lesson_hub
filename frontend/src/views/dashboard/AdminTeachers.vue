<!--
 * AdminTeachers - 管理员教师管理页面组件
 *
 * 功能描述：DAW（数字音频工作站）主题的教师认证管理表格页面，
 *           支持查看教师列表、分页、详情、认证/取消认证操作
 *
 * 设计参考：Vuestic UI 双主题设计体系，结合 DAW 创意美学
 -->

<template>
  <div class="admin-teachers">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <h2 class="page-title gradient-text">教师管理</h2>
        <p class="page-subtitle">管理平台教师认证信息</p>
      </div>
      <div class="page-actions">
        <el-input
          v-model="searchText"
          placeholder="搜索教师姓名..."
          clearable
          class="daw-search"
          :prefix-icon="SearchIcon"
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container card">
      <el-table
        :data="teachers"
        v-loading="loading"
        style="width: 100%"
        class="daw-table"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户信息" min-width="150">
          <template #default="{ row }">
            <div class="user-info-cell">
              <span class="user-info-name">{{ row.user?.nickname || row.user?.username || '-' }}</span>
              <span class="user-info-email">{{ row.user?.email || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column label="认证状态" width="110">
          <template #default="{ row }">
            <span class="badge" :class="row.isVerified ? 'badge--success' : 'badge--warning'">
              {{ row.isVerified ? '已认证' : '未认证' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="specialties" label="擅长领域" min-width="150">
          <template #default="{ row }">
            <span class="text-truncate">{{ row.specialties || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="courseCount" label="课程数" width="80" align="center" />
        <el-table-column prop="studentCount" label="学员数" width="80" align="center" />
        <el-table-column prop="rating" label="评分" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.rating > 0">{{ Number(row.rating).toFixed(2) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isVerified"
              type="primary"
              size="small"
              @click="handleVerify(row)"
              :loading="processingId === row.id"
            >
              认证
            </el-button>
            <el-button
              v-if="row.isVerified"
              type="warning"
              size="small"
              @click="handleUnverify(row)"
              :loading="processingId === row.id"
            >
              取消认证
            </el-button>
            <el-button type="info" size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
          background
          small
        />
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && teachers.length === 0">
        <div class="empty-waveform">
          <span
            v-for="n in 24"
            :key="n"
            class="empty-bar"
            :class="{ 'empty-bar--glow': n % 4 === 0 }"
            :style="{ animationDelay: `${n * 0.06}s` }"
          ></span>
        </div>
        <span class="empty-icon">
          <svg class="empty-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
          </svg>
        </span>
        <p class="empty-title">暂无教师数据</p>
        <p class="empty-text">教师列表为空</p>
      </div>
    </div>

    <!-- 教师详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="教师详情"
      width="600px"
      class="daw-dialog"
      destroy-on-close
    >
      <template v-if="detailData">
        <div class="detail-section">
          <div class="detail-row">
            <span class="detail-label">教师ID</span>
            <span class="detail-value">{{ detailData.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">关联用户</span>
            <span class="detail-value">{{ detailData.user?.nickname || detailData.user?.username || '-' }}（{{ detailData.user?.email || '-' }}）</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">真实姓名</span>
            <span class="detail-value">{{ detailData.realName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">个人简介</span>
            <span class="detail-value">{{ detailData.introduction || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">擅长领域</span>
            <span class="detail-value">{{ detailData.specialties || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">联系方式</span>
            <span class="detail-value">{{ detailData.contactInfo || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">收款账号</span>
            <span class="detail-value">{{ detailData.paymentAccount || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">认证状态</span>
            <span class="detail-value">
              <span class="badge" :class="detailData.isVerified ? 'badge--success' : 'badge--warning'">
                {{ detailData.isVerified ? '已认证' : '未认证' }}
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">课程数 / 学员数</span>
            <span class="detail-value">{{ detailData.courseCount }} / {{ detailData.studentCount }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">评分</span>
            <span class="detail-value">{{ detailData.rating > 0 ? Number(detailData.rating).toFixed(2) : '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ formatDate(detailData.createdAt) }}</span>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * AdminTeachers 页面组件
 *
 * @description 管理员教师管理页面，支持查看教师列表、分页、认证/取消认证、查看详情
 */
import { ref, onMounted } from 'vue';
import { Search as SearchIcon } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getTeachers, reviewTeacher, type TeacherInfo } from '@/api/admin';

/** 教师列表数据 */
const teachers = ref<TeacherInfo[]>([]);
/** 加载状态 */
const loading = ref(false);
/** 总数 */
const total = ref(0);
/** 当前页码 */
const currentPage = ref(1);
/** 每页条数 */
const pageSize = ref(20);
/** 搜索文本 */
const searchText = ref('');
/** 正在处理操作的用户ID */
const processingId = ref<number | null>(null);
/** 详情弹窗可见性 */
const detailVisible = ref(false);
/** 详情弹窗数据 */
const detailData = ref<TeacherInfo | null>(null);

/**
 * 加载教师列表
 */
async function loadTeachers() {
  loading.value = true;
  try {
    const result = await getTeachers({
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    teachers.value = result.items;
    total.value = result.meta.total;
  } catch {
    teachers.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 生命周期：组件挂载时加载 */
onMounted(() => {
  loadTeachers();
});

/** 搜索回车 */
function handleSearch() {
  currentPage.value = 1;
  loadTeachers();
}

/** 搜索框清空 */
function handleSearchClear() {
  searchText.value = '';
  currentPage.value = 1;
  loadTeachers();
}

/** 分页切换 */
function handlePageChange(page: number) {
  currentPage.value = page;
  loadTeachers();
}

/**
 * 认证教师
 */
async function handleVerify(teacher: TeacherInfo) {
  processingId.value = teacher.id;
  try {
    await reviewTeacher(teacher.id, true);
    ElMessage.success(`${teacher.realName} 已认证为教师`);
    loadTeachers();
  } catch {
    // 错误已处理
  } finally {
    processingId.value = null;
  }
}

/**
 * 取消教师认证
 */
async function handleUnverify(teacher: TeacherInfo) {
  processingId.value = teacher.id;
  try {
    await reviewTeacher(teacher.id, false);
    ElMessage.success(`已取消 ${teacher.realName} 的教师认证`);
    loadTeachers();
  } catch {
    // 错误已处理
  } finally {
    processingId.value = null;
  }
}

/**
 * 查看教师详情
 */
function handleViewDetail(teacher: TeacherInfo) {
  detailData.value = teacher;
  detailVisible.value = true;
}

/**
 * 格式化日期
 * @param dateStr 日期字符串
 * @returns 格式化后的日期
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<style scoped>
/* ============================================================
 * AdminTeachers 样式
 * 使用 --va-* 双主题 CSS 变量 + DAW 音乐美学元素
 * ============================================================ */

.admin-teachers {
  max-width: 1200px;
}

/* ---- 页面头部 ---- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title {
  font-size: 22px;
  font-family: var(--va-font-family);
  margin: 0 0 4px;
}
.page-subtitle {
  font-size: 13px;
  color: var(--va-on-background-element);
  margin: 0;
}
.page-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.daw-search {
  width: 220px;
}

:deep(.daw-search .el-input__wrapper) {
  background: var(--va-background-primary);
  border: 1px solid var(--va-block-border);
  box-shadow: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}
:deep(.daw-search .el-input__wrapper:hover) {
  border-color: var(--va-primary);
}
:deep(.daw-search .el-input__wrapper.is-focus) {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 1px var(--va-primary);
}
:deep(.daw-search .el-input__inner) {
  color: var(--va-on-background-primary);
  caret-color: var(--va-primary);
}
:deep(.daw-search .el-input__prefix) {
  color: var(--va-on-background-element);
}

/* ---- 用户信息单元格 ---- */
.user-info-cell {
  display: flex;
  flex-direction: column;
}
.user-info-name {
  font-weight: 600;
  color: var(--va-on-background-primary);
  font-size: 13px;
}
.user-info-email {
  font-size: 11px;
  color: var(--va-on-background-element);
}

/* ---- 文字截断 ---- */
.text-truncate {
  display: inline-block;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.text-muted {
  color: var(--va-on-background-element);
}

/* ---- 暗色表格 ---- */
.table-container {
  padding: 0;
  overflow: hidden;
}

:deep(.daw-table) {
  --el-table-header-bg-color: var(--va-background-element);
  --el-table-bg-color: var(--va-background-primary);
  --el-table-tr-bg-color: var(--va-background-primary);
  --el-table-td-bg-color: var(--va-background-primary);
  --el-table-border-color: var(--va-block-border);
  --el-table-header-text-color: var(--va-on-background-element);
  --el-table-text-color: var(--va-on-background-primary);
  --el-table-row-hover-bg-color: var(--va-background-hover);
}

:deep(.daw-table th.el-table__cell) {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
:deep(.daw-table .el-table__cell) {
  border-bottom: 1px solid var(--va-block-border);
}

/* ---- 分页 ---- */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--va-block-border);
}
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: var(--va-primary);
}

/* ---- 空状态 ---- */
.empty-state {
  text-align: center;
  padding: 60px 24px 48px;
  position: relative;
}
.empty-waveform {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  justify-content: center;
  height: 40px;
  margin-bottom: 24px;
  opacity: 0.15;
}
.empty-bar {
  width: 3px;
  border-radius: 2px;
  background: var(--va-primary);
  animation: emptyBarWave 1.4s ease-in-out infinite alternate;
}
.empty-bar--glow {
  background: var(--va-secondary);
  box-shadow: 0 0 6px var(--va-primary-alpha);
}
.empty-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
  filter: grayscale(0.3);
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 4px;
}
.empty-text {
  font-size: 13px;
  color: var(--va-on-background-element);
  margin: 0;
}

/* ---- 详情弹窗 ---- */
:deep(.daw-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--va-block-border);
  padding: 16px 24px;
  margin: 0;
}
:deep(.daw-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--va-on-background-primary);
}
:deep(.daw-dialog .el-dialog__body) {
  padding: 24px;
}
:deep(.daw-dialog .el-dialog__footer) {
  border-top: 1px solid var(--va-block-border);
  padding: 12px 24px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.detail-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--va-on-background-secondary);
}
.detail-value {
  flex: 1;
  font-size: 13px;
  color: var(--va-on-background-primary);
  line-height: 1.5;
}
</style>
