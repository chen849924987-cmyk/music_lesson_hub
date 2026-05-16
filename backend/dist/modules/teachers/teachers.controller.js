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
exports.TeachersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const teachers_service_1 = require("./teachers.service");
const update_teacher_dto_1 = require("./dto/update-teacher.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const response_dto_1 = require("../../common/dto/response.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let TeachersController = class TeachersController {
    teachersService;
    constructor(teachersService) {
        this.teachersService = teachersService;
    }
    async createProfile(userId, realName) {
        const teacher = await this.teachersService.create(userId, realName);
        return response_dto_1.ApiResponse.created(teacher, '教师信息创建成功');
    }
    async getProfile(userId) {
        const teacher = await this.teachersService.findByUserId(userId);
        return response_dto_1.ApiResponse.success(teacher);
    }
    async updateProfile(userId, updateTeacherDto) {
        const teacher = await this.teachersService.update(userId, updateTeacherDto);
        return response_dto_1.ApiResponse.success(teacher, '更新成功');
    }
    async updateSettings(userId, updateTeacherDto) {
        const teacher = await this.teachersService.update(userId, updateTeacherDto);
        return response_dto_1.ApiResponse.success(teacher, '教师设置已更新');
    }
    async findAll(paginationDto) {
        const { page = 1, pageSize = 20 } = paginationDto;
        const { items, total } = await this.teachersService.findAll(page, pageSize);
        const meta = new pagination_dto_1.PaginationMeta(total, page, pageSize);
        return response_dto_1.ApiResponse.successWithPagination(items, meta);
    }
    async findOne(id) {
        const teacher = await this.teachersService.findById(id);
        return response_dto_1.ApiResponse.success(teacher);
    }
    async verifyTeacher(id) {
        const teacher = await this.teachersService.verifyTeacher(id);
        return response_dto_1.ApiResponse.success(teacher, '教师认证成功');
    }
    async reviewTeacher(id, approved) {
        if (approved) {
            const teacher = await this.teachersService.verifyTeacher(id);
            return response_dto_1.ApiResponse.success(teacher, '教师认证成功');
        }
        else {
            const teacher = await this.teachersService.unverifyTeacher(id);
            return response_dto_1.ApiResponse.success(teacher, '已取消教师认证');
        }
    }
};
exports.TeachersController = TeachersController;
__decorate([
    (0, common_1.Post)('profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER, constants_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)('realName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "createProfile", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_teacher_dto_1.UpdateTeacherDto]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, roles_decorator_1.Roles)(constants_1.Role.TEACHER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_teacher_dto_1.UpdateTeacherDto]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "verifyTeacher", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(constants_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('approved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Boolean]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "reviewTeacher", null);
exports.TeachersController = TeachersController = __decorate([
    (0, common_1.Controller)('teachers'),
    __metadata("design:paramtypes", [teachers_service_1.TeachersService])
], TeachersController);
//# sourceMappingURL=teachers.controller.js.map