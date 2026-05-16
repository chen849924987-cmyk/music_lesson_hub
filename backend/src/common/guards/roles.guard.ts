import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../constants';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 角色权限守卫
 * 功能描述：检查当前登录用户是否具有访问接口所需的角色权限
 * 与 @Roles() 装饰器配合使用，实现基于角色的访问控制
 * 
 * 处理逻辑：
 * 1. 如果接口没有 @Roles() 装饰器，允许访问（不限制）
 * 2. 如果接口有 @Roles() 装饰器，检查用户角色是否在允许列表中
 * 3. 超级管理员拥有所有权限
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取接口上通过 @Roles() 装饰器设置的角色列表
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果接口没有设置角色限制，允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取请求中的用户信息（由 JwtStrategy 注入）
    const { user } = context.switchToHttp().getRequest();

    // 未登录用户无权访问
    if (!user) {
      return false;
    }

    // 检查用户角色是否在允许列表中
    // 超级管理员拥有所有权限
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
