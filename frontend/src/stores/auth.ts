import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, adminLogin, register, type LoginParams, type RegisterParams, type LoginResult } from '../api/auth';

/**
 * 认证状态管理
 * 功能描述：管理用户登录状态、Token 存储、角色信息等
 *
 * 术语说明："制作人"替代旧版"学员"——面向音乐制作人的学习平台
 */
export const useAuthStore = defineStore('auth', () => {
  // ============ 状态 ============
  /** 用户信息 */
  const userInfo = ref<LoginResult['user'] | null>(
    JSON.parse(localStorage.getItem('userInfo') || 'null'),
  );

  /** 访问令牌 */
  const accessToken = ref<string>(
    localStorage.getItem('accessToken') || '',
  );

  // ============ 计算属性 ============
  /** 是否已登录 */
  const isLoggedIn = computed(() => !!accessToken.value);

  /** 用户角色 */
  const role = computed(() => userInfo.value?.role || '');

  /** 是否为管理员（含审核员、运营管理员） */
  const isAdmin = computed(() =>
    ['super_admin', 'reviewer', 'operator'].includes(role.value),
  );

  /** 是否为教师 */
  const isTeacher = computed(() => role.value === 'teacher');

  /** 是否为制作人（原学员，后台角色字段仍为student） */
  const isProducer = computed(() => role.value === 'student');

  /** 是否为超级管理员 */
  const isSuperAdmin = computed(() => role.value === 'super_admin');

  // ============ 方法 ============
  /**
   * 制作人注册
   */
  async function handleRegister(params: RegisterParams) {
    await register(params);
  }

  /**
   * 制作人登录
   */
  async function handleLogin(params: LoginParams) {
    const result = await login(params);
    saveAuth(result);
    return result;
  }

  /**
   * 管理端/教师端登录
   */
  async function handleAdminLogin(params: LoginParams) {
    const result = await adminLogin(params);
    saveAuth(result);
    return result;
  }

  /**
   * 保存认证信息到 localStorage
   */
  function saveAuth(result: LoginResult) {
    userInfo.value = result.user;
    accessToken.value = result.accessToken;
    localStorage.setItem('userInfo', JSON.stringify(result.user));
    localStorage.setItem('accessToken', result.accessToken);
  }

  /**
   * 退出登录
   */
  function logout() {
    userInfo.value = null;
    accessToken.value = '';
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
  }

  return {
    // 状态
    userInfo,
    accessToken,
    // 计算属性
    isLoggedIn,
    role,
    isAdmin,
    isTeacher,
    isProducer,
    isSuperAdmin,
    // 方法
    handleRegister,
    handleLogin,
    handleAdminLogin,
    logout,
  };
});
