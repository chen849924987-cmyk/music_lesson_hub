"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const evaluations_service_1 = require("./evaluations.service");
const create_evaluation_dto_1 = require("./dto/create-evaluation.dto");
const reply_evaluation_dto_1 = require("./dto/reply-evaluation.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const optional_jwt_guard_1 = require("../../common/guards/optional-jwt.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
let EvaluationsController = class EvaluationsController {
    evaluationsService;
    constructor(evaluationsService) {
        this.evaluationsService = evaluationsService;
    }
    async create(courseId, userId, createEvaluationDto) {
        const evaluation = await this.evaluationsService.create(courseId, userId, createEvaluationDto);
        return response_dto_1.ApiResponse.created(evaluation, '评价发表成功');
    }
    async findByCourse(courseId, page, pageSize) {
        const result = await this.evaluationsService.findByCourse(courseId, page || 1, pageSize || 20);
        return response_dto_1.ApiResponse.successWithPagination(result.items, result.meta);
    }
    async checkEvaluated(courseId, userId) {
        const result = await this.evaluationsService.checkUserEvaluated(courseId, userId);
        return response_dto_1.ApiResponse.success(result);
    }
    async reply(courseId, evaluationId, userId, replyDto) {
        const evaluation = await this.evaluationsService.reply(evaluationId, userId, replyDto);
        return response_dto_1.ApiResponse.success(evaluation, '回复成功');
    }
};
exports.EvaluationsController = EvaluationsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.STUDENT),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, create_evaluation_dto_1.CreateEvaluationDto]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "findByCourse", null);
__decorate([
    (0, common_1.Get)('check'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "checkEvaluated", null);
__decorate([
    (0, common_1.Post)(':evaluationId/reply'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('evaluationId', common_1.ParseIntPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, reply_evaluation_dto_1.ReplyEvaluationDto]),
    __metadata("design:returntype", Promise)
], EvaluationsController.prototype, "reply", null);
exports.EvaluationsController = EvaluationsController = __decorate([
    (0, common_1.Controller)('courses/:courseId/evaluations'),
    __metadata("design:paramtypes", [evaluations_service_1.EvaluationsService])
], EvaluationsController);
//# sourceMappingURL=evaluations.controller.js.map