<!--
 * ProfilePage - 个人中心页面
 *
 * 功能描述：展示和编辑当前登录用户的个人信息，支持上传头像、修改昵称、
 *           修改个人简介、邮箱和手机号绑定、密码修改。
 *           教师身份额外展示"收款账号"和"通知偏好"设置。
 *
 * 设计参考：Vuestic UI 双主题设计体系
 * 布局说明：头像独占顶部居中 → 基本资料 → 教师专属设置 → 账号安全
 -->
<template>
  <div class="profile-page">
    <!-- ========== 页面标题 ========== -->
    <div class="page-header">
      <h1 class="page-title">个人中心</h1>
      <p class="page-subtitle">管理你的个人信息</p>
    </div>

    <!-- ========== 头像区域（独占顶部居中） ========== -->
    <div class="card avatar-section">
      <div class="avatar-wrapper">
        <div
          class="avatar"
          :style="{ backgroundImage: `url(${avatarUrl})` }"
        >
          <div
            v-if="!profile.avatar && !previewAvatar"
            class="avatar-placeholder"
          >
            {{ displayName.charAt(0).toUpperCase() }}
          </div>
          <div class="avatar-overlay" @click="triggerFileInput">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>更换头像</span>
          </div>
        </div>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />
      <p class="avatar-username">{{ profile.nickname || profile.username }}</p>
      <span class="badge" :class="roleBadgeClass">
        {{ roleLabel }}
      </span>
    </div>

    <!-- ========== 基本资料 ========== -->
    <div class="card form-card">
      <h3 class="card-title">基本资料</h3>
      <p class="card-desc">在此更新你的个人资料信息</p>

      <!-- 用户名（只读） -->
      <div class="form-group">
        <label class="form-label">用户名</label>
        <div class="form-readonly">
          <span class="readonly-text">{{ profile.username }}</span>
          <span class="readonly-hint">用户名不可修改</span>
        </div>
      </div>

      <!-- 昵称 -->
      <div class="form-group">
        <label class="form-label">昵称</label>
        <input
          v-model="form.nickname"
          type="text"
          class="input"
          placeholder="请输入昵称"
          maxlength="50"
        />
      </div>

      <!-- 个人简介 -->
      <div class="form-group">
        <label class="form-label">个人简介</label>
        <textarea
          v-model="form.bio"
          class="input textarea"
          placeholder="简单介绍一下自己吧..."
          rows="4"
        ></textarea>
      </div>

      <!-- 保存/重置按钮 -->
      <div class="form-actions">
        <button
          class="btn btn-primary"
          :disabled="saving"
          @click="handleSave"
        >
          {{ saving ? '保存中...' : '保存修改' }}
        </button>
        <button
          v-if="hasChanges"
          class="btn btn-secondary"
          @click="handleReset"
        >
          重置
        </button>
      </div>
    </div>

    <!-- ========== 教师专属：收款账号（仅教师角色显示） ========== -->
    <div v-if="isTeacher" class="card teacher-card">
      <h3 class="card-title">收款账号</h3>
      <p class="card-desc">配置你的收款方式（支付宝或银行转账），用于提现操作</p>

      <div class="form-group">
        <label class="form-label">支付宝账号（手机号）</label>
        <input
          v-model="teacherForm.paymentAccount"
          type="text"
          class="input"
          placeholder="请输入支付宝账号（手机号）"
        />
      </div>

      <h4 class="sub-title">银行转账（选填）</h4>

      <div class="form-group">
        <label class="form-label">银行账号</label>
        <input
          v-model="teacherForm.bankAccount"
          type="text"
          class="input"
          placeholder="请输入银行卡号"
        />
      </div>

      <div class="form-group">
        <label class="form-label">所属支行</label>
        <input
          v-model="teacherForm.bankBranch"
          type="text"
          class="input"
          placeholder="请输入开户支行名称"
        />
      </div>

      <button
        class="btn btn-primary"
        :disabled="teacherSaving || !teacherFormChanged"
        @click="handleSaveTeacherSettings"
      >
        {{ teacherSaving ? '保存中...' : '保存设置' }}
      </button>
    </div>

    <!-- ========== 教师专属：通知偏好（仅教师角色显示，独立即时保存） ========== -->
    <div v-if="isTeacher" class="card teacher-card">
      <h3 class="card-title">通知偏好</h3>
      <p class="card-desc">控制你希望接收哪些类型的通知</p>

      <div class="toggle-item">
        <div class="toggle-item__info">
          <span class="toggle-item__title">课程审核通知</span>
          <span class="toggle-item__desc">当课程审核通过或驳回时接收通知</span>
        </div>
        <label class="toggle-switch">
          <input
            v-model="notificationEnabled"
            type="checkbox"
            @change="handleSaveNotification"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <span v-if="savingNotification" class="saving-hint">保存中...</span>
    </div>

    <!-- ========== 账号安全 ========== -->
    <div class="card security-card">
      <h3 class="card-title">账号安全</h3>
      <p class="card-desc">管理你的账号安全设置</p>

      <!-- 登录密码 -->
      <div class="security-item">
        <div class="security-info">
          <span class="security-label">登录密码</span>
          <span class="security-value">已设置</span>
        </div>
        <div class="security-actions">
          <button class="btn btn-primary btn-sm" @click="showPasswordDialog = true">
            修改密码
          </button>
        </div>
      </div>

      <!-- 绑定邮箱 -->
      <div class="security-item">
        <div class="security-info">
          <span class="security-label">绑定邮箱</span>
          <span class="security-value">{{ profile.email || '未绑定' }}</span>
        </div>
        <div class="security-actions">
          <input
            v-model="form.email"
            type="email"
            class="input input-sm"
            placeholder="输入邮箱地址"
          />
          <button
            class="btn btn-primary btn-sm"
            :disabled="savingEmail"
            @click="handleSaveEmail"
          >
            {{ savingEmail ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 绑定手机 -->
      <div class="security-item">
        <div class="security-info">
          <span class="security-label">绑定手机</span>
          <span class="security-value">{{ profile.phone || '未绑定' }}</span>
        </div>
        <div class="security-actions">
          <input
            v-model="form.phone"
            type="tel"
            class="input input-sm"
            placeholder="输入手机号"
            maxlength="20"
          />
          <button
            class="btn btn-primary btn-sm"
            :disabled="savingPhone"
            @click="handleSavePhone"
          >
            {{ savingPhone ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 修改密码弹窗 ========== -->
    <div v-if="showPasswordDialog" class="dialog-overlay" @click.self="closePasswordDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3 class="dialog-title">修改密码</h3>
          <button class="dialog-close" @click="closePasswordDialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              class="input"
              placeholder="输入当前密码"
            />
          </div>
          <div class="form-group">
            <label class="form-label">新密码</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="input"
              placeholder="输入新密码（至少6位）"
            />
          </div>
          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="input"
              placeholder="再次输入新密码"
              @keyup.enter="handleChangePassword"
            />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closePasswordDialog">取消</button>
          <button
            class="btn btn-primary"
            :disabled="changingPassword"
            @click="handleChangePassword"
          >
            {{ changingPassword ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ProfilePage 个人中心组件
 *
 * @description 展示和编辑个人资料，包含头像上传、昵称/简介修改、邮箱/手机绑定、密码修改。
 *              教师身份额外展示"收款账号"和"通知偏好"设置区块。
 */
import { ref, computed, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getProfile, updateProfile, changePassword, type UserProfile } from '../../api/user';
import { updateTeacherSettings } from '../../api/course';
import { useAuthStore } from '../../stores/auth';

/** 认证状态 */
const authStore = useAuthStore();

/** 是否为教师角色 */
const isTeacher = computed(() => authStore.isTeacher);

/** 加载状态 */
const loading = ref(true);
/** 基本资料保存状态 */
const saving = ref(false);
/** 教师设置保存状态 */
const teacherSaving = ref(false);
/** 邮箱保存状态 */
const savingEmail = ref(false);
/** 手机保存状态 */
const savingPhone = ref(false);
/** 修改密码状态 */
const changingPassword = ref(false);
/** 密码弹窗显隐 */
const showPasswordDialog = ref(false);

/** 用户原始数据 */
const profile = ref<UserProfile>({
  id: 0, username: '', nickname: '', role: '', phone: '',
  email: '', avatar: '', bio: '', isActive: true,
  lastLoginAt: null, createdAt: '', updatedAt: '',
});

/** 表单数据 */
const form = ref({ nickname: '', email: '', phone: '', bio: '', avatar: '' });

/** 教师设置表单（收款账号） */
const teacherForm = reactive({
  paymentAccount: '',
  bankAccount: '',
  bankBranch: '',
});

/** 教师设置初始值（仅用于检测收款账号变更） */
const teacherFormInitial = reactive({
  paymentAccount: '',
  bankAccount: '',
  bankBranch: '',
});

/** 通知偏好（独立状态，切换即保存） */
const notificationEnabled = ref(true);
const savingNotification = ref(false);

/** 教师收款账号是否变更 */
const teacherFormChanged = computed(() => {
  return teacherForm.paymentAccount !== teacherFormInitial.paymentAccount ||
    teacherForm.bankAccount !== teacherFormInitial.bankAccount ||
    teacherForm.bankBranch !== teacherFormInitial.bankBranch;
});

/** 密码表单 */
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

/** 预览头像（Base64） */
const previewAvatar = ref('');

/** 文件输入引用 */
const fileInputRef = ref<HTMLInputElement | null>(null);

/** 显示名称 */
const displayName = computed(() => profile.value.nickname || profile.value.username);

/** 头像URL */
const avatarUrl = computed(() => {
  if (previewAvatar.value) return previewAvatar.value;
  if (profile.value.avatar) {
    if (profile.value.avatar.startsWith('http')) return profile.value.avatar;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';
    return `${apiBaseUrl}/files/${profile.value.avatar}`;
  }
  return '';
});

/** 角色标签 */
const roleLabel = computed(() => {
  const map: Record<string, string> = {
    super_admin: '超级管理员', admin: '管理员', teacher: '教师',
    reviewer: '审核员', operator: '运营', student: '制作人',
  };
  return map[profile.value.role] || profile.value.role;
});

/** 角色徽章样式 */
const roleBadgeClass = computed(() => {
  const map: Record<string, string> = {
    super_admin: 'badge--danger', admin: 'badge--danger', teacher: 'badge--primary',
    reviewer: 'badge--info', operator: 'badge--warning', student: 'badge--success',
  };
  return map[profile.value.role] || 'badge--info';
});

/** 基本资料是否有变更 */
const hasChanges = computed(() => {
  return form.value.nickname !== (profile.value.nickname || '') ||
    form.value.bio !== (profile.value.bio || '') ||
    form.value.avatar !== profile.value.avatar;
});

/**
 * 加载用户信息
 */
const loadProfile = async () => {
  try {
    loading.value = true;
    const data = await getProfile();
    profile.value = data;
    form.value = {
      nickname: data.nickname || '',
      email: data.email || '',
      phone: data.phone || '',
      bio: data.bio || '',
      avatar: data.avatar || '',
    };

    // 如果是教师角色，从用户信息中获取教师设置
    if (authStore.isTeacher) {
      const teacherInfo = (data as any).teacher;
      if (teacherInfo) {
        teacherForm.paymentAccount = teacherInfo.paymentAccount || '';
        teacherForm.bankAccount = teacherInfo.bankAccount || '';
        teacherForm.bankBranch = teacherInfo.bankBranch || '';
        notificationEnabled.value = teacherInfo.notificationEnabled !== false;
      }
      teacherFormInitial.paymentAccount = teacherForm.paymentAccount;
      teacherFormInitial.bankAccount = teacherForm.bankAccount;
      teacherFormInitial.bankBranch = teacherForm.bankBranch;
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
    ElMessage.error('加载用户信息失败');
  } finally {
    loading.value = false;
  }
};

/** 触发文件选择 */
const triggerFileInput = () => fileInputRef.value?.click();

/**
 * 处理文件选择
 */
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('头像图片不能超过 5MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    previewAvatar.value = e.target?.result as string;
    form.value.avatar = previewAvatar.value;
  };
  reader.readAsDataURL(file);
};

/**
 * 保存基本资料
 */
const handleSave = async () => {
  saving.value = true;
  try {
    const updated = await updateProfile({
      nickname: form.value.nickname || undefined,
      bio: form.value.bio || undefined,
      avatar: form.value.avatar || undefined,
    });
    profile.value = updated;
    ElMessage.success('保存成功');
    previewAvatar.value = '';
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    saving.value = false;
  }
};

/**
 * 重置基本资料表单
 */
const handleReset = () => {
  form.value.nickname = profile.value.nickname || '';
  form.value.bio = profile.value.bio || '';
  form.value.avatar = profile.value.avatar || '';
  previewAvatar.value = '';
  ElMessage.info('已重置为保存前的数据');
};

/**
 * 保存教师设置（收款账号 + 银行账户）
 */
const handleSaveTeacherSettings = async () => {
  teacherSaving.value = true;
  try {
    await updateTeacherSettings({
      paymentAccount: teacherForm.paymentAccount.trim() || undefined,
      bankAccount: teacherForm.bankAccount.trim() || undefined,
      bankBranch: teacherForm.bankBranch.trim() || undefined,
    });
    teacherFormInitial.paymentAccount = teacherForm.paymentAccount;
    teacherFormInitial.bankAccount = teacherForm.bankAccount;
    teacherFormInitial.bankBranch = teacherForm.bankBranch;
    ElMessage.success('收款账号已保存');
  } catch (error: any) {
    ElMessage.error(error.message || '保存收款账号失败');
  } finally {
    teacherSaving.value = false;
  }
};

/**
 * 通知偏好切换即时保存（独立于收款账号）
 * @description toggle 开关变化时立刻调用接口保存，无需点击"保存设置"
 */
const handleSaveNotification = async () => {
  savingNotification.value = true;
  try {
    await updateTeacherSettings({
      notificationEnabled: notificationEnabled.value,
    });
    ElMessage.success(`课程审核通知已${notificationEnabled.value ? '开启' : '关闭'}`);
  } catch (error: any) {
    // 保存失败时恢复原状态
    notificationEnabled.value = !notificationEnabled.value;
    ElMessage.error(error.message || '保存通知偏好失败');
  } finally {
    savingNotification.value = false;
  }
};

/**
 * 校验邮箱格式
 * @param email 邮箱地址
 * @returns 是否合法
 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * 校验手机号格式（中国大陆11位手机号）
 * @param phone 手机号
 * @returns 是否合法
 */
const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 保存邮箱（只更新邮箱字段）
 * @description 保存前进行前端格式校验，避免无效提交
 */
const handleSaveEmail = async () => {
  const email = form.value.email?.trim();
  if (!email) {
    ElMessage.warning('请输入邮箱地址');
    return;
  }
  if (!isValidEmail(email)) {
    ElMessage.warning('邮箱格式不正确，请输入有效的邮箱地址（如 user@example.com）');
    return;
  }

  savingEmail.value = true;
  try {
    const updated = await updateProfile({ email });
    profile.value = updated;
    ElMessage.success('邮箱已更新');
  } catch (error: any) {
    const msg = error?.response?.data?.message || '保存邮箱失败';
    ElMessage.error(msg);
    console.error('保存邮箱失败:', error);
  } finally {
    savingEmail.value = false;
  }
};

/**
 * 保存手机号（只更新手机号字段）
 * @description 保存前进行前端格式校验，避免无效提交
 */
const handleSavePhone = async () => {
  const phone = form.value.phone?.trim();
  if (!phone) {
    ElMessage.warning('请输入手机号');
    return;
  }
  if (!isValidPhone(phone)) {
    ElMessage.warning('手机号格式不正确，请输入11位中国大陆手机号（如 13800138000）');
    return;
  }

  savingPhone.value = true;
  try {
    const updated = await updateProfile({ phone });
    profile.value = updated;
    ElMessage.success('手机号已更新');
  } catch (error: any) {
    const msg = error?.response?.data?.message || '保存手机号失败';
    ElMessage.error(msg);
    console.error('保存手机号失败:', error);
  } finally {
    savingPhone.value = false;
  }
};

/** 关闭密码弹窗 */
const closePasswordDialog = () => {
  showPasswordDialog.value = false;
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
};

/**
 * 确认修改密码
 */
const handleChangePassword = async () => {
  // 表单校验
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请输入当前密码');
    return;
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }

  changingPassword.value = true;
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    ElMessage.success('密码修改成功，请重新登录');
    closePasswordDialog();
    // 跳转登录页
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 1000);
  } catch (error) {
    console.error('修改密码失败:', error);
  } finally {
    changingPassword.value = false;
  }
};

onMounted(() => { loadProfile(); });
</script>

<style scoped>
/* ============================================================
 * ProfilePage 样式
 * 布局：头像独占顶部居中 → 基本资料 → 教师专属 → 账号安全
 * 使用 --va-* 双主题 CSS 变量体系
 * ============================================================ */
.profile-page {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ---- 页面标题 ---- */
.page-header { margin-bottom: 0; }
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--va-on-background-primary);
  margin: 0 0 0.25rem;
}
.page-subtitle {
  font-size: 0.875rem;
  color: var(--va-on-background-element);
  margin: 0;
}

/* ============================================================ *
 * 头像区域 - 独占顶部居中
 * ============================================================ */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.5rem 1.5rem;
  text-align: center;
}
.avatar-wrapper { margin-bottom: 1rem; }
.avatar {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: var(--va-background-element);
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 0 0 4px var(--va-primary-alpha);
  transition: box-shadow var(--va-transition);
}
.avatar:hover {
  box-shadow: 0 0 0 4px var(--va-primary-light-alpha), 0 0 20px var(--va-primary-alpha);
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: var(--va-primary);
  background: var(--va-primary-alpha);
}
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 0.75rem;
  opacity: 0;
  transition: var(--va-transition);
}
.avatar:hover .avatar-overlay { opacity: 1; }
.avatar-username {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.5rem;
}

/* ============================================================ *
 * 卡片通用
 * ============================================================ */
.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0 0 0.25rem;
}
.card-desc {
  font-size: 0.8125rem;
  color: var(--va-on-background-element);
  margin: 0 0 1.5rem;
}

/* ============================================================ *
 * 基本资料表单
 * ============================================================ */
.form-card { padding: 1.5rem; }
.form-group { margin-bottom: 1.25rem; }
.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--va-on-background-secondary);
  margin-bottom: 0.375rem;
  letter-spacing: var(--va-letter-spacing);
}
.form-readonly {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background-color: var(--va-background-secondary);
  border: 1px solid var(--va-background-border);
  border-radius: var(--va-form-element-border-radius);
}
.readonly-text {
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  font-weight: 500;
}
.readonly-hint {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}
.input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: var(--va-on-background-primary);
  background-color: var(--va-background-primary);
  border: var(--va-form-element-border-width, 1px) solid var(--va-background-border);
  border-radius: var(--va-form-element-border-radius, 0.25rem);
  outline: none;
  transition: var(--va-transition);
  box-sizing: border-box;
}
.input:focus {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 2px var(--va-primary-alpha);
}
.input::placeholder { color: var(--va-on-background-element); }
.textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}
.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--va-background-element);
}

/* ============================================================ *
 * 教师专属样式
 * ============================================================ */
.teacher-card { padding: 1.5rem; }
.teacher-card .input {
  max-width: 400px;
}

/* ---- 通知开关 ---- */
.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
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
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;
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

/* ============================================================ *
 * 账号安全
 * ============================================================ */
.security-card { padding: 1.5rem; }
.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 0;
  gap: 1rem;
}
.security-item + .security-item {
  border-top: 1px solid var(--va-background-element);
}
.security-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex-shrink: 0;
  min-width: 100px;
}
.security-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--va-on-background-primary);
}
.security-value {
  font-size: 0.75rem;
  color: var(--va-on-background-element);
}
.security-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-end;
  max-width: 340px;
}
.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.input-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  max-width: 180px;
}

/* ============================================================ *
 * 密码修改弹窗
 * ============================================================ */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  background: var(--va-background-primary);
  border: var(--va-block-border);
  border-radius: var(--va-block-border-radius);
  box-shadow: var(--va-block-box-shadow);
  width: 420px;
  max-width: 90vw;
  padding: 1.5rem;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--va-on-background-primary);
  margin: 0;
}
.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--va-on-background-element);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--va-transition);
}
.dialog-close:hover {
  color: var(--va-on-background-primary);
  background: var(--va-background-hover);
}
.dialog-body {
  margin-bottom: 1.5rem;
}
.dialog-body .form-group:last-child {
  margin-bottom: 0;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--va-background-element);
}
</style>
