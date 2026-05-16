import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

/**
 * JWT 认证策略
 * 功能描述：验证每个请求中携带的 JWT Token，解析用户信息并注入到 request.user 中
 * 使用 Passport 的 JWT Strategy 实现自动鉴权
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      // 从 Authorization 头中提取 Bearer Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略过期时间，过期 Token 会被自动拒绝
      ignoreExpiration: false,
      // JWT 签名密钥
      secretOrKey: configService.get<string>('jwt.secret') ?? 'music-edu-jwt-secret-dev',
    });
  }

  /**
   * JWT 验证回调
   * 功能描述：Token 验证通过后调用此方法，返回的对象会被注入到 request.user
   * @param payload JWT Token 中解析出的载荷
   * @returns 用户基本信息
   * @throws UnauthorizedException 当用户不存在或已禁用时抛出
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // 验证用户是否仍然存在且未被禁用
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 返回 JWT 载荷中的信息，供 @CurrentUser() 装饰器使用
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
