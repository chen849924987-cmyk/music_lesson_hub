import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';

/**
 * 认证模块
 * 功能描述：提供用户注册、登录、JWT 鉴权、角色管理等能力
 * 导出了 JwtStrategy 供其他模块使用 JWT 鉴权
 */
@Module({
  imports: [
    // 注册 TypeORM 实体
    TypeOrmModule.forFeature([User]),
    // 配置 Passport，默认策略为 jwt
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // 配置 JWT 模块
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') ?? 'music-edu-jwt-secret-dev',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule, AuthService],
})
export class AuthModule {}
