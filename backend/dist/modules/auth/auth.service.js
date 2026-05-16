"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../users/entities/user.entity");
const response_dto_1 = require("../../common/dto/response.dto");
const constants_1 = require("../../common/constants");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { username, password, nickname, phone, email } = registerDto;
        const existingUser = await this.userRepository.findOne({
            where: { username },
        });
        if (existingUser) {
            throw response_dto_1.BusinessException.conflict('用户名已存在');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            username,
            password: hashedPassword,
            nickname: nickname || username,
            phone: phone || '',
            email: email || '',
            role: constants_1.Role.STUDENT,
        });
        const savedUser = await this.userRepository.save(user);
        const { password: _, ...result } = savedUser;
        return result;
    }
    async login(loginDto) {
        const { username, password } = loginDto;
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.username = :username', { username })
            .getOne();
        if (!user) {
            throw response_dto_1.BusinessException.badRequest('用户名或密码错误');
        }
        if (!user.isActive) {
            throw response_dto_1.BusinessException.forbidden('账号已被禁用，请联系管理员');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw response_dto_1.BusinessException.badRequest('用户名或密码错误');
        }
        await this.userRepository.update(user.id, { lastLoginAt: new Date() });
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);
        const { password: _, ...userInfo } = user;
        return { user: userInfo, accessToken };
    }
    async adminLogin(loginDto) {
        const result = await this.login(loginDto);
        const adminRoles = [constants_1.Role.SUPER_ADMIN, constants_1.Role.REVIEWER, constants_1.Role.OPERATOR, constants_1.Role.TEACHER];
        if (!adminRoles.includes(result.user.role)) {
            throw response_dto_1.BusinessException.forbidden('没有管理后台访问权限');
        }
        return result;
    }
    async changePassword(userId, changePasswordDto) {
        const { oldPassword, newPassword } = changePasswordDto;
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id: userId })
            .getOne();
        if (!user) {
            throw response_dto_1.BusinessException.notFound('用户不存在');
        }
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw response_dto_1.BusinessException.badRequest('旧密码错误');
        }
        if (oldPassword === newPassword) {
            throw response_dto_1.BusinessException.badRequest('新密码不能与旧密码相同');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(userId, { password: hashedPassword });
        this.logger.log(`用户 ${user.username} (ID: ${userId}) 修改了密码`);
        return { message: '密码修改成功' };
    }
    async createAccount(createAccountDto, role) {
        const { username, password, nickname, phone, email } = createAccountDto;
        const existingUser = await this.userRepository.findOne({
            where: { username },
        });
        if (existingUser) {
            throw response_dto_1.BusinessException.conflict('用户名已存在');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            username,
            password: hashedPassword,
            nickname: nickname || username,
            phone: phone || '',
            email: email || '',
            role,
        });
        const savedUser = await this.userRepository.save(user);
        const { password: _, ...result } = savedUser;
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map