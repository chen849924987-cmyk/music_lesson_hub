"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_config_1 = __importDefault(require("./config/database.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const teachers_module_1 = require("./modules/teachers/teachers.module");
const courses_module_1 = require("./modules/courses/courses.module");
const storage_module_1 = require("./modules/storage/storage.module");
const videos_module_1 = require("./modules/videos/videos.module");
const attachments_module_1 = require("./modules/attachments/attachments.module");
const earnings_module_1 = require("./modules/earnings/earnings.module");
const admin_module_1 = require("./modules/admin/admin.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const coupons_module_1 = require("./modules/coupons/coupons.module");
const learning_module_1 = require("./modules/learning/learning.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const validation_pipe_1 = require("./common/pipes/validation.pipe");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                load: [database_config_1.default, jwt_config_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.database'),
                    autoLoadEntities: true,
                    synchronize: process.env.NODE_ENV === 'development',
                    charset: 'utf8mb4',
                    logging: process.env.NODE_ENV === 'development',
                    poolSize: 10,
                    timezone: '+08:00',
                }),
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 60,
                },
            ]),
            storage_module_1.StorageModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            teachers_module_1.TeachersModule,
            courses_module_1.CoursesModule,
            videos_module_1.VideosModule,
            attachments_module_1.AttachmentsModule,
            earnings_module_1.EarningsModule,
            admin_module_1.AdminModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            coupons_module_1.CouponsModule,
            learning_module_1.LearningModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
            {
                provide: core_1.APP_PIPE,
                useClass: validation_pipe_1.ValidationPipe,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: transform_interceptor_1.TransformInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map