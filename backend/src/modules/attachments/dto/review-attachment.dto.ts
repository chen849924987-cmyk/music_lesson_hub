import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { AttachmentStatus } from '../../../common/constants';

/**
 * 审核附件 DTO
 * 功能描述：用于附件审核接口的请求参数校验，确保 status 只能为 approved 或 rejected
 */
export class ReviewAttachmentDto {
  /** 审核状态（只能为 approved 或 rejected） */
  @IsEnum(AttachmentStatus, { message: '审核状态无效，只能为 approved 或 rejected' })
  status: AttachmentStatus.APPROVED | AttachmentStatus.REJECTED;

  /** 审核意见（驳回时必填） */
  @IsOptional()
  @IsString({ message: '审核意见必须为字符串' })
  reviewComment?: string;
}
