import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { BusinessException } from '../../common/dto/response.dto';

/**
 * 教师服务
 * 功能描述：处理教师信息的管理逻辑，包括信息补充、查询、认证等
 */
@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  /**
   * 创建教师信息（管理员录入教师账号后，首次完善信息时调用）
   * @param userId 用户ID
   * @param realName 真实姓名
   * @returns 创建的教师信息
   */
  async create(userId: number, realName: string): Promise<Teacher> {
    const existing = await this.teacherRepository.findOne({
      where: { userId },
    });
    if (existing) {
      throw BusinessException.conflict('该用户已是教师');
    }

    const teacher = this.teacherRepository.create({
      userId,
      realName,
    });
    return this.teacherRepository.save(teacher);
  }

  /**
   * 根据用户ID查询教师信息
   * @param userId 用户ID
   * @returns 教师信息
   */
  async findByUserId(userId: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!teacher) {
      throw BusinessException.notFound('教师信息不存在');
    }
    return teacher;
  }

  /**
   * 更新教师信息
   * @param userId 用户ID
   * @param updateTeacherDto 要更新的字段
   * @returns 更新后的教师信息
   */
  async update(
    userId: number,
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<Teacher> {
    const teacher = await this.findByUserId(userId);
    Object.assign(teacher, updateTeacherDto);
    return this.teacherRepository.save(teacher);
  }

  /**
   * 获取所有教师列表（管理端用）
   * @param page 页码
   * @param pageSize 每页条数
   * @returns 教师列表和总数
   */
  async findAll(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: Teacher[]; total: number }> {
    const [items, total] = await this.teacherRepository.findAndCount({
      relations: ['user'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  /**
   * 根据教师记录ID查询教师详情
   * @param teacherId 教师记录ID（teacher.id）
   * @returns 教师信息（含关联用户）
   */
  async findById(teacherId: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
    });
    if (!teacher) {
      throw BusinessException.notFound('教师信息不存在');
    }
    return teacher;
  }

  /**
   * 认证教师身份（管理端审核通过）
   * @param teacherId 教师记录ID
   * @returns 更新后的教师信息
   */
  async verifyTeacher(teacherId: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw BusinessException.notFound('教师信息不存在');
    }
    teacher.isVerified = true;
    return this.teacherRepository.save(teacher);
  }

  /**
   * 取消教师认证（管理端操作）
   * @param teacherId 教师记录ID
   * @returns 更新后的教师信息
   */
  async unverifyTeacher(teacherId: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw BusinessException.notFound('教师信息不存在');
    }
    teacher.isVerified = false;
    return this.teacherRepository.save(teacher);
  }
}
