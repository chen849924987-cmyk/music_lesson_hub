import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Course } from './entities/course.entity';
import { UserCourse } from './entities/user-course.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ReplyEvaluationDto } from './dto/reply-evaluation.dto';
import { BusinessException } from '../../common/dto/response.dto';

/**
 * 评价服务
 * 功能描述：处理课程评价的核心业务逻辑，包括发表评价、教师回复、查询评价列表、更新课程评分等。
 *          评价要求：仅已购买课程的制作人可发表评价，每人每课限一条评价。
 *
 * @param evaluationRepository - 评价数据库操作
 * @param courseRepository - 课程数据库操作
 */
@Injectable()
export class EvaluationsService {
  private readonly logger = new Logger(EvaluationsService.name);

  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(UserCourse)
    private readonly userCourseRepository: Repository<UserCourse>,
  ) {}

  /**
   * 发表课程评价
   * 功能描述：已购制作人对课程发表评价，包含评分和文字内容。
   *          发表成功后，同步更新课程的 rating（平均分）和 reviewCount（评价数）。
   *
   * @param courseId - 课程ID
   * @param userId - 制作人用户ID
   * @param createEvaluationDto - 评价参数（评分、文字内容）
   * @returns 创建的评价信息
   *
   * @throws BusinessException.conflict 已评价过该课程
   * @throws BusinessException.notFound 课程不存在
   */
  async create(
    courseId: number,
    userId: number,
    createEvaluationDto: CreateEvaluationDto,
  ): Promise<Evaluation> {
    // 验证课程存在
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw BusinessException.notFound('课程不存在');
    }

    // 检查是否已评价过
    const existing = await this.evaluationRepository.findOne({
      where: { courseId, userId },
    });
    if (existing) {
      throw BusinessException.conflict('您已评价过该课程，不能重复评价');
    }

    // 检查用户是否购买了该课程
    // 通过查询 user_courses 表判断用户是否有购买记录
    const purchased = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });

    // 创建评价记录
    const evaluation = this.evaluationRepository.create({
      courseId,
      userId,
      rating: createEvaluationDto.rating,
      content: createEvaluationDto.content,
      isPurchased: !!purchased, // 有购买记录则为 true，否则 false
    });
    const saved = await this.evaluationRepository.save(evaluation);

    // 同步更新课程的平均评分和评价数（仅统计已购用户的评价）
    await this.syncCourseRating(courseId);

    return saved;
  }

  /**
   * 教师回复评价
   * 功能描述：课程教师回复制作人的评价，回复内容会展示在评价下方。
   *
   * @param evaluationId - 评价ID
   * @param teacherId - 教师用户ID（需要验证是该课程的教师）
   * @param replyDto - 回复内容
   * @returns 更新后的评价信息
   *
   * @throws BusinessException.notFound 评价不存在
   * @throws BusinessException.forbidden 无权操作（非课程教师）
   * @throws BusinessException.conflict 已回复过
   */
  async reply(
    evaluationId: number,
    teacherId: number,
    replyDto: ReplyEvaluationDto,
  ): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id: evaluationId },
      relations: ['course'],
    });
    if (!evaluation) {
      throw BusinessException.notFound('评价不存在');
    }

    // 验证操作者是否为课程教师
    if (evaluation.course.teacherId !== teacherId) {
      throw BusinessException.forbidden('仅课程教师可回复评价');
    }

    // 检查是否已回复
    if (evaluation.replyContent) {
      throw BusinessException.conflict('您已回复过该评价');
    }

    // 更新回复内容
    evaluation.replyContent = replyDto.replyContent;
    evaluation.repliedAt = new Date();
    return this.evaluationRepository.save(evaluation);
  }

  /**
   * 获取课程的公开评价列表
   * 功能描述：分页获取指定课程的评价列表，仅返回可见的评价（isVisible = true）。
   *          排序规则：最新评价优先展示。
   *
   * @param courseId - 课程ID
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 评价列表和分页信息
   */
  async findByCourse(
    courseId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    items: Evaluation[];
    meta: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const [items, total] = await this.evaluationRepository.findAndCount({
      where: { courseId, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取用户的评价列表
   * 功能描述：获取当前用户发表的所有评价，用于制作人端"我的评价"页面。
   *
   * @param userId - 用户ID
   * @param page - 页码
   * @param pageSize - 每页条数
   * @returns 评价列表和分页信息
   */
  async findByUser(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    items: Evaluation[];
    meta: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const [items, total] = await this.evaluationRepository.findAndCount({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 查询用户是否已评价某课程
   * 功能描述：检查指定用户是否已经评价过某课程，用于前端控制"发表评价"按钮显示。
   *
   * @param courseId - 课程ID
   * @param userId - 用户ID
   * @returns 是否已评价，如果是则返回评价信息
   */
  async checkUserEvaluated(
    courseId: number,
    userId: number,
  ): Promise<{ evaluated: boolean; evaluation?: Evaluation }> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { courseId, userId },
    });
    if (evaluation) {
      return { evaluated: true, evaluation };
    }
    return { evaluated: false };
  }

  /**
   * 同步更新课程的平均评分和评价数
   * 功能描述：重新计算指定课程所有可见评价的平均分和评价总数，更新到 course 表。
   *
   * @param courseId - 课程ID
   */
  private async syncCourseRating(courseId: number): Promise<void> {
    try {
      // 仅统计已购用户（isPurchased = true）的可见评价，未购用户的评价不计入总评分
      const result = await this.evaluationRepository
        .createQueryBuilder('e')
        .select('AVG(e.rating)', 'avgRating')
        .addSelect('COUNT(e.id)', 'count')
        .where('e.courseId = :courseId', { courseId })
        .andWhere('e.isVisible = true')
        .andWhere('e.isPurchased = true')
        .getRawOne();

      const avgRating = Number(result?.avgRating || 0);
      const reviewCount = Number(result?.count || 0);

      await this.courseRepository.update(courseId, {
        rating: Math.round(avgRating * 100) / 100, // 保留两位小数
        reviewCount,
      });

      this.logger.log(
        `课程评分已同步: courseId=${courseId}, avgRating=${avgRating}, reviewCount=${reviewCount}`,
      );
    } catch (error) {
      this.logger.error(`同步课程评分失败: courseId=${courseId}`, error);
    }
  }
}
