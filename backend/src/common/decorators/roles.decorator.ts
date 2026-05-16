import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants';

/**
 * 角色权限装饰器
 * 功能描述：标记接口需要的访问角色，配合 RolesGuard 使用
 * 使用示例：@Roles(Role.TEACHER, Role.ADMIN)
 *
 * @param roles 允许访问的角色列表
 * @returns 装饰器
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
