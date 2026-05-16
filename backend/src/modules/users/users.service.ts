import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { BusinessException } from '../../common/dto/response.dto';

/**
 * 用户服务
 * 功能描述：处理用户个人信息的管理逻辑，包括查询、更新、删除等操作
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 根据用户ID查询用户信息
   * @param id 用户ID
   * @returns 用户信息（不含密码），教师角色会包含关联的教师设置（收款账号等）
   * @throws BusinessException 当用户不存在时抛出
   */
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['teacher'],
    });
    if (!user) {
      throw BusinessException.notFound('用户不存在');
    }
    return user;
  }

  /**
   * 更新用户信息
   * @param userId 当前登录用户ID
   * @param updateUserDto 要更新的字段
   * @returns 更新后的用户信息
   */
  async update(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    // 合并更新字段
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * 获取用户列表（管理员用）
   * @param page 页码
   * @param pageSize 每页条数
   * @param role 按角色筛选（可选）
   * @param keyword 关键词搜索（可选，按用户名/昵称模糊匹配）
   * @returns 用户列表和总数
   */
  async findAll(
    page: number = 1,
    pageSize: number = 20,
    role?: string,
    keyword?: string,
  ): Promise<{ items: User[]; total: number }> {
    // 构建查询条件
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 按角色筛选
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // 按关键词搜索（用户名或昵称模糊匹配）
    if (keyword) {
      queryBuilder.andWhere(
        '(user.username LIKE :keyword OR user.nickname LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 排序、分页
    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  /**
   * 切换用户启用/禁用状态（管理员用）
   * @param userId 目标用户ID
   * @returns 更新后的用户信息
   */
  async toggleActive(userId: number): Promise<User> {
    const user = await this.findById(userId);
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  /**
   * 删除用户（超级管理员用）
   * 功能描述：删除指定用户，同时会级联删除关联的教师记录（如果存在）
   * @param userId 目标用户ID
   * @throws BusinessException 用户不存在或试图删除自己时抛出
   */
  async remove(userId: number): Promise<void> {
    const user = await this.findById(userId);
    // 使用原生 delete 方法直接删除，CASCADE 会处理关联表
    await this.userRepository.remove(user);
  }
}
