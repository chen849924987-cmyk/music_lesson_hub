import { post } from './request';

/**
 * 认证相关 API
 * 功能描述：封装用户注册、登录等认证接口的调用
 */

/** 注册参数 */
export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
  email?: string;
}

/** 登录参数 */
export interface LoginParams {
  username: string;
  password: string;
}

/** 登录响应 */
export interface LoginResult {
  user: {
    id: number;
    username: string;
    nickname: string;
    role: string;
    avatar: string;
    phone: string;
    email: string;
    isActive: boolean;
  };
  accessToken: string;
}

/**
 * 学员注册
 */
export const register = (params: RegisterParams) =>
  post<LoginResult['user']>('/auth/register', params);

/**
 * 学员登录
 */
export const login = (params: LoginParams) =>
  post<LoginResult>('/auth/login', params);

/**
 * 管理端/教师端登录
 */
export const adminLogin = (params: LoginParams) =>
  post<LoginResult>('/auth/admin/login', params);
