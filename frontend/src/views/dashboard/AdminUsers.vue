<!--
 * AdminUsers - 管理员用户管理页面组件
 *
 * 功能描述：DAW（数字音频工作站）主题的用户管理表格页面，
 *           支持关键词搜索、角色筛选、启用/禁用、删除用户等操作
 *
 * 设计参考：Vuestic UI 双主题设计体系，结合 DAW 创意美学
 -->

<template>
  <div class="admin-users">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <h2 class="page-title gradient-text">用户管理</h2>
        <p class="page-subtitle">管理平台所有注册用户</p>
      </div>
    <div class="page-actions">
        <!-- 角色筛选 -->
        <el-select
          v-model="roleFilter"
          placeholder="所有角色"
          clearable
          class="daw-select"
          @change="handleFilterChange"
        >
          <el-option label="所有角色" value="" />
          <el-option label="超级管理员" value="super_admin" />
          <el-option label="审核员" value="reviewer" />
          <el-option label="运营管理员" value="operator" />
          <el-option label="教师" value="teacher" />
          <el-option label="制作人" value="student" />
        </el-select>
        <!-- 搜索框 -->
        <el-input
          v-model="searchText"
          placeholder="搜索用户名/昵称..."
          clearable
          class="daw-search"
          :prefix-icon="SearchIcon"
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        />
        <!-- 创建账号按钮 -->
        <el-button type="primary" @click="showCreateDialog = true">
          + 创建账号
        </el-button>
      </div>
    </div>

    <!-- 创建账号弹窗 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建账号"
      width="420px"
      class="daw-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
        label-position="top"
        class="create-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="createForm.username"
            placeholder="请输入用户名"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            show-password
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" placeholder="请选择角色" style="width: 100%;">
            <el-option label="审核员" value="reviewer" />
            <el-option label="运营管理员" value="operator" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="creating"
          @click="handleCreateAccount"
        >
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 数据表格 -->
    <div class="table-container card">
      <el-table
        :data="users"
        v-loading="loading"
        style="width: 100%"
        class="daw-table"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="130" />
        <el-table-column prop="nickname" label="昵称" min-width="130" />
        <el-table-column label="角色" width="130">
          <template #default="{ row }">
            <span class="badge" :class="roleBadgeClass(row.role)">
              {{ roleLabel(row.role) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span class="badge" :class="row.isActive ? 'badge--success' : 'badge--danger'">
              {{ row.isActive ? '正常' : '禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              :type="row.isActive ? 'warning' : 'success'"
              size="small"
              @click="handleToggleActive(row)"
              :loading="togglingId === row.id"
            >
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              :loading="deletingId === row.id"
            >
              删除
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
      <div class="empty-state" v-if="!loading && users.length === 0">
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
            <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </span>
        <p class="empty-title">暂无用户数据</p>
        <p class="empty-text">请调整搜索条件或稍后再试</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AdminUsers 页面组件
 *
 * @description 管理员用户管理页面，支持搜索、筛选、启用/禁用、删除用户
 */
import { ref, reactive, onMounted } from 'vue';
import { Search as SearchIcon } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getUsers,
  toggleUserActive,
  deleteUser,
  createAccount,
  type UserInfo,
} from '@/api/admin';
import type { FormInstance, FormRules } from 'element-plus';

/** 创建账号弹窗表单引用 */
const createFormRef = ref<FormInstance>();
/** 创建账号弹窗显隐 */
const showCreateDialog = ref(false);
/** 创建账号表单数据 */
const createForm = reactive({
  username: '',
  password: '',
  role: '' as 'reviewer' | 'operator' | '',
});
/** 创建账号表单校验规则 */
const createRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度应为 3~50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度至少 6 位', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
};
/** 创建账号提交中 */
const creating = ref(false);

/** 用户列表数据 */
const users = ref<UserInfo[]>([]);
/** 加载状态 */
const loading = ref(false);
/** 用户总数 */
const total = ref(0);
/** 当前页码 */
const currentPage = ref(1);
/** 每页条数 */
const pageSize = ref(20);
/** 搜索关键词 */
const searchText = ref('');
/** 角色筛选 */
const roleFilter = ref('');
/** 正在切换状态的用户ID */
const togglingId = ref<number | null>(null);
/** 正在删除的用户ID */
const deletingId = ref<number | null>(null);

/**
 * 加载用户列表
 */
async function loadUsers() {
  loading.value = true;
  try {
    const result = await getUsers({
      page: currentPage.value,
      pageSize: pageSize.value,
      role: roleFilter.value || undefined,
      keyword: searchText.value || undefined,
    });
    users.value = result.items;
    total.value = result.meta.total;
  } catch {
    users.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 生命周期：组件挂载时加载 */
onMounted(() => {
  loadUsers();
});

/** 搜索回车触发 */
function handleSearch() {
  currentPage.value = 1;
  loadUsers();
}

/** 搜索框清空 */
function handleSearchClear() {
  searchText.value = '';
  currentPage.value = 1;
  loadUsers();
}

/** 角色筛选变化 */
function handleFilterChange() {
  currentPage.value = 1;
  loadUsers();
}

/** 分页切换 */
function handlePageChange(page: number) {
  currentPage.value = page;
  loadUsers();
}

/**
 * 提交创建账号
 */
async function handleCreateAccount() {
  if (!createFormRef.value) return;
  try {
    await createFormRef.value.validate();
  } catch {
    return;
  }
  creating.value = true;
  try {
    await createAccount({
      username: createForm.username,
      password: createForm.password,
      role: createForm.role as 'reviewer' | 'operator',
    });
    ElMessage.success('账号创建成功');
    showCreateDialog.value = false;
    createForm.username = '';
    createForm.password = '';
    createForm.role = '';
    loadUsers();
  } catch {
    // 错误已由请求拦截器处理
  } finally {
    creating.value = false;
  }
}

/**
 * 切换用户启用/禁用状态
 */
async function handleToggleActive(user: UserInfo) {
  togglingId.value = user.id;
  try {
    await toggleUserActive(user.id);
    ElMessage.success(user.isActive ? '用户已禁用' : '用户已启用');
    // 刷新列表
    loadUsers();
  } catch {
    // 错误已由请求拦截器处理
  } finally {
    togglingId.value = null;
  }
}

/**
 * 删除用户（需要二次确认）
 */
async function handleDelete(user: UserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${user.username}」(${user.nickname || '未设置昵称'})吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    );

    deletingId.value = user.id;
    await deleteUser(user.id);
    ElMessage.success('用户已删除');
    loadUsers();
  } catch {
    // 取消或错误都不处理
  } finally {
    deletingId.value = null;
  }
}

/**
 * 角色标签显示文本
 * @param role 角色名
 * @returns 显示文本
 */
function roleLabel(role: string): string {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    reviewer: '审核员',
    operator: '运营管理员',
    teacher: '教师',
    student: '制作人',
  };
  return map[role] || role;
}

/**
 * 角色徽章样式类
 * @param role 角色名
 * @returns CSS class 名
 */
function roleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'badge--danger',
    reviewer: 'badge--info',
    operator: 'badge--warning',
    teacher: 'badge--primary',
    student: 'badge--success',
  };
  return map[role] || 'badge--info';
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
 * AdminUsers 样式
 * 使用 --va-* 双主题 CSS 变量 + DAW 音乐美学元素
 * ============================================================ */

.admin-users {
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
  flex-wrap: wrap;
}

/* ---- 搜索框与下拉框 ---- */
.daw-search {
  width: 220px;
}
.daw-select {
  width: 150px;
}
:deep(.daw-search .el-input__wrapper),
:deep(.daw-select .el-select__wrapper) {
  background: var(--va-background-primary);
  border: 1px solid var(--va-block-border);
  box-shadow: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}
:deep(.daw-search .el-input__wrapper:hover),
:deep(.daw-select .el-select__wrapper:hover) {
  border-color: var(--va-primary);
}
:deep(.daw-search .el-input__wrapper.is-focus),
:deep(.daw-select .el-select__wrapper.is-focus) {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 1px var(--va-primary);
}
:deep(.daw-search .el-input__inner),
:deep(.daw-select .el-select__wrapper) {
  color: var(--va-on-background-primary);
  caret-color: var(--va-primary);
}
:deep(.daw-search .el-input__prefix) {
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

/* ---- 创建账号弹窗 ---- */
.create-form {
  padding: 8px 0;
}
:deep(.daw-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--va-block-border);
  padding: 16px 20px;
  margin: 0;
}
:deep(.daw-dialog .el-dialog__header .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--va-on-background-primary);
}
:deep(.daw-dialog .el-dialog__body) {
  padding: 20px;
}
:deep(.daw-dialog .el-dialog__footer) {
  border-top: 1px solid var(--va-block-border);
  padding: 12px 20px;
}
:deep(.daw-dialog .el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  padding-bottom: 4px;
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
</style>
