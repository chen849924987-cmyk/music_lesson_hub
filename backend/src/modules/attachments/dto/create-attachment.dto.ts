import { IsString, IsOptional, IsNumber, IsNotEmpty, Min, IsEnum } from 'class-validator';
import { AttachmentType } from '../../../common/constants';

/**
 * 创建附件记录 DTO
 * 功能描述：附件上传成功后，前端将文件信息提交到后端创建附件记录
 */
export class CreateAttachmentDto {
  /** 关联的课程ID */
  @IsNumber({}, { message: '课程ID必须为数字' })
  @IsNotEmpty({ message: '课程ID不能为空' })
  courseId: number;

  /** 关联的课时ID（可选，系列课程的课件应挂到具体课时下） */
  @IsNumber({}, { message: '课时ID必须为数字' })
  @IsOptional()
  lessonId?: number;

  /** 附件原始文件名 */
  @IsString({ message: '原始文件名必须为字符串' })
  @IsNotEmpty({ message: '原始文件名不能为空' })
  originalName: string;

  /** 附件在 MinIO 中的存储路径 */
  @IsString({ message: '对象名称必须为字符串' })
  @IsNotEmpty({ message: '对象名称不能为空' })
  objectName: string;

  /** 附件文件大小（字节） */
  @IsNumber({}, { message: '文件大小必须为数字' })
  @Min(0, { message: '文件大小不能为负数' })
  fileSize: number;

  /** 附件 MIME 类型 */
  @IsString({ message: 'MIME 类型必须为字符串' })
  @IsOptional()
  mimeType?: string;

  /** 附件类型 */
  @IsEnum(AttachmentType, { message: '附件类型无效' })
  @IsOptional()
  attachmentType?: AttachmentType;
}
