import { IsString, IsOptional, IsNumber, IsNotEmpty, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentType } from '../../../common/constants';

/**
 * 上传附件 DTO（配合文件上传使用）
 * 功能描述：前端上传附件时，通过 multipart/form-data 提交的元数据
 * 注意：multipart/form-data 中的值均为字符串类型，
 *       因此需要使用 @Type(() => Number) 将 courseId 转为数字类型
 */
export class UploadAttachmentDto {
  /** 关联的课程ID */
  @Type(() => Number)
  @IsNumber({}, { message: '课程ID必须为数字' })
  @IsNotEmpty({ message: '课程ID不能为空' })
  courseId: number;

  /** 附件类型 */
  @IsEnum(AttachmentType, { message: '附件类型无效' })
  @IsOptional()
  attachmentType?: AttachmentType;

  /** 关联的课时ID（可选，系列课程的课件应挂到具体课时下） */
  @Type(() => Number)
  @IsNumber({}, { message: '课时ID必须为数字' })
  @IsOptional()
  lessonId?: number;
}
