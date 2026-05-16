import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CreateAccountDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '../../common/dto/response.dto';
import { User } from '../users/entities/user.entity';

/**
 * 认证控制器
 * 功能描述：处理用户注册、登录、管理员后台创建账号等认证相关接口
 * 
 * 接口权限说明：
 * - POST /auth/register          → 公开，学员自助注册
 * - POST /auth/login             → 公开，学员登录
 * - POST /auth/admin/login       → 公开，管理员/教师登录
 * - POST /auth/accounts/teacher  → 需要 super_admin 权限，创建教师账号
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 学员注册
   * POST /api/v1/auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return ApiResponse.created(user, '注册成功');
  }

  /**
   * 用户登录（学员端）
   * POST /api/v1/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ApiResponse.success(result, '登录成功');
  }

  /**
   * 管理员/教师登录（管理后台）
   * POST /api/v1/auth/admin/login
   */
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: LoginDto) {
    const result = await this.authService.adminLogin(loginDto);
    return ApiResponse.success(result, '登录成功');
  }

  /**
   * 管理员创建教师账号
   * POST /api/v1/auth/accounts/teacher
   * 需要 super_admin 角色
   */
  @Post('accounts/teacher')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createTeacher(@Body() createAccountDto: CreateAccountDto) {
    const user = await this.authService.createAccount(
      createAccountDto,
      Role.TEACHER,
    );
    return ApiResponse.created(user, '教师账号创建成功');
  }

  /**
   * 管理员创建审核员账号
   * POST /api/v1/auth/accounts/reviewer
   * 需要 super_admin 角色
   */
  @Post('accounts/reviewer')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createReviewer(@Body() createAccountDto: CreateAccountDto) {
    const user = await this.authService.createAccount(
      createAccountDto,
      Role.REVIEWER,
    );
    return ApiResponse.created(user, '审核员账号创建成功');
  }

  /**
   * 修改当前用户密码
   * POST /api/v1/auth/change-password
   * 需要登录状态
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @CurrentUser('sub') userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(userId, changePasswordDto);
    return ApiResponse.success(result, '密码修改成功');
  }

  /**
   * 管理员创建运营管理员账号
   * POST /api/v1/auth/accounts/operator
   * 需要 super_admin 角色
   */
  @Post('accounts/operator')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createOperator(@Body() createAccountDto: CreateAccountDto) {
    const user = await this.authService.createAccount(
      createAccountDto,
      Role.OPERATOR,
    );
    return ApiResponse.created(user, '管理员账号创建成功');
  }
}
