import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, DataSource } from 'typeorm';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Course } from './entities/course.entity';
import { Category } from './entities/category.entity';
import { CourseReview } from './entities/course-review.entity';
import { UserCourse } from './entities/user-course.entity';
import { UserLesson } from './entities/user-lesson.entity';
import { Lesson } from './entities/lesson.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { BusinessException } from '../../common/dto/response.dto';
import { CourseStatus, Role } from '../../common/constants';
import { PaginationMeta } from '../../common/dto/pagination.dto';
import { StorageService } from '../storage/storage.service';
import { User } from '../users/entities/user.entity';
import { RedisService } from '../../common/redis/redis.service';

/**
 * 课程服务
 * 功能描述：处理课程的核心业务逻辑，包括创建、编辑、查询、状态管理等
 *
 * 缓存策略说明（Redis）：
 * - 公开课程列表（findPublished）：key = "course:catalog:{page}:{pageSize}:{categoryId}:{keyword}"
 *   用户在浏览课程目录时命中缓存，5分钟过期。后台课程状态变更时主动清除缓存。
 * - 课程详情（findById）：key = "course:detail:{id}"
 *   用户查看课程详情页时命中缓存，10分钟过期。课程更新时主动清除缓存。
 */
@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  /** Redis 缓存键前缀 */
  private readonly CACHE_PREFIX = {
    CATALOG: 'course:catalog',
    DETAIL: 'course:detail',
  };

  /** 缓存 TTL（秒） */
  private readonly CACHE_TTL = {
    CATALOG: 300,   // 课程目录缓存5分钟
    DETAIL: 600,    // 课程详情缓存10分钟
  };

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CourseReview)
    private readonly courseReviewRepository: Repository<CourseReview>,
    @InjectRepository(UserCourse)
    private readonly userCourseRepository: Repository<UserCourse>,
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 创建课程
   * 功能描述：新建课程时无需清除缓存，因为新课程默认为草稿状态，
   *          不会出现在公开课程列表中。待审核通过后由审核方法清除缓存。
   * @param teacherId 教师用户ID
   * @param createCourseDto 创建课程参数
   * @returns 创建的课程信息
   */
async create(teacherId: number, createCourseDto: CreateCourseDto): Promise<Course> {
  // 校验分类是否存在
  if (createCourseDto.categoryId) {
    const category = await this.categoryRepository.findOne({
      where: { id: createCourseDto.categoryId },
    });
    if (!category) {
      throw BusinessException.badRequest('分类不存在');
    }
  }

  // previewDuration 校验：非0值必须在 1~600 范围内
  if (createCourseDto.previewDuration && createCourseDto.previewDuration > 0) {
    if (createCourseDto.previewDuration < 1 || createCourseDto.previewDuration > 600) {
      throw BusinessException.badRequest('试看时长必须在 1~600 秒之间');
    }
  }

  // 价格单位转换：前端传入的是"元"，数据库存"分"
  // 乘以100并取整，防止浮点数精度问题
  const rawPrice = createCourseDto.price;
  const rawOriginalPrice = createCourseDto.originalPrice;
  const course = this.courseRepository.create({
    ...createCourseDto,
    price: rawPrice ? Math.round(rawPrice * 100) : 0,
    originalPrice: rawOriginalPrice ? Math.round(rawOriginalPrice * 100) : 0,
    teacherId,
    status: CourseStatus.DRAFT, // 新建课程默认为草稿状态
  });
  return this.courseRepository.save(course);
}

  /**
   * 根据ID查询课程
   * @param id 课程ID
   * @param relations 关联加载的关系
   * @returns 课程信息
   */
  async findById(id: number, relations: string[] = []): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations,
    });
    if (!course) {
      throw BusinessException.notFound('课程不存在');
    }
    return course;
  }

/**
 * 更新课程信息
 * @param id 课程ID
 * @param teacherId 教师用户ID（用于权限验证）
 * @param updateCourseDto 要更新的字段
 * @returns 更新后的课程信息
 */
async update(id: number, teacherId: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
  const course = await this.findById(id);

  // 验证课程归属：只有课程的创建教师才能编辑
  if (course.teacherId !== teacherId) {
    throw BusinessException.forbidden('无权编辑该课程');
  }

  // 课程类型创建后不可修改
  if (updateCourseDto.courseType && updateCourseDto.courseType !== course.courseType) {
    throw BusinessException.badRequest('课程类型创建后不可修改');
  }

  // previewDuration 校验：非0值必须在 1~600 范围内
  if (updateCourseDto.previewDuration && updateCourseDto.previewDuration > 0) {
    if (updateCourseDto.previewDuration < 1 || updateCourseDto.previewDuration > 600) {
      throw BusinessException.badRequest('试看时长必须在 1~600 秒之间');
    }
  }

  // 价格单位转换：前端传入的是"元"，数据库存"分"
  // 只有前端传了价格字段时，才做转换，避免覆盖原有值
  if (updateCourseDto.price !== undefined) {
    updateCourseDto.price = Math.round(updateCourseDto.price * 100);
  }
  if (updateCourseDto.originalPrice !== undefined) {
    updateCourseDto.originalPrice = Math.round(updateCourseDto.originalPrice * 100);
  }

  // 已上架课程编辑 → 标记 pendingEdit，内容需重新审核
  if (course.status === CourseStatus.APPROVED) {
    course.pendingEdit = true;

    // 保存旧版本快照（必须在 apply update 之前读取旧值）
    if (!course.previousData) {
      const snapshot: Record<string, any> = {
        title: course.title,
        price: course.price,
        originalPrice: course.originalPrice,
        description: course.description,
        previewDuration: course.previewDuration,
        tags: course.tags,
        categoryId: course.categoryId,
        trailerVideoId: course.trailerVideoId || null,
      };
      course.previousData = JSON.stringify(snapshot);
    }
  }

  Object.assign(course, updateCourseDto);

  // 如果编辑的是已上架课程，清除课程目录缓存和该课程详情缓存
  if (course.status === CourseStatus.APPROVED) {
    await this.clearCatalogCache();
    await this.clearDetailCache(id);
  }

  return this.courseRepository.save(course);
}

  /**
   * 删除课程
   * @param id 课程ID
   * @param teacherId 教师用户ID（用于权限验证）
   */
  async remove(id: number, teacherId: number): Promise<void> {
    const course = await this.findById(id);

    if (course.teacherId !== teacherId) {
      throw BusinessException.forbidden('无权删除该课程');
    }

    // 已上架的课程不允许删除
    if (course.status === CourseStatus.APPROVED) {
      throw BusinessException.badRequest('已上架课程不允许删除，请先下架');
    }

    await this.courseRepository.remove(course);
  }

  /**
   * 分页查询课程列表（客户端公开接口，仅返回已上架的课程）
   * 使用 Redis 缓存：key = "course:catalog:{page}:{pageSize}:{categoryId}:{courseType}:{keyword}:{sortBy}:{sortOrder}"
   * 缓存 TTL = 5 分钟。后台课程状态变更时主动清除缓存。
   * @param queryDto 查询参数
   * @returns 课程列表和分页信息
   */
  async findPublished(queryDto: CourseQueryDto): Promise<{ items: Course[]; meta: PaginationMeta }> {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      courseType,
      keyword,
      sortBy = 'sortOrder',
      sortOrder: sortOrderParam = 'ASC',
    } = queryDto;

    // 构造缓存键：将查询参数序列化，只有无关键词搜索时才使用缓存（带关键词的搜索结果实时性要求高）
    const cacheKey = `${this.CACHE_PREFIX.CATALOG}:${page}:${pageSize}:${categoryId ?? 'all'}:${courseType ?? 'all'}:${keyword ? encodeURIComponent(keyword) : 'all'}:${sortBy}:${sortOrderParam}`;

    // 如果没有关键词搜索，尝试从缓存读取（带关键词搜索时不缓存，确保搜索结果实时准确）
    if (!keyword) {
      const cached = await this.redisService.getJson<{ items: Course[]; meta: PaginationMeta }>(cacheKey);
      if (cached) {
        this.logger.debug(`缓存命中: ${cacheKey}`);
        return cached;
      }
    }

    const queryBuilder = this.courseRepository.createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .addSelect(
        '(SELECT COUNT(l.id) FROM lessons l WHERE l.courseId = course.id)',
        'course_lessonCount',
      )
      .where('course.status = :status', { status: CourseStatus.APPROVED });

    // 按分类筛选
    if (categoryId) {
      queryBuilder.andWhere('course.categoryId = :categoryId', { categoryId });
    }

    // 按课程类型筛选
    if (courseType) {
      queryBuilder.andWhere('course.courseType = :courseType', { courseType });
    }

    // 按关键词搜索标题
    if (keyword) {
      queryBuilder.andWhere('course.title LIKE :keyword', { keyword: `%${keyword}%` });
    }

    // 排序：推荐课程（isRecommended=true）优先展示，之后再按指定的排序字段排列
    const allowedSortFields = ['sortOrder', 'createdAt', 'price', 'studentCount', 'rating'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? `course.${sortBy}` : 'course.sortOrder';
    const safeSortOrder = sortOrderParam === 'DESC' ? 'DESC' : 'ASC';
    queryBuilder
      .addOrderBy('course.isRecommended', 'DESC')
      .addOrderBy(safeSortBy, safeSortOrder);

    // 分页
    const total = await queryBuilder.getCount();
    const { entities, raw } = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawAndEntities();

    // 将子查询的 lessonCount 映射到实体上
    entities.forEach((entity: any, index: number) => {
      entity.lessonCount = Number(raw[index]?.course_lessonCount || 0);
    });

    const meta = new PaginationMeta(total, page, pageSize);
    const result = { items: entities, meta };

    // 如果没有关键词搜索，将结果写入缓存
    if (!keyword) {
      await this.redisService.set(cacheKey, result, this.CACHE_TTL.CATALOG);
      this.logger.debug(`缓存写入: ${cacheKey}`);
    }

    return result;
  }

  /**
   * 分页查询教师自己的课程列表
   * @param teacherId 教师用户ID
   * @param queryDto 查询参数
   * @returns 课程列表和分页信息
   */
  async findTeacherCourses(
    teacherId: number,
    queryDto: CourseQueryDto,
  ): Promise<{ items: Course[]; meta: PaginationMeta }> {
    const { page = 1, pageSize = 20, status } = queryDto;

    const where: any = { teacherId };

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.courseRepository.findAndCount({
      where,
      relations: ['category'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const meta = new PaginationMeta(total, page, pageSize);
    return { items, meta };
  }

  /**
   * 管理端分页查询所有课程
   * @param queryDto 查询参数
   * @returns 课程列表和分页信息
   */
  async findAll(queryDto: CourseQueryDto): Promise<{ items: Course[]; meta: PaginationMeta }> {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      status,
      keyword,
    } = queryDto;

    const queryBuilder = this.courseRepository.createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category');

    if (categoryId) {
      queryBuilder.andWhere('course.categoryId = :categoryId', { categoryId });
    }

    if (status) {
      queryBuilder.andWhere('course.status = :status', { status });
    }

    if (keyword) {
      queryBuilder.andWhere('course.title LIKE :keyword', { keyword: `%${keyword}%` });
    }

    queryBuilder.orderBy('course.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const meta = new PaginationMeta(total, page, pageSize);
    return { items, meta };
  }

  /**
   * 更新课程状态（教师提交审核/管理员下架等）
   * @param id 课程ID
   * @param status 目标状态
   * @param userId 操作用户ID
   * @param role 操作用户角色
   * @returns 更新后的课程信息
   */
  async updateStatus(
    id: number,
    status: CourseStatus,
    userId: number,
    role: Role,
  ): Promise<Course> {
    const course = await this.findById(id);

    // 教师仅能操作自己的课程
    if (role === Role.TEACHER && course.teacherId !== userId) {
      throw BusinessException.forbidden('无权操作该课程');
    }

    // 状态流转校验
    this.validateStatusTransition(course.status, status, role);

    course.status = status;

    // 状态变更影响课程在公开列表中的可见性，清除目录缓存
    const saved = await this.courseRepository.save(course);
    await this.clearCatalogCache();
    await this.clearDetailCache(id);
    return saved;
  }

  /**
   * 获取待审核课程列表（管理员/审核员用）
   * 功能描述：查询所有状态为 pending 的课程，按提交时间倒序排列
   * @param queryDto 查询参数
   * @returns 课程列表和分页信息
   */
  async findPendingReview(
    queryDto: CourseQueryDto,
  ): Promise<{ items: Course[]; meta: PaginationMeta }> {
    const { page = 1, pageSize = 20 } = queryDto;

    const [items, total] = await this.courseRepository.findAndCount({
      where: { status: CourseStatus.PENDING },
      relations: ['category'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const meta = new PaginationMeta(total, page, pageSize);
    return { items, meta };
  }

  /**
   * 获取待审核课程数量
   * 功能描述：统计当前待审核的课程总数，用于控制台显示待办事项数量
   * @returns 待审核课程数量
   */
  async countPendingReview(): Promise<number> {
    return this.courseRepository.count({
      where: { status: CourseStatus.PENDING },
    });
  }

  /**
   * 教师提交审核
   * 功能描述：将草稿/已驳回/已上架编辑后的课程提交审核，状态变为 pending
   *          已上架课程提交时自动保存旧版本快照（previousData），供审核员对比
   * @param id 课程ID
   * @param teacherId 教师用户ID
   * @returns 更新后的课程
   */
  async submitForReview(id: number, teacherId: number): Promise<Course> {
    const course = await this.findById(id);

    if (course.teacherId !== teacherId) {
      throw BusinessException.forbidden('无权操作该课程');
    }

    // 允许以下状态提交审核：草稿、已驳回、已上架（pendingEdit 场景）、已下架（重新上架审核）
    if (course.status !== CourseStatus.DRAFT &&
        course.status !== CourseStatus.REJECTED &&
        course.status !== CourseStatus.APPROVED &&
        course.status !== CourseStatus.OFF_SHELF) {
      throw BusinessException.badRequest('当前状态的课程无法提交审核');
    }

    // 已上架课程提交审核必须处于 pendingEdit 状态（已编辑过）
    if (course.status === CourseStatus.APPROVED && !course.pendingEdit) {
      throw BusinessException.badRequest('请先保存修改后再提交审核');
    }

    // previousData 在 update() 中已保存，此处不再重复设置
    course.status = CourseStatus.PENDING;
    // 清除上次的审核信息
    course.reviewComment = undefined as any;
    course.reviewerId = undefined as any;
    course.reviewedAt = undefined as any;

    return this.courseRepository.save(course);
  }

  /**
   * 获取课程变更对比数据
   * 功能描述：对比课程当前数据与 previousData（旧版本快照），返回变更字段列表
   *          供审核员了解教师修改了哪些内容
   * @param id 课程ID
   * @returns 变更字段列表，每项包含字段名、旧值、新值
   */
  async getCourseDiff(id: number): Promise<{ field: string; label: string; oldValue: string; newValue: string }[]> {
    const course = await this.findById(id, ['category']);
    if (!course.previousData) return [];

    let previous: any;
    try {
      previous = JSON.parse(course.previousData);
    } catch {
      return [];
    }

    const changes: { field: string; label: string; oldValue: string; newValue: string }[] = [];
    const fieldLabels: Record<string, string> = {
      title: '课程名称',
      price: '价格',
      originalPrice: '原价',
      description: '课程简介',
      previewDuration: '试看时长',
      tags: '标签',
      categoryId: '分类',
      courseType: '课程类型',
    };

    for (const [field, label] of Object.entries(fieldLabels)) {
      if (!(field in previous)) continue;

      const oldVal = previous[field];
      const newVal = (course as any)[field];

      if (String(oldVal) === String(newVal)) continue;

      // 价格字段特殊处理：从分转元
      if (field === 'price' || field === 'originalPrice') {
        changes.push({
          field,
          label,
          oldValue: `¥${(Number(oldVal) / 100).toFixed(2)}`,
          newValue: `¥${(Number(newVal) / 100).toFixed(2)}`,
        });
      } else if (field === 'previewDuration') {
        changes.push({
          field,
          label,
          oldValue: `${oldVal}秒`,
          newValue: `${newVal}秒`,
        });
      } else if (field === 'categoryId') {
        // 获取分类名称（从快照中的ID和当前课程关联的分类）
        const oldCatName = await this.getCategoryName(oldVal);
        const newCatName = course.category?.name || await this.getCategoryName(newVal);
        changes.push({
          field,
          label,
          oldValue: oldCatName,
          newValue: newCatName,
        });
      } else if (field === 'courseType') {
        changes.push({
          field,
          label,
          oldValue: oldVal === 'series' ? '系列课程' : '单课程',
          newValue: newVal === 'series' ? '系列课程' : '单课程',
        });
      } else {
        changes.push({
          field,
          label,
          oldValue: String(oldVal || '(空)'),
          newValue: String(newVal || '(空)'),
        });
      }
    }

    // 对比课时视频变更（基于 lessons 表查询）
    // 注：视频内容无法通过快照对比，此处告知审核员需要查看课程目录确认
    try {
      const lessonsWithVideo = await this.lessonRepository.find({
        where: { courseId: id },
        select: ['id', 'title', 'videoId'],
      });
      const hasAnyVideo = lessonsWithVideo.some(l => l.videoId);
      if (hasAnyVideo) {
        changes.push({
          field: 'lessons_video',
          label: '课时视频',
          oldValue: `${lessonsWithVideo.length} 个课时`,
          newValue: '请查看课程目录确认视频变更',
        });
      }
    } catch {
      // 静默失败
    }

    return changes;
  }

  /**
   * 根据分类ID获取分类名称
   */
  private async getCategoryName(categoryId: number): Promise<string> {
    try {
      const cat = await this.categoryRepository.findOne({
        where: { id: categoryId },
        select: ['name'],
      });
      return cat?.name || `ID:${categoryId}`;
    } catch {
      return `ID:${categoryId}`;
    }
  }

  /**
   * 教师申请下架课程
   * 功能描述：教师从已上架课程点击下架，提交下架申请（状态变为 pending，标记 pendingOffShelf）
   * @param id 课程ID
   * @param teacherId 教师用户ID
   * @returns 更新后的课程
   */
  async requestOffShelf(id: number, teacherId: number): Promise<Course> {
    const course = await this.findById(id);

    if (course.teacherId !== teacherId) {
      throw BusinessException.forbidden('无权操作该课程');
    }

    // 仅允许已上架状态的课程申请下架
    if (course.status !== CourseStatus.APPROVED) {
      throw BusinessException.badRequest('仅已上架课程可以申请下架');
    }

    // 如果已经有待处理的编辑审核或下架申请，不允许重复提交
    if (course.pendingEdit) {
      throw BusinessException.badRequest('课程存在待审核的编辑内容，请等待审核完成后再申请下架');
    }
    if (course.pendingOffShelf) {
      throw BusinessException.badRequest('下架申请已提交，请等待审核');
    }

    // 设置为 pending 状态并标记为下架申请
    course.status = CourseStatus.PENDING;
    course.pendingOffShelf = true;
    course.reviewComment = undefined as any;
    course.reviewerId = undefined as any;
    course.reviewedAt = undefined as any;

    return this.courseRepository.save(course);
  }

  /**
   * 撤回未审核的课程申请（教师端）
   * 功能描述：教师撤回处于待审核状态的课程申请，根据申请类型回到对应状态：
   *          - 新创建课程（非 pendingOffShelf/非 pendingEdit）→ 回到草稿（draft）
   *          - 编辑修改课程（pendingEdit = true）→ 恢复已上架（approved），清除编辑标记
   *          - 申请下架课程（pendingOffShelf = true）→ 恢复已上架（approved），清除下架标记
   * @param id 课程ID
   * @param teacherId 教师用户ID
   * @returns 更新后的课程
   */
  async withdrawReview(id: number, teacherId: number): Promise<Course> {
    const course = await this.findById(id);

    if (course.teacherId !== teacherId) {
      throw BusinessException.forbidden('无权操作该课程');
    }

    // 仅允许待审核状态的课程撤回
    if (course.status !== CourseStatus.PENDING) {
      throw BusinessException.badRequest('仅待审核状态的课程可以撤回');
    }

    if (course.pendingOffShelf) {
      // 下架申请撤回 → 恢复已上架状态，清除下架标记
      course.status = CourseStatus.APPROVED;
      course.pendingOffShelf = false;
    } else if (course.pendingEdit) {
      // 编辑修改申请撤回 → 恢复已上架状态，清除编辑标记
      course.status = CourseStatus.APPROVED;
      course.pendingEdit = false;
    } else {
      // 新创建课程申请撤回 → 回到草稿状态
      course.status = CourseStatus.DRAFT;
    }

    // 清除审核相关信息
    course.reviewComment = undefined as any;
    course.reviewerId = undefined as any;
    course.reviewedAt = undefined as any;

    return this.courseRepository.save(course);
  }
  /**
   * 审核课程（管理员/审核员用）
   * 功能描述：审核员对 pending 状态的课程进行审核，通过或驳回
   *           如果是下架申请（pendingOffShelf），审核逻辑不同
   * @param id 课程ID
   * @param reviewerId 审核员用户ID
   * @param approved 是否通过
   * @param comment 驳回原因（驳回时必填）
   * @returns 更新后的课程
   */
  async reviewCourse(
    id: number,
    reviewerId: number,
    approved: boolean,
    comment?: string,
  ): Promise<Course> {
    const course = await this.findById(id);

    if (course.status !== CourseStatus.PENDING) {
      throw BusinessException.badRequest('只有待审核状态的课程才能审核');
    }

    const previousStatus = course.status;
    let newStatus: string;

    if (approved) {
      if (course.pendingOffShelf) {
        // 下架申请审核通过 → 正式下架
        course.status = CourseStatus.OFF_SHELF;
        course.pendingOffShelf = false;
      } else {
        // 普通上架审核通过
        course.status = CourseStatus.APPROVED;
        course.pendingEdit = false;
      }
      course.reviewComment = undefined as any;
      newStatus = course.status;
    } else {
      if (!comment) {
        throw BusinessException.badRequest('驳回时必须填写原因');
      }
      if (course.pendingOffShelf) {
        // 下架申请被驳回 → 恢复已上架状态，清除标记
        course.status = CourseStatus.APPROVED;
        course.pendingOffShelf = false;
      } else {
        course.status = CourseStatus.REJECTED;
      }
      course.reviewComment = comment;
      newStatus = course.status;
    }

    course.reviewerId = reviewerId;
    course.reviewedAt = new Date();
    const saved = await this.courseRepository.save(course);

    // 保存审核记录到 course_reviews 表
    try {
      const reviewRecord = this.courseReviewRepository.create({
        courseId: id,
        reviewerId,
        action: approved ? 'approved' : 'rejected',
        comment: comment || undefined,
        previousStatus,
        newStatus,
      });
      await this.courseReviewRepository.save(reviewRecord);
      this.logger.log(`审核记录已保存: courseId=${id}, action=${approved ? 'approved' : 'rejected'}`);
    } catch (error) {
      // 审核记录保存失败不影响主流程
      this.logger.warn(`审核记录保存失败: ${(error as Error).message}`);
    }

    // 审核操作会影响课程在公开列表中的可见性，清除目录缓存
    await this.clearCatalogCache();
    await this.clearDetailCache(id);

    return saved;
  }

  /**
   * 获取课程的审核历史记录
   * @param courseId 课程ID
   * @returns 审核记录列表（按时间倒序）
   */
  async getReviewHistory(courseId: number): Promise<CourseReview[]> {
    return this.courseReviewRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 设置课程推荐/置顶（管理员用）
   * 功能描述：切换课程的 isRecommended 标记
   * @param id 课程ID
   * @param isRecommended 是否推荐
   * @returns 更新后的课程
   */
  async setFeatured(id: number, isRecommended: boolean): Promise<Course> {
    const course = await this.findById(id);

    course.isRecommended = isRecommended;

    // 推荐状态变更影响课程列表排序，清除目录缓存
    const saved = await this.courseRepository.save(course);
    await this.clearCatalogCache();
    return saved;
  }

  /**
   * 上传课程封面图
   * 功能描述：接收封面图片文件，上传到 MinIO，更新课程的 cover 字段
   * @param id 课程ID
   * @param teacherId 教师用户ID
   * @param file 上传的图片文件
   * @returns MinIO 中的封面文件路径
   */
  async uploadCover(id: number, teacherId: number, file: Express.Multer.File): Promise<string> {
    const course = await this.findById(id);

    // 验证课程归属
    if (course.teacherId !== teacherId) {
      throw BusinessException.forbidden('无权操作该课程');
    }

    // 生成唯一文件名：covers/{courseId}/{uuid}.{ext}
    const ext = path.extname(file.originalname) || '.jpg';
    const objectName = `covers/${id}/${uuidv4()}${ext}`;

    // 上传到 MinIO
    await this.storageService.uploadFile(
      objectName,
      file.buffer,
      file.size,
      file.mimetype,
    );

    // 更新课程封面字段
    course.cover = objectName;
    await this.courseRepository.save(course);

    // 返回可访问的预签名URL，而非 MinIO 对象路径
    const coverUrl = await this.storageService.getPresignedUrl(objectName, 86400);
    return coverUrl || objectName;
  }

  /**
   * 将课程封面对象名转换为可访问的URL
   * 功能描述：如果 cover 字段是 MinIO 对象路径（不以 http 开头），则生成公开的 Nginx 直链URL
   *           封面图片是公开资源，无需签名保护，使用公开直链配合浏览器缓存以提升加载速度
   * @param course 课程对象（会被直接修改）
   */
  async transformCoverToUrl(course: Course): Promise<void> {
    if (course.cover && !course.cover.startsWith('http')) {
      try {
        // 使用公开直链代替预签名URL，配合浏览器缓存加速封面加载
        // 传入课程更新时间作为缓存失效的时间戳
        const timestamp = course.updatedAt ? new Date(course.updatedAt).getTime() : undefined;
        course.cover = await this.storageService.getPublicUrl(course.cover, timestamp);
      } catch {
        // 如果获取公开URL失败，尝试回退到预签名URL
        try {
          course.cover = await this.storageService.getPresignedUrl(course.cover, 86400);
        } catch {
          this.logger.warn(`获取封面URL失败: ${course.cover}`);
        }
      }
    }
  }

  /**
   * 管理端强制删除课程（超级管理员专用）
   * 功能描述：事务级联删除课程及其所有关联数据，包括：
   *          1. 从 MinIO 删除封面图片
   *          2. 级联删除章节（chapters）、课时（lessons）
   *          3. 删除课时关联的视频（从 MinIO 删除视频文件和封面）、课时关联的附件（从 MinIO 删除附件文件）
   *          4. 删除课程下的所有附件记录
   *          5. 删除审核记录（course_reviews）
   *          6. 删除课程本身
   * @param id 课程ID
   */
  async adminRemove(id: number): Promise<void> {
    const course = await this.findById(id);

    // 使用事务保证级联删除的原子性
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      // Step 1: 删除 MinIO 中的封面文件（如果有）
      if (course.cover && !course.cover.startsWith('http')) {
        try {
          await this.storageService.deleteFile(course.cover);
          this.logger.log(`课程封面文件已从 MinIO 删除: ${course.cover}`);
        } catch (error) {
          this.logger.warn(`删除封面文件失败（可能文件不存在）: ${course.cover} - ${(error as Error).message}`);
        }
      }

      // Step 2: 查询该课程下的所有章节和课时
      const chapters: any[] = await manager.query(
        'SELECT id FROM chapters WHERE courseId = ?', [id],
      );
      const chapterIds = chapters.map((c: any) => c.id);

      // 查询该课程下的所有课时（含单课程下 chapterId 为 null 的课时）
      let lessons: any[];
      if (chapterIds.length > 0) {
        lessons = await manager.query(
          'SELECT id, videoId FROM lessons WHERE courseId = ? OR chapterId IN (?)',
          [id, chapterIds],
        );
      } else {
        lessons = await manager.query(
          'SELECT id, videoId FROM lessons WHERE courseId = ?',
          [id],
        );
      }
      const lessonIds = lessons.map((l: any) => l.id);
      // 收集所有课时关联的视频 ID
      const videoIdsFromLessons = lessons
        .map((l: any) => l.videoId)
        .filter((v: number | null) => v != null);

      // Step 3: 删除课程预告视频（如果有 trailerVideoId）
      if (course.trailerVideoId) {
        videoIdsFromLessons.push(course.trailerVideoId);
      }

      // Step 4: 删除所有关联视频文件（从 MinIO 删除 + 数据库删除 records）
      if (videoIdsFromLessons.length > 0) {
        const uniqueVideoIds = [...new Set<number>(videoIdsFromLessons)];
        // 查询视频的 objectName，以便从 MinIO 删除
        const videos: any[] = await manager.query(
          'SELECT id, objectName, coverObjectName FROM videos WHERE id IN (?)',
          [uniqueVideoIds],
        );
        // 从 MinIO 删除视频文件和封面
        for (const video of videos) {
          try {
            await this.storageService.deleteFile(video.objectName);
            if (video.coverObjectName) {
              await this.storageService.deleteFile(video.coverObjectName);
            }
          } catch (error) {
            this.logger.warn(`删除视频文件失败（可能文件不存在）: ${video.objectName} - ${(error as Error).message}`);
          }
        }
        // 从数据库物理删除视频记录
        await manager.query('DELETE FROM videos WHERE id IN (?)', [uniqueVideoIds]);
        this.logger.log(`已删除 ${uniqueVideoIds.length} 个视频记录`);
      }

      // Step 5: 删除该课程下所有附件的 MinIO 文件 + 数据库记录
      const attachments: any[] = await manager.query(
        'SELECT id, objectName FROM attachments WHERE courseId = ? AND isDeleted = false',
        [id],
      );
      if (attachments.length > 0) {
        for (const att of attachments) {
          try {
            await this.storageService.deleteFile(att.objectName);
          } catch (error) {
            this.logger.warn(`删除附件文件失败（可能文件不存在）: ${att.objectName} - ${(error as Error).message}`);
          }
        }
        // 物理删除附件记录（不用软删除，因为课程都没了）
        await manager.query('DELETE FROM attachments WHERE courseId = ?', [id]);
        this.logger.log(`已删除 ${attachments.length} 个附件记录`);
      }

      // Step 6: 删除课时记录
      if (lessonIds.length > 0) {
        await manager.query('DELETE FROM lessons WHERE id IN (?)', [lessonIds]);
      }

      // Step 7: 删除章节记录
      if (chapterIds.length > 0) {
        await manager.query('DELETE FROM chapters WHERE id IN (?)', [chapterIds]);
      }

      // Step 8: 删除课程审核记录
      await manager.query('DELETE FROM course_reviews WHERE courseId = ?', [id]);

      // Step 9: 最后删除课程本身
      await manager.query('DELETE FROM courses WHERE id = ?', [id]);

      await queryRunner.commitTransaction();
      this.logger.log(`管理端删除课程成功: id=${id}, title=${course.title}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`管理端删除课程失败: id=${id} - ${(error as Error).message}`, error);
      throw BusinessException.internalError('删除课程失败，请稍后重试');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 检查用户是否已购买课程
   * 功能描述：查询 user_courses 表，判断指定用户是否拥有该课程的访问权限
   * @param userId 用户ID
   * @param courseId 课程ID
   * @returns 是否已购买
   */
  async checkUserPurchasedCourse(userId: number, courseId: number): Promise<boolean> {
    const record = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    return !!record;
  }

  /**
   * 检查用户是否有权播放指定课时
   * 功能描述：判断用户能否播放某个课时的视频
   *          1. 课时标记为免费(isFree=true) → 可试看
   *          2. 用户已购买课程 → 可播放
   *          3. 课程教师本人 → 可播放
   * @param userId 用户ID（可选，未登录用户传 null）
   * @param courseId 课程ID
   * @param lessonId 课时ID
   * @returns 包含是否有权限、权限类型(trial/full/none)、试看时长的对象
   */
  async checkLessonAccess(
    userId: number | null,
    courseId: number,
    lessonId: number,
  ): Promise<{ hasAccess: boolean; accessType: 'full' | 'trial' | 'none'; previewDuration: number }> {
    // 轻量查询：只加载需要的字段，避免加载完整课程实体（含分类、章节等关联数据）
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      select: ['id', 'teacherId', 'previewDuration'],
    });
    if (!course) {
      throw BusinessException.notFound('课程不存在');
    }

    // 如果课程教师本人访问，获得完整权限
    if (userId && course.teacherId === userId) {
      return { hasAccess: true, accessType: 'full', previewDuration: 0 };
    }

    // 如果用户已购买课程，获得完整权限
    if (userId) {
      const purchased = await this.checkUserPurchasedCourse(userId, courseId);
      if (purchased) {
        return { hasAccess: true, accessType: 'full', previewDuration: 0 };
      }

      // 检查用户是否单独购买了此课时
      const userLesson = await this.userLessonRepository.findOne({
        where: { userId, lessonId },
      });
      if (userLesson) {
        return { hasAccess: true, accessType: 'full', previewDuration: 0 };
      }
    }

    // 查询课时信息
    const lesson = await this.dataSource.query(
      'SELECT id, isFree, previewDuration, canSinglePurchase, singlePrice FROM lessons WHERE id = ? AND courseId = ?',
      [lessonId, courseId],
    );

    if (lesson.length === 0) {
      return { hasAccess: false, accessType: 'none', previewDuration: 0 };
    }

    // 免费课时（isFree = true）：未购买用户也可完整播放，无时间限制
    // 产品语义：免费课时意味着完全开放，不需要试看限制
    if (lesson[0].isFree) {
      return { hasAccess: true, accessType: 'full', previewDuration: 0 };
    }

    // 非免费课时（isFree = false）：未购买用户进入限时试看模式
    // 试看时长优先使用课时自己的 previewDuration，否则使用课程级的 previewDuration
    const duration = lesson[0].previewDuration > 0 ? lesson[0].previewDuration : course.previewDuration;
    // 如果总试看时长为 0，说明不允许试看（课程未配置试看时长）
    if (duration <= 0) {
      return { hasAccess: false, accessType: 'none', previewDuration: 0 };
    }
    return { hasAccess: true, accessType: 'trial', previewDuration: duration };
  }

  /**
   * 为用户添加课程购买记录
   * 功能描述：完成订单支付后，插入一条 user_courses 记录，同时递增课程的 studentCount
   * @param userId 用户ID
   * @param courseId 课程ID
   * @param price 支付金额（分）
   * @param orderId 订单ID（可选）
   * @returns 创建的购买记录
   */
  async addUserCourse(userId: number, courseId: number, price: number, orderId?: number): Promise<UserCourse> {
    const existing = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      throw BusinessException.conflict('用户已购买该课程');
    }

    const record = this.userCourseRepository.create({
      userId,
      courseId,
      price,
      orderId,
    });
    const saved = await this.userCourseRepository.save(record);

    // 递增课程的 studentCount（新增购买记录时，学习人数 +1）
    await this.courseRepository.increment({ id: courseId }, 'studentCount', 1);

    return saved;
  }

  /**
   * 获取用户的课程列表（已购买）
   * 功能描述：查询用户已购买的所有课程，返回课程信息
   * @param userId 用户ID
   * @returns 已购买的课程列表
   */
  async findUserCourses(userId: number): Promise<Course[]> {
    const userCourses = await this.userCourseRepository.find({
      where: { userId },
      relations: [],
    });
    const courseIds = userCourses.map((uc) => uc.courseId);
    if (courseIds.length === 0) return [];

    const coursesList = await this.courseRepository.find({
      where: { id: In(courseIds), status: CourseStatus.APPROVED },
      relations: ['category'],
    });
    // 转换封面 URL
    await Promise.all(coursesList.map((item) => this.transformCoverToUrl(item)));
    return coursesList;
  }

  /**
   * 获取教师仪表盘统计
   * 功能描述：汇总指定教师的课程数、制作人数、待审核课程数等统计信息
   * @param teacherId 教师用户ID
   * @returns 仪表盘统计数据
   */
  async getTeacherStats(teacherId: number): Promise<{
    totalCourses: number;
    totalStudents: number;
    pendingReviewCount: number;
    totalEarnings: number;
  }> {
    // 课程总数
    const totalCourses = await this.courseRepository.count({
      where: { teacherId },
    });

    // 待审核课程数
    const pendingReviewCount = await this.courseRepository.count({
      where: { teacherId, status: CourseStatus.PENDING },
    });

    // 制作人总数（购买该教师课程的去重用户数）
    const teacherCourses = await this.courseRepository.find({
      where: { teacherId },
      select: ['id'],
    });
    const courseIds = teacherCourses.map((c) => c.id);

    let totalStudents = 0;
    if (courseIds.length > 0) {
      const studentResult = await this.userCourseRepository
        .createQueryBuilder('uc')
        .select('COUNT(DISTINCT uc.userId)', 'count')
        .where('uc.courseId IN (:...courseIds)', { courseIds })
        .getRawOne();
      totalStudents = Number(studentResult?.count || 0);
    }

    // 收益总额（从 earnings 表汇总）
    let totalEarnings = 0;
    try {
      const earningResult = await this.dataSource.query(
        'SELECT COALESCE(SUM(actual_amount), 0) as total FROM earnings WHERE teacher_id = ? AND type = ?',
        [teacherId, 'course_sale'],
      );
      totalEarnings = Number(earningResult[0]?.total || 0);
    } catch {
      this.logger.warn('获取教师收益统计失败，可能 earnings 表尚未创建');
    }

    return {
      totalCourses,
      totalStudents,
      pendingReviewCount,
      totalEarnings,
    };
  }

  /**
   * 获取已购课制作人列表（教师端）
   * 功能描述：分页查询购买了指定教师课程的所有制作人信息
   * @param teacherId 教师用户ID
   * @param page 页码
   * @param pageSize 每页条数
   * @returns 制作人列表和分页信息
   */
  async getTeacherProducers(
    teacherId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    items: any[];
    meta: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    // 先查询教师的所有课程ID
    const teacherCourses = await this.courseRepository.find({
      where: { teacherId },
      select: ['id', 'title'],
    });
    const courseIds = teacherCourses.map((c) => c.id);

    if (courseIds.length === 0) {
      return {
        items: [],
        meta: { total: 0, page, pageSize, totalPages: 0 },
      };
    }

    // 分页查询购买记录，关联用户信息和课程信息
    const queryBuilder = this.userCourseRepository
      .createQueryBuilder('uc')
      .leftJoin(User, 'u', 'uc.userId = u.id')
      .leftJoin(Course, 'c', 'uc.courseId = c.id')
      .where('uc.courseId IN (:...courseIds)', { courseIds })
      .select([
        'uc.id',
        'uc.userId',
        'uc.courseId',
        'uc.createdAt AS purchasedAt',
        'uc.price',
        'u.nickname',
        'u.avatar',
        'c.title AS courseTitle',
      ])
      .orderBy('uc.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawMany();

    // 格式化返回数据
    const formattedItems = items.map((item: any) => ({
      userId: item.uc_userId,
      nickname: item.u_nickname,
      avatar: item.u_avatar,
      courseId: item.uc_courseId,
      courseTitle: item.c_title,
      price: item.uc_price,
      purchasedAt: item.uc_createdAt,
    }));

    return {
      items: formattedItems,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }


  /**
   * 清除课程目录缓存
   * 功能描述：当课程状态或信息发生变更时，清除所有课程目录的 Redis 缓存，
   *          确保用户下次访问时获取最新数据。
   *          使用通配符模式 "course:catalog:*" 匹配所有分页/筛选组合的缓存。
   */
  private async clearCatalogCache(): Promise<void> {
    const deleted = await this.redisService.delByPattern(`${this.CACHE_PREFIX.CATALOG}:*`);
    if (deleted > 0) {
      this.logger.log(`课程目录缓存已清除，共 ${deleted} 条`);
    }
  }

  /**
   * 清除单个课程详情缓存
   * @param courseId 课程ID
   */
  private async clearDetailCache(courseId: number): Promise<void> {
    const key = `${this.CACHE_PREFIX.DETAIL}:${courseId}`;
    await this.redisService.del(key);
  }

  /**
   * 校验课程状态流转是否合法
   * @param currentStatus 当前状态
   * @param targetStatus 目标状态
   * @param role 操作用户角色
   */
  private validateStatusTransition(
    currentStatus: CourseStatus,
    targetStatus: CourseStatus,
    role: Role,
  ): void {
    const validTransitions: Record<string, Record<string, Role[]>> = {
      [CourseStatus.DRAFT]: {
        [CourseStatus.PENDING]: [Role.TEACHER], // 草稿 → 提交审核
      },
      [CourseStatus.PENDING]: {
        [CourseStatus.APPROVED]: [Role.SUPER_ADMIN, Role.REVIEWER], // 待审核 → 通过
        [CourseStatus.REJECTED]: [Role.SUPER_ADMIN, Role.REVIEWER], // 待审核 → 驳回
      },
      [CourseStatus.APPROVED]: {
        [CourseStatus.OFF_SHELF]: [Role.SUPER_ADMIN, Role.REVIEWER], // 已上架 → 下架
        [CourseStatus.PENDING]: [Role.TEACHER], // 已上架编辑后 → 重新提交审核（pendingEdit 场景）
      },
      [CourseStatus.REJECTED]: {
        [CourseStatus.DRAFT]: [Role.TEACHER], // 已驳回 → 返回草稿修改
        [CourseStatus.PENDING]: [Role.TEACHER], // 已驳回 → 修改后重新提交审核
      },
      [CourseStatus.OFF_SHELF]: {
        [CourseStatus.DRAFT]: [Role.TEACHER], // 已下架 → 返回草稿修改
        [CourseStatus.PENDING]: [Role.TEACHER], // 已下架 → 重新提交上架审核
      },
    };

    const allowedRoles = validTransitions[currentStatus]?.[targetStatus];
    if (!allowedRoles) {
      throw BusinessException.badRequest(
        `不允许从 ${currentStatus} 状态变更为 ${targetStatus} 状态`,
      );
    }

    if (!allowedRoles.includes(role)) {
      throw BusinessException.forbidden('当前角色无权执行此状态变更');
    }
  }
}
