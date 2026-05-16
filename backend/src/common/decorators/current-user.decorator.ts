import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户信息装饰器
 * 功能描述：从请求中提取当前登录用户的信息，用于 Controller 方法参数注入
 * 使用示例：
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {}
 *
 * @Get('profile')
 * getProfile(@CurrentUser('userId') userId: number) {}
 *
 * @param data 可选，指定返回用户对象的某个字段
 * @param ctx 执行上下文
 * @returns 用户信息或指定字段
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果未登录，返回 null
    if (!user) {
      return null;
    }

    // 如果指定了字段名，返回该字段的值
    if (data) {
      return user[data];
    }

    // 否则返回完整的用户信息
    return user;
  },
);

/**
 * JWT Token 载荷类型
 * 功能描述：定义 JWT Token 中包含的用户信息字段
 */
export interface JwtPayload {
  /** 用户 ID */
  sub: number;

  /** 用户名 */
  username: string;

  /** 角色 */
  role: string;

  /** 是否需要完善信息 */
  isProfileComplete?: boolean;

  /** 签发时间（由 JwtService 自动填充） */
  iat?: number;

  /** 过期时间（由 JwtService 自动填充） */
  exp?: number;
}
