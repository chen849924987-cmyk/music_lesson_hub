"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarningsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const earnings_controller_1 = require("./earnings.controller");
const earnings_service_1 = require("./earnings.service");
const earning_entity_1 = require("./entities/earning.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const order_item_entity_1 = require("../orders/entities/order-item.entity");
const course_entity_1 = require("../courses/entities/course.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const teachers_module_1 = require("../teachers/teachers.module");
const orders_module_1 = require("../orders/orders.module");
const courses_module_1 = require("../courses/courses.module");
let EarningsModule = class EarningsModule {
};
exports.EarningsModule = EarningsModule;
exports.EarningsModule = EarningsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([earning_entity_1.Earning, order_entity_1.Order, order_item_entity_1.OrderItem, course_entity_1.Course, teacher_entity_1.Teacher]),
            (0, common_1.forwardRef)(() => teachers_module_1.TeachersModule),
            (0, common_1.forwardRef)(() => orders_module_1.OrdersModule),
            (0, common_1.forwardRef)(() => courses_module_1.CoursesModule),
        ],
        controllers: [earnings_controller_1.EarningsController],
        providers: [earnings_service_1.EarningsService],
        exports: [earnings_service_1.EarningsService],
    })
], EarningsModule);
//# sourceMappingURL=earnings.module.js.map