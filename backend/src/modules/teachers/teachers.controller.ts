import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeachersService } from './teachers.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';
import { PaginationDto, PaginationMeta } from '../../common/dto/pagination.dto';

/**
 * 教师控制器
 * 功能描述：处理教师信息管理相关的接口
 *
 * 接口权限说明：
 * - POST   /teachers/profile        → 教师/管理员，创建教师信息
 * - GET    /teachers/profile        → 教师，获取当前教师信息
 * - PUT    /teachers/profile        → 教师，更新教师信息
 * - GET    /teachers                → 管理员，获取教师列表
 * - POST   /teachers/:id/verify     → 管理员，认证教师
 * - PATCH  /teachers/:id/review     → 管理员，审核教师认证（通过/取消认证）
 */
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  /**
   * 创建教师信息（第一次完善资料）
   * POST /api/v1/teachers/profile
   */
  @Post('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.SUPER_ADMIN)
  async createProfile(
    @CurrentUser('sub') userId: number,
    @Body('realName') realName: string,
  ) {
    const teacher = await this.teachersService.create(userId, realName);
    return ApiResponse.created(teacher, '教师信息创建成功');
  }

  /**
   * 获取当前教师信息
   * GET /api/v1/teachers/profile
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.TEACHER)
  async getProfile(@CurrentUser('sub') userId: number) {
    const teacher = await this.teachersService.findByUserId(userId);
    return ApiResponse.success(teacher);
  }

  /**
   * 更新教师信息
   * PUT /api/v1/teachers/profile
   */
  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.TEACHER)
  async updateProfile(
    @CurrentUser('sub') userId: number,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    const teacher = await this.teachersService.update(userId, updateTeacherDto);
    return ApiResponse.success(teacher, '更新成功');
  }

  /**
   * 教师端：更新设置（收款账号、通知偏好等）
   * PUT /api/v1/teachers/settings
   *
   * 功能描述：独立的教师设置更新接口，区别于完整的 profile 更新，
   *           只更新收款账号和通知偏好等通用设置字段
   */
  @Put('settings')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.TEACHER)
  async updateSettings(
    @CurrentUser('sub') userId: number,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    const teacher = await this.teachersService.update(userId, updateTeacherDto);
    return ApiResponse.success(teacher, '教师设置已更新');
  }

  /**
   * 管理端：获取教师列表
   * GET /api/v1/teachers
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page = 1, pageSize = 20 } = paginationDto;
    const { items, total } = await this.teachersService.findAll(page, pageSize);
    const meta = new PaginationMeta(total, page, pageSize);
    return ApiResponse.successWithPagination(items, meta);
  }

  /**
   * 管理端：获取教师详情（按教师ID）
   * GET /api/v1/teachers/:id
   *
   * @param id 教师记录ID（teacher.id，非 userId）
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const teacher = await this.teachersService.findById(id);
    return ApiResponse.success(teacher);
  }

  /**
   * 管理端：认证教师身份
   * POST /api/v1/teachers/:id/verify
   */
  @Post(':id/verify')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async verifyTeacher(@Param('id', ParseIntPipe) id: number) {
    const teacher = await this.teachersService.verifyTeacher(id);
    return ApiResponse.success(teacher, '教师认证成功');
  }

  /**
   * 管理端：审核教师认证（通过/取消认证）
   * PATCH /api/v1/teachers/:id/review
   *
   * @param id 教师记录ID
   * @param body.approved true=通过认证，false=取消认证
   */
  @Patch(':id/review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async reviewTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Body('approved') approved: boolean,
  ) {
    if (approved) {
      const teacher = await this.teachersService.verifyTeacher(id);
      return ApiResponse.success(teacher, '教师认证成功');
    } else {
      const teacher = await this.teachersService.unverifyTeacher(id);
      return ApiResponse.success(teacher, '已取消教师认证');
    }
  }
}
