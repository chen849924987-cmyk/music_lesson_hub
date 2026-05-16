/**
 * 可选 JWT 认证守卫
 * 功能描述：与 AuthGuard('jwt') 类似，但允许未登录用户通过。
 *          - 如果请求携带了有效的 JWT Token → 正常解析用户信息到 request.user
 *          - 如果请求没有 Token 或 Token 无效 → 放行，request.user 为 undefined
 *
 * 使用场景：需要识别登录用户但不需要强制登录的接口，例如视频试看权限检查
 *          已购课用户返回 full 权限，未登录/未购课用户返回 trial 权限
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  /**
   * 重写 canActivate
   * 功能描述：如果 Token 有效，执行父类逻辑（解析用户）；如果无 Token，直接放行
   * @param context 执行上下文
   * @returns 始终返回 true，不阻止请求
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    // 没有 Authorization 头 → 直接放行，request.user 保持 undefined
    if (!authHeader) {
      return true;
    }

    // 有 Authorization 头但格式不正确 → 放行（不阻塞请求，也不抛出异常）
    if (!authHeader.startsWith('Bearer ')) {
      return true;
    }

    // 有 Token → 调用父类 AuthGuard 进行验证
    // 如果 Token 无效，父类会抛出 UnauthorizedException
    // 我们捕获这个异常并放行，而不是抛给客户端
    try {
      return super.canActivate(context) as boolean | Promise<boolean>;
    } catch {
      return true;
    }
  }

  /**
   * 重写 handleRequest
   * 功能描述：如果父类验证过程中抛出了异常（Token 过期/无效），不抛出，返回 null
   * @param err 错误对象
   * @param user 解析的用户信息
   * @param info 附加信息
   * @returns 用户信息或 null
   */
  handleRequest(err: any, user: any): any {
    // 如果验证失败，返回 null 而不是抛出异常
    if (err || !user) {
      return null;
    }
    return user;
  }
}
