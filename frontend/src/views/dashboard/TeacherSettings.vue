<!--
 * TeacherSettings - 教师端设置页
 *
 * 功能描述：提供教师的个人设置管理，包括收款账号信息、通知偏好等
 *
 * 设计参考：Vuestic UI 双主题设计体系，使用 --va-* CSS 变量
-->

<template>
  <div class="teacher-settings">
    <!-- ========== 页面头部 ========== -->
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">教师设置</h1>
        <span class="page-desc">管理您的个人信息和收款配置</span>
      </div>
    </div>

    <!-- ========== 基础信息（只读） ========== -->
    <div class="settings-section card">
      <h2 class="section-title">基础信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-item__label">昵称</span>
          <span class="info-item__value">{{ userInfo?.nickname || '未设置' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">邮箱</span>
          <span class="info-item__value">{{ userInfo?.email || '未设置' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">角色</span>
          <span class="info-item__value badge badge--purple">教师</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">注册时间</span>
          <span class="info-item__value">{{ formatDate(userInfo?.createdAt) || '未知' }}</span>
        </div>
      </div>
    </div>

    <!-- ========== 收款账号设置 ========== -->
    <div class="settings-section card">
      <h2 class="section-title">收款账号</h2>
      <p class="section-desc">配置您的收款账号信息，用于提现操作。请确保信息的准确性。</p>
      <div class="settings-form">
        <div class="form-group">
          <label class="form-label">支付宝账号</label>
          <input
            v-model="settings.paymentAccount"
            type="text"
            class="form-input"
            placeholder="请输入您的支付宝账号"
          />
          <span class="form-hint">提现金额将会转入此账号，请仔细核对</span>
        </div>

        <button
          class="btn btn-primary"
          :disabled="saving || !settingsChanged"
          @click="handleSaveSettings"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </div>

    <!-- ========== 通知偏好 ========== -->
    <div class="settings-section card">
      <h2 class="section-title">通知偏好</h2>
      <p class="section-desc">控制您希望接收哪些类型的通知。</p>
      <div class="toggle-list">
        <div class="toggle-item">
          <div class="toggle-item__info">
            <span class="toggle-item__title">课程审核通知</span>
            <span class="toggle-item__desc">当课程审核通过或驳回时接收通知</span>
          </div>
          <label class="toggle-switch">
            <input v-model="settings.notificationEnabled" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- ========== 保存成功提示 ========== -->
    <div v-if="showSuccessToast" class="success-toast">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      设置已保存
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherSettings 教师端设置页
 *
 * @description 提供教师的个人设置管理，包含收款账号和通知偏好
 */
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../../stores/auth';
import { updateTeacherSettings } from '../../api/course';

/** 认证信息 */
const authStore = useAuthStore();
const userInfo = computed(() => authStore.userInfo);

/** 保存状态 */
const saving = ref(false);
const showSuccessToast = ref(false);

/** 设置表单 */
const settings = reactive({
  paymentAccount: '',
  notificationEnabled: true,
});

/** 初始设置（用于检测是否变更） */
const initialSettings = reactive({
  paymentAccount: '',
  notificationEnabled: true,
});

/** 设置是否变更 */
const settingsChanged = computed(() => {
  return settings.paymentAccount !== initialSettings.paymentAccount ||
         settings.notificationEnabled !== initialSettings.notificationEnabled;
});

/** 成功提示定时器 */
let successTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 保存设置
 */
const handleSaveSettings = async () => {
  saving.value = true;
  try {
    await updateTeacherSettings({
      paymentAccount: settings.paymentAccount.trim() || undefined,
      notificationEnabled: settings.notificationEnabled,
    });

    // 更新初始值
    initialSettings.paymentAccount = settings.paymentAccount;
    initialSettings.notificationEnabled = settings.notificationEnabled;

    // 显示成功提示
    showSuccessToast.value = true;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      showSuccessToast.value = false;
    }, 3000);
  } catch (error: any) {
    ElMessage.error(error.message || '保存设置失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 格式化日期
 * @param dateStr 日期字符串
 * @returns 格式化日期
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 从用户信息中初始化设置默认值
 */
const initSettings = () => {
  if (userInfo.value) {
    // 如果有教师信息且包含 paymentAccount，则加载
    const teacherInfo = (userInfo.value as any).teacher;
    if (teacherInfo) {
      settings.paymentAccount = teacherInfo.paymentAccount || '';
      settings.notificationEnabled = teacherInfo.notificationEnabled !== false;
    }
    // 保存初始值
    initialSettings.paymentAccount = settings.paymentAccount;
    initialSettings.notificationEnabled = settings.notificationEnabled;
  }
};

onMounted(() => {
  initSettings();
});
</script>

<style scoped>
.teacher-settings {
  max-width: 640px;
}

/* ---- 页面头部 ---- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header__left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
}

/* ---- 设置区块 ---- */
.settings-section {
  padding: 1.5rem;
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  background-color: var(--va-background-primary);
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.25rem;
}

.section-desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  margin: 0 0 1.25rem;
}

/* ---- 基础信息网格 ---- */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--va-background-element);
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-item__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--va-on-background-secondary);
}

.info-item__value {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  font-weight: 500;
}

/* ---- 表单 ---- */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
}

.form-input {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  background-color: var(--va-background-primary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-square-border-radius);
  outline: none;
  transition: var(--va-transition);
}

.form-input:focus {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--va-muted);
}

/* ---- 开关切换 ---- */
.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--va-background-element);
}

.toggle-item:last-child {
  border-bottom: none;
}

.toggle-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toggle-item__title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--va-on-background-primary);
}

.toggle-item__desc {
  font-size: 0.75rem;
  color: var(--va-muted);
}

/* 自定义开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--va-background-border);
  border-radius: 24px;
  transition: var(--va-transition);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 18px;
  height: 18px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: var(--va-transition);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--va-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* ---- 成功提示 ---- */
.success-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: var(--va-success);
  color: #ffffff;
  border-radius: var(--va-block-border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--va-box-shadow);
  z-index: 1000;
  animation: toast-in 0.3s ease-out;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
