import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto, LoginDto, CreateAccountDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BusinessException } from '../../common/dto/response.dto';
import { Role } from '../../common/constants';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

/**
 * 认证服务
 * 功能描述：处理用户注册、登录、Token 签发等认证相关业务逻辑
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 学员注册
   * @param registerDto 注册参数（用户名、密码、可选昵称等）
   * @returns 注册成功后的用户信息（不包含密码）
   * @throws BusinessException 当用户名已存在时抛出冲突异常
   */
  async register(registerDto: RegisterDto): Promise<Partial<User>> {
    const { username, password, nickname, phone, email } = registerDto;

    // 检查用户名是否已被注册
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw BusinessException.conflict('用户名已存在');
    }

    // 对密码进行 bcrypt 加密，盐值轮数为10
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户，默认角色为学员
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: nickname || username, // 未提供昵称时使用用户名
      phone: phone || '',
      email: email || '',
      role: Role.STUDENT,
    });

    const savedUser = await this.userRepository.save(user);

    // 返回用户信息（排除密码等敏感字段）
    const { password: _, ...result } = savedUser;
    return result;
  }

  /**
   * 用户登录
   * @param loginDto 登录参数（用户名、密码）
   * @returns 包含用户信息和 JWT Token 的对象
   * @throws BusinessException 当用户名不存在或密码错误时抛出
   */
  async login(loginDto: LoginDto): Promise<{ user: Partial<User>; accessToken: string }> {
    const { username, password } = loginDto;

    // 查找用户（使用 QueryBuilder 获取密码字段，因为 entity 中 password 设置了 select: false）
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw BusinessException.badRequest('用户名或密码错误');
    }

    // 检查账号是否被禁用
    if (!user.isActive) {
      throw BusinessException.forbidden('账号已被禁用，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw BusinessException.badRequest('用户名或密码错误');
    }

    // 更新最后登录时间
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // 构建 JWT 载荷
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    // 生成 JWT Token
    const accessToken = this.jwtService.sign(payload);

    // 返回用户信息（排除密码）和 Token
    const { password: _, ...userInfo } = user;
    return { user: userInfo, accessToken };
  }

  /**
   * 管理员/教师登录
   * @param loginDto 登录参数（用户名、密码）
   * @returns 包含用户信息和 JWT Token 的对象
   * @throws BusinessException 当非管理员/教师身份登录时抛出
   */
  async adminLogin(loginDto: LoginDto): Promise<{ user: Partial<User>; accessToken: string }> {
    const result = await this.login(loginDto);

    // 检查角色是否为管理员或教师
    const adminRoles = [Role.SUPER_ADMIN, Role.REVIEWER, Role.OPERATOR, Role.TEACHER];
    if (!adminRoles.includes(result.user.role as Role)) {
      throw BusinessException.forbidden('没有管理后台访问权限');
    }

    return result;
  }

  /**
   * 修改当前用户密码
   *
   * @param userId 当前登录用户ID
   * @param changePasswordDto 旧密码和新密码
   * @returns 成功提示
   * @throws BusinessException 旧密码错误或用户不存在时抛出
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword } = changePasswordDto;

    // 查找用户（必须 select password 因为 entity 设置为 select: false）
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw BusinessException.notFound('用户不存在');
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw BusinessException.badRequest('旧密码错误');
    }

    // 新旧密码不能相同
    if (oldPassword === newPassword) {
      throw BusinessException.badRequest('新密码不能与旧密码相同');
    }

    // 加密新密码并更新
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });

    this.logger.log(`用户 ${user.username} (ID: ${userId}) 修改了密码`);

    return { message: '密码修改成功' };
  }

  /**
   * 管理员后台创建账号（教师/管理员/审核员）
   * @param createAccountDto 账号信息
   * @param role 要创建的角色
   * @returns 创建成功的用户信息
   */
  async createAccount(
    createAccountDto: CreateAccountDto,
    role: Role,
  ): Promise<Partial<User>> {
    const { username, password, nickname, phone, email } = createAccountDto;

    // 检查用户名是否已被注册
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw BusinessException.conflict('用户名已存在');
    }

    // 对密码进行 bcrypt 加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建指定角色的用户
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
}
