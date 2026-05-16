import { IsString, IsOptional, IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * 创建视频记录 DTO
 * 功能描述：视频上传成功后，前端将文件信息提交到后端创建视频记录
 */
export class CreateVideoDto {
  /** 视频原始文件名 */
  @IsString({ message: '原始文件名必须为字符串' })
  @IsNotEmpty({ message: '原始文件名不能为空' })
  originalName: string;

  /** 视频在 MinIO 中的存储路径 */
  @IsString({ message: '对象名称必须为字符串' })
  @IsNotEmpty({ message: '对象名称不能为空' })
  objectName: string;

  /** 视频文件大小（字节） */
  @IsNumber({}, { message: '文件大小必须为数字' })
  @Min(0, { message: '文件大小不能为负数' })
  fileSize: number;

  /** 视频 MIME 类型 */
  @IsString({ message: 'MIME 类型必须为字符串' })
  @IsOptional()
  mimeType?: string;

  /** 视频时长（秒） */
  @IsNumber({}, { message: '时长必须为数字' })
  @Min(0, { message: '时长不能为负数' })
  @IsOptional()
  duration?: number;

  /** 视频宽度（像素） */
  @IsNumber({}, { message: '宽度必须为数字' })
  @IsOptional()
  width?: number;

  /** 视频高度（像素） */
  @IsNumber({}, { message: '高度必须为数字' })
  @IsOptional()
  height?: number;
}
