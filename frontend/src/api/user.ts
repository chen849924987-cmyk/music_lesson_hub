/**
 * 用户 API 封装
 *
 * 功能描述：封装用户个人信息相关的接口调用，包括获取用户信息、更新用户信息和修改密码
 */
import { get, put, post } from './request';

/** 用户信息接口 */
export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  role: string;
  phone: string;
  email: string;
  avatar: string;
  bio: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 获取当前登录用户信息
 * GET /api/v1/users/profile
 *
 * @returns 用户个人信息（不含密码）
 */
export function getProfile(): Promise<UserProfile> {
  return get<UserProfile>('/users/profile');
}

/**
 * 更新当前登录用户信息
 * PUT /api/v1/users/profile
 *
 * @param data 要更新的字段（nickname / phone / email / bio / avatar）
 * @returns 更新后的用户信息
 */
export function updateProfile(
  data: {
    nickname?: string;
    phone?: string;
    email?: string;
    bio?: string;
    avatar?: string;
  },
): Promise<UserProfile> {
  return put<UserProfile>('/users/profile', data);
}

/**
 * 修改当前用户密码
 * POST /api/v1/auth/change-password
 *
 * @param data 旧密码和新密码
 * @returns 密码修改结果
 */
export function changePassword(data: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/change-password', data);
}
