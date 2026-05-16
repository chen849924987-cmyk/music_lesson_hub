import { PartialType } from '@nestjs/swagger';
import { CreateLessonDto } from './create-lesson.dto';

/**
 * 更新课时 DTO
 * 功能描述：更新课时信息时所需的请求参数，所有字段可选
 */
export class UpdateLessonDto extends PartialType(CreateLessonDto) {}
