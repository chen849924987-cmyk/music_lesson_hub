import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BusinessException } from '../../common/dto/response.dto';

/**
 * 分类服务
 * 功能描述：处理课程分类的管理逻辑，包括创建、查询、更新、排序等
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * 创建课程分类
   * @param createCategoryDto 创建分类参数
   * @returns 创建的分类信息
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });
    if (existing) {
      throw BusinessException.conflict('该分类名称已存在');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * 获取所有分类列表（按排序权重升序排列）
   * @returns 分类列表
   */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 获取启用的分类列表（客户端使用）
   * @returns 启用的分类列表
   */
  async findActive(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 根据ID查询分类
   * @param id 分类ID
   * @returns 分类信息
   */
  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw BusinessException.notFound('分类不存在');
    }
    return category;
  }

  /**
   * 更新分类信息
   * @param id 分类ID
   * @param updateCategoryDto 要更新的字段
   * @returns 更新后的分类信息
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    // 如果修改了名称，检查是否与其他分类冲突
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existing) {
        throw BusinessException.conflict('该分类名称已存在');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * 删除分类
   * @param id 分类ID
   */
  async remove(id: number): Promise<void> {
    const category = await this.findById(id);
    await this.categoryRepository.remove(category);
  }
}
