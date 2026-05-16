import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse, BusinessException } from '../../common/dto/response.dto';
import { PaginationDto, PaginationMeta } from '../../common/dto/pagination.dto';

/**
 * 用户控制器
 * 功能描述：处理用户个人信息相关的接口
 *
 * 接口权限说明：
 * - GET /users/profile         → 需登录，获取当前用户信息
 * - PUT /users/profile         → 需登录，更新当前用户信息
 * - GET /users                 → 需 super_admin，管理端用户列表
 * - PATCH /users/:id/toggle    → 需 super_admin，切换用户状态
 * - DELETE /users/:id          → 需 super_admin，删除用户
 */
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取当前登录用户信息
   * GET /api/v1/users/profile
   */
  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: number) {
    const user = await this.usersService.findById(userId);
    return ApiResponse.success(user);
  }

  /**
   * 更新当前登录用户信息
   * PUT /api/v1/users/profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser('sub') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(userId, updateUserDto);
    return ApiResponse.success(user, '更新成功');
  }

  /**
   * 管理端：获取用户列表
   * GET /api/v1/users
   * 支持按角色筛选和关键词搜索（用户名/昵称）
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('role') role?: string,
    @Query('keyword') keyword?: string,
  ) {
    const { page = 1, pageSize = 20 } = paginationDto;
    const { items, total } = await this.usersService.findAll(page, pageSize, role, keyword);
    const meta = new PaginationMeta(total, page, pageSize);
    return ApiResponse.successWithPagination(items, meta);
  }

  /**
   * 管理端：切换用户启用/禁用状态
   * PATCH /api/v1/users/:id/toggle
   */
  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.toggleActive(id);
    return ApiResponse.success(user, '用户状态已更新');
  }

  /**
   * 管理端：删除用户（超级管理员专用）
   * DELETE /api/v1/users/:id
   * 不能删除自己
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') currentUserId: number,
  ) {
    // 禁止删除自己
    if (id === currentUserId) {
      throw BusinessException.forbidden('不能删除自己的账号');
    }
    await this.usersService.remove(id);
    return ApiResponse.success(null, '用户已删除');
  }
}
