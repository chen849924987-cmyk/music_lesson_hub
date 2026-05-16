import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * 更新分类 DTO
 * 功能描述：更新课程分类时所需的请求参数，所有字段可选
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
