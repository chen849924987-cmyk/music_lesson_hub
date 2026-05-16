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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const response_dto_1 = require("../../common/dto/response.dto");
let UsersService = class UsersService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['teacher'],
        });
        if (!user) {
            throw response_dto_1.BusinessException.notFound('用户不存在');
        }
        return user;
    }
    async update(userId, updateUserDto) {
        const user = await this.findById(userId);
        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }
    async findAll(page = 1, pageSize = 20, role, keyword) {
        const queryBuilder = this.userRepository.createQueryBuilder('user');
        if (role) {
            queryBuilder.andWhere('user.role = :role', { role });
        }
        if (keyword) {
            queryBuilder.andWhere('(user.username LIKE :keyword OR user.nickname LIKE :keyword)', { keyword: `%${keyword}%` });
        }
        queryBuilder
            .orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);
        const [items, total] = await queryBuilder.getManyAndCount();
        return { items, total };
    }
    async toggleActive(userId) {
        const user = await this.findById(userId);
        user.isActive = !user.isActive;
        return this.userRepository.save(user);
    }
    async remove(userId) {
        const user = await this.findById(userId);
        await this.userRepository.remove(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map