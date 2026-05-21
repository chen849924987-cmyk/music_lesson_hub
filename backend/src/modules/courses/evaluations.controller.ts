import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ReplyEvaluationDto } from './dto/reply-evaluation.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';

/**
 * 评价控制器
 * 功能描述：处理课程评价的 HTTP 请求，包括发表评价、教师回复、查询评价列表等。
 *
 * 路由前缀：/api/v1/courses/:courseId/evaluations
 */
@Controller('courses/:courseId/evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  /**
   * 发表课程评价
   * 功能描述：已购制作人对课程发表评价，需登录（角色为制作人）。
   * 每个用户对每门课程只能发表一条评价。
   *
   * @param courseId 课程ID
   * @param userId 当前登录用户ID（从 JWT 获取）
   * @param createEvaluationDto 评价参数（评分、文字内容）
   * @returns 创建的评价信息
   *
   * @UseGuards AuthGuard('jwt') + RolesGuard
   * @Roles STUDENT（制作人）
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser('sub') userId: number,
    @Body() createEvaluationDto: CreateEvaluationDto,
  ) {
    const evaluation = await this.evaluationsService.create(
      courseId,
      userId,
      createEvaluationDto,
    );
    return ApiResponse.created(evaluation, '评价发表成功');
  }

  /**
   * 获取课程评价列表（公开）
   * 功能描述：分页获取指定课程的所有可见评价，无需登录即可访问。
   *
   * @param courseId 课程ID
   * @param page 页码
   * @param pageSize 每页条数
   * @returns 评价列表和分页信息
   */
  @Get()
  @UseGuards(OptionalJwtGuard)
  async findByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    const result = await this.evaluationsService.findByCourse(
      courseId,
      page || 1,
      pageSize || 20,
    );
    return ApiResponse.successWithPagination(result.items, result.meta);
  }

  /**
   * 检查当前用户是否已评价该课程
   * 功能描述：查询当前登录用户是否已对指定课程发表过评价。
   *          用于前端控制"发表评价"按钮的显示。
   *
   * @param courseId 课程ID
   * @param userId 当前登录用户ID
   * @returns { evaluated: boolean, evaluation?: Evaluation }
   */
  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  async checkEvaluated(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser('sub') userId: number,
  ) {
    const result = await this.evaluationsService.checkUserEvaluated(
      courseId,
      userId,
    );
    return ApiResponse.success(result);
  }

  /**
   * 教师回复评价
   * 功能描述：课程教师回复制作人的评价，需教师身份登录。
   *
   * @param courseId 课程ID
   * @param evaluationId 评价ID
   * @param userId 当前登录教师ID
   * @param replyDto 回复内容
   * @returns 更新后的评价信息
   *
   * @UseGuards AuthGuard('jwt') + RolesGuard
   * @Roles TEACHER
   */
  @Post(':evaluationId/reply')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER)
  async reply(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @CurrentUser('sub') userId: number,
    @Body() replyDto: ReplyEvaluationDto,
  ) {
    const evaluation = await this.evaluationsService.reply(
      evaluationId,
      userId,
      replyDto,
    );
    return ApiResponse.success(evaluation, '回复成功');
  }
}
