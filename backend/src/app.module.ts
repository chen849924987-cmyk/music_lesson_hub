import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_PIPE, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { CoursesModule } from './modules/courses/courses.module';
import { StorageModule } from './modules/storage/storage.module';
import { VideosModule } from './modules/videos/videos.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { EarningsModule } from './modules/earnings/earnings.module';
import { AdminModule } from './modules/admin/admin.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { LearningModule } from './modules/learning/learning.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * 应用根模块
 * 功能描述：配置全局中间件、过滤器、管道、拦截器，并导入所有业务模块
 */
@Module({
  imports: [
    // ============ 配置模块 ============
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用，无需在每个模块中重复导入
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig],
    }),

    // ============ TypeORM 数据库连接 ============
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true, // 自动加载各模块中通过 TypeOrmModule.forFeature() 注册的实体
        synchronize: process.env.NODE_ENV === 'development', // 开发环境自动同步表结构
        charset: 'utf8mb4',
        logging: process.env.NODE_ENV === 'development',
        poolSize: 10,
        timezone: '+08:00', // 北京时间
      }),
    }),

    // ============ 请求频率限制 ============
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1分钟
        limit: 60, // 最多60次请求
      },
    ]),

    // ============ 存储模块 ============
    StorageModule,
    // ============ 业务模块 ============
    AuthModule,
    UsersModule,
    TeachersModule,
    CoursesModule,
    VideosModule,
    AttachmentsModule,
    EarningsModule,
    AdminModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    LearningModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ============ 全局异常过滤器 ============
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // ============ 全局参数校验管道 ============
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // ============ 全局响应拦截器 ============
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // ============ 全局频率限制守卫 ============
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
