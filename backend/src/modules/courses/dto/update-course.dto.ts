import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

/**
 * 更新课程 DTO
 * 功能描述：更新课程信息时所需的请求参数，所有字段可选
 */
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
