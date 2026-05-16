"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: process.env.NODE_ENV === 'production'
            ? ['warn', 'error']
            : ['log', 'debug', 'error', 'verbose', 'warn'],
    });
    const configService = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('音乐视频课程销售平台 API')
        .setDescription('音乐教育课程销售平台后端接口文档，支持管理员端、教师端、学员端三端分离')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '输入 JWT Token',
        in: 'header',
    }, 'bearer')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const port = configService.get('APP_PORT') || 3000;
    await app.listen(port);
    logger.log(`应用已启动: http://localhost:${port}/api/v1`);
    logger.log(`Swagger 文档: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map