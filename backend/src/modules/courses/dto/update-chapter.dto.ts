import { PartialType } from '@nestjs/swagger';
import { CreateChapterDto } from './create-chapter.dto';

/**
 * 更新章节 DTO
 * 功能描述：更新章节信息时所需的请求参数，所有字段可选
 */
export class UpdateChapterDto extends PartialType(CreateChapterDto) {}
