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
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const teacher_entity_1 = require("./entities/teacher.entity");
const response_dto_1 = require("../../common/dto/response.dto");
let TeachersService = class TeachersService {
    teacherRepository;
    constructor(teacherRepository) {
        this.teacherRepository = teacherRepository;
    }
    async create(userId, realName) {
        const existing = await this.teacherRepository.findOne({
            where: { userId },
        });
        if (existing) {
            throw response_dto_1.BusinessException.conflict('该用户已是教师');
        }
        const teacher = this.teacherRepository.create({
            userId,
            realName,
        });
        return this.teacherRepository.save(teacher);
    }
    async findByUserId(userId) {
        const teacher = await this.teacherRepository.findOne({
            where: { userId },
            relations: ['user'],
        });
        if (!teacher) {
            throw response_dto_1.BusinessException.notFound('教师信息不存在');
        }
        return teacher;
    }
    async update(userId, updateTeacherDto) {
        const teacher = await this.findByUserId(userId);
        Object.assign(teacher, updateTeacherDto);
        return this.teacherRepository.save(teacher);
    }
    async findAll(page = 1, pageSize = 20) {
        const [items, total] = await this.teacherRepository.findAndCount({
            relations: ['user'],
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { createdAt: 'DESC' },
        });
        return { items, total };
    }
    async findById(teacherId) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
            relations: ['user'],
        });
        if (!teacher) {
            throw response_dto_1.BusinessException.notFound('教师信息不存在');
        }
        return teacher;
    }
    async verifyTeacher(teacherId) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw response_dto_1.BusinessException.notFound('教师信息不存在');
        }
        teacher.isVerified = true;
        return this.teacherRepository.save(teacher);
    }
    async unverifyTeacher(teacherId) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw response_dto_1.BusinessException.notFound('教师信息不存在');
        }
        teacher.isVerified = false;
        return this.teacherRepository.save(teacher);
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map