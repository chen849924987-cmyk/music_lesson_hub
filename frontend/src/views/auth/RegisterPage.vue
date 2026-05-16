<!--
 * RegisterPage - 注册页面组件
 *
 * 功能描述：DAW（数字音频工作站）主题的注册页面，包含卷帘窗入场动画、
 *           浮动音符装饰、VU 表指示器和底部节拍线等音乐元素。
 *
 * 设计参考：Vuestic UI 双主题设计体系，结合 DAW 创意美学
 -->

<template>
  <div class="register-page">
    <!-- 主题切换按钮 - 未登录状态下也可切换亮色/暗色主题 -->
    <div class="theme-toggle-wrapper">
      <el-button type="primary" size="small" @click="router.push('/home')">回到主页</el-button>
      <ThemeToggle />
    </div>

    <!-- 卷帘窗 -->
    <div class="curtain curtain--left"></div>
    <div class="curtain curtain--right"></div>

    <!-- 背景波形 -->
    <div class="bg-waveform">
      <span
        v-for="n in 30"
        :key="n"
        :style="{
          animationDelay: `${n * 0.08}s`,
          height: `${20 + Math.random() * 60}%`,
        }"
      ></span>
    </div>

    <!-- 浮动音符装饰 -->
    <div class="floating-notes">
      <span
        v-for="n in 8"
        :key="'note-' + n"
        class="floating-note"
        :style="{
          left: `${10 + (n - 1) * 11}%`,
          animationDelay: `${n * 0.7 + Math.random() * 1.5}s`,
          fontSize: `${18 + Math.random() * 18}px`,
        }"
      >{{ ['♪', '♫', '♩', '♪', '♬', '♪', '♩', '♫'][n - 1] }}</span>
    </div>

    <div class="register-container">
      <div class="register-header">
        <div class="logo-icon">
          <span class="logo-ring"></span>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
          </svg>
        </div>
        <h1 class="register-title gradient-text">创建账号</h1>
        <p class="register-subtitle">加入音乐人的学习社区</p>
      </div>

      <!-- VU 表装饰 -->
      <div class="vu-decor">
        <div class="vu-decor__meter">
          <span
            v-for="i in 8"
            :key="i"
            class="vu-decor__seg"
            :class="{ 'vu-decor__seg--active': i <= 4 }"
          ></span>
        </div>
        <span class="vu-decor__label">SIGNUP</span>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名" class="daw-input">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="昵称" class="daw-input">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            show-password
            class="daw-input"
          >
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            show-password
            class="daw-input"
          >
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1"/>
              </svg>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="phone">
          <el-input v-model="registerForm.phone" placeholder="手机号（选填）" class="daw-input">
            <template #prefix>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button :loading="loading" class="register-button btn--glow" @click="handleRegister">
            {{ loading ? '谱曲中...' : '谱写乐章' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span class="footer-text">已有账号？</span>
        <router-link to="/auth/login" class="login-link">立即登录</router-link>
      </div>

      <!-- 底部节拍线 -->
      <div class="beat-line">
        <span
          v-for="beat in 8"
          :key="'beat-' + beat"
          class="beat-dot"
          :style="{ animationDelay: `${beat * 0.25}s` }"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * RegisterPage 页面组件
 *
 * @description 用户注册页面，DAW 音乐主题设计
 */
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { register } from '../../api/auth';
import ThemeToggle from '../../components/ThemeToggle.vue';

const router = useRouter();

const registerFormRef = ref<FormInstance>();
const loading = ref(false);

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  phone: '',
});

/**
 * 确认密码校验器
 * 检查两次输入的密码是否一致
 */
const validateConfirmPass = (_rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, message: '用户名至少4个字符', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPass, trigger: 'blur' },
  ],
};

/**
 * 处理注册
 * 调用注册 API，成功后跳转到登录页
 */
const handleRegister = async () => {
  const valid = await registerFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await register({
      username: registerForm.username,
      nickname: registerForm.nickname,
      password: registerForm.password,
      phone: registerForm.phone || undefined,
    });

    ElMessage.success('注册成功！');
    router.push('/auth/login');
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '注册失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ---- 主题切换按钮定位 ---- */
.theme-toggle-wrapper {
  position: fixed;
  top: 1rem;
  right: 1.5rem;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 10px;
}
.home-link {
  display: flex;
  align-items: center;
  color: var(--va-on-background-element);
  text-decoration: none;
  transition: var(--va-transition);
}
.home-link:hover {
  color: var(--va-primary);
}

/* ============================================================
 * RegisterPage 样式
 * 使用 --va-* 双主题 CSS 变量 + DAW 音乐美学元素
 * ============================================================ */

.register-page {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--va-background-secondary);
  overflow: hidden;
}

/* ---- 卷帘窗 ---- */
.curtain {
  position: fixed;
  top: 0;
  width: 50%;
  height: 100%;
  background: var(--va-background-element);
  z-index: 100;
  pointer-events: none;
}
.curtain--left {
  left: 0;
  animation: curtainSlideLeft 1.2s cubic-bezier(0.77, 0, 0.18, 1) 0.1s forwards;
}
.curtain--right {
  right: 0;
  animation: curtainSlideRight 1.2s cubic-bezier(0.77, 0, 0.18, 1) 0.1s forwards;
}

/* ---- 背景波形 ---- */
.bg-waveform {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
  padding: 0 20px;
  opacity: 0.12;
}
.bg-waveform span {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: var(--va-primary);
  animation: wave 0.8s ease-in-out infinite alternate;
}

/* ---- 注册容器 ---- */
.register-container {
  position: relative;
  z-index: 10;
  width: 420px;
  padding: 48px 40px 40px;
  background: var(--va-background-primary);
  border: 1px solid var(--va-block-border);
  border-radius: 16px;
  box-shadow: var(--va-shadow-lg);
  animation: curtainContentFadeIn 0.6s 0.4s ease both;
}

/* 装饰边框 */
.register-container::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 16px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, var(--va-primary-alpha), transparent 40%, transparent 60%, var(--va-primary-alpha)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.register-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 20px var(--va-primary));
  opacity: 0.5;
}

.register-title {
  font-size: 28px;
  font-family: var(--va-font-family);
  margin: 0 0 8px;
}

.register-subtitle {
  font-size: 14px;
  color: var(--va-on-background-secondary);
  margin: 0;
  letter-spacing: 1px;
}

.register-form {
  margin-bottom: 24px;
}

/* ---- 暗色输入框 ---- */
:deep(.daw-input .el-input__wrapper) {
  background: var(--va-background-element);
  border: 1px solid var(--va-block-border);
  box-shadow: none;
  transition: all 0.25s ease;
}
:deep(.daw-input .el-input__wrapper:hover) {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 1px var(--va-primary);
}
:deep(.daw-input .el-input__wrapper.is-focus) {
  border-color: var(--va-primary);
  box-shadow: 0 0 0 1px var(--va-primary), 0 0 12px var(--va-primary-alpha);
}
:deep(.daw-input .el-input__inner) {
  color: var(--va-on-background-primary);
  caret-color: var(--va-primary);
}
:deep(.daw-input .el-input__prefix) {
  color: var(--va-on-background-element);
}

.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  letter-spacing: 4px;
}

.register-footer {
  text-align: center;
  font-size: 14px;
}

.footer-text {
  color: var(--va-on-background-element);
}

.login-link {
  color: var(--va-primary);
  text-decoration: none;
  margin-left: 4px;
  font-weight: 500;
  transition: color 0.2s;
}
.login-link:hover {
  color: var(--va-on-background-primary);
  opacity: 0.8;
  text-decoration: none;
}

/* ---- 浮动音符装饰 ---- */
.floating-notes {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  overflow: hidden;
}
.floating-note {
  position: absolute;
  bottom: -40px;
  color: var(--va-primary);
  opacity: 0;
  animation: musicNoteFloat 4s ease-in-out infinite;
}
.logo-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.logo-ring {
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid var(--va-primary-alpha);
  animation: pulseGlow 2.5s ease-in-out infinite;
}

/* ---- VU 表装饰 ---- */
.vu-decor {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}
.vu-decor__meter {
  display: flex;
  gap: 3px;
  height: 10px;
  align-items: flex-end;
  background: var(--va-background-element);
  border-radius: 3px;
  padding: 3px;
  border: 1px solid var(--va-block-border);
}
.vu-decor__seg {
  width: 6px;
  border-radius: 1px;
  background: var(--va-background-secondary);
  transition: background 0.4s ease;
}
.vu-decor__seg--active {
  background: var(--va-primary);
  box-shadow: 0 0 6px var(--va-primary-alpha);
}
.vu-decor__label {
  font-size: 9px;
  font-family: var(--va-font-family);
  color: var(--va-on-background-element);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ---- 底部节拍线 ---- */
.beat-line {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--va-block-border);
}
.beat-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--va-primary);
  opacity: 0.25;
  animation: indicatorPulse 2s ease-in-out infinite;
}
</style>
