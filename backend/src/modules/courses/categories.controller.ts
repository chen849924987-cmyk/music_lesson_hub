import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

/**
 * 分类控制器
 * 功能描述：处理课程分类的 CRUD 接口
 *
 * 接口权限说明：
 * - GET    /categories          → 公开，获取所有分类
 * - GET    /categories/active   → 公开，获取启用的分类
 * - GET    /categories/:id      → 公开，获取分类详情
 * - POST   /categories          → 管理员，创建分类
 * - PUT    /categories/:id      → 管理员，更新分类
 * - DELETE /categories/:id      → 管理员，删除分类
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * 获取所有分类列表
   * GET /api/v1/categories
   */
  @Get()
  async findAll() {
    const categories = await this.categoriesService.findAll();
    return ApiResponse.success(categories);
  }

  /**
   * 获取启用的分类列表（客户端使用）
   * GET /api/v1/categories/active
   */
  @Get('active')
  async findActive() {
    const categories = await this.categoriesService.findActive();
    return ApiResponse.success(categories);
  }

  /**
   * 根据ID获取分类详情
   * GET /api/v1/categories/:id
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findById(id);
    return ApiResponse.success(category);
  }

  /**
   * 创建分类（管理端）
   * POST /api/v1/categories
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return ApiResponse.created(category, '分类创建成功');
  }

  /**
   * 更新分类（管理端）
   * PUT /api/v1/categories/:id
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return ApiResponse.success(category, '分类更新成功');
  }

  /**
   * 删除分类（管理端）
   * DELETE /api/v1/categories/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    return ApiResponse.success(null, '分类删除成功');
  }
}
