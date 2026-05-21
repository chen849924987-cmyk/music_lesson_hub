import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Request, Response, Router } from 'express';

/**
 * 应用入口文件
 * 功能描述：启动 NestJS 应用，配置全局路由前缀、Swagger 文档、CORS 等
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // 开发环境开启日志，生产环境仅输出 warn 及以上级别
    logger: process.env.NODE_ENV === 'production' 
      ? ['warn', 'error'] 
      : ['log', 'debug', 'error', 'verbose', 'warn'],
  });

  const configService = app.get(ConfigService);

  // ============ 全局路由前缀 ============
  // 所有 API 接口统一以 /api/v1 开头
  app.setGlobalPrefix('api/v1');

  // ============ CORS 跨域配置 ============
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost',
    'http://localhost:80',
  ];
  // 支持 Tailscale Funnel 域名 *.ts.net
  const tailscaleHost = process.env.TAILSCALE_HOST;
  if (tailscaleHost) {
    allowedOrigins.push(`https://${tailscaleHost}`);
  }
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ============ Swagger API 文档 ============
  const swaggerConfig = new DocumentBuilder()
    .setTitle('音乐视频课程销售平台 API')
    .setDescription('音乐教育课程销售平台后端接口文档，支持管理员端、教师端、学员端三端分离')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '输入 JWT Token',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ============ 健康检查端点 ============
  // 用于 Docker 健康检查、负载均衡器探活
  const healthRouter = Router();
  healthRouter.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });
  app.use(healthRouter);

  // ============ 启动服务器 ============
  const port = configService.get<number>('APP_PORT') || 3000;
  await app.listen(port);

  logger.log(`应用已启动: http://localhost:${port}/api/v1`);
  logger.log(`Swagger 文档: http://localhost:${port}/api/docs`);
  logger.log(`健康检查: http://localhost:${port}/health`);
}

bootstrap();
