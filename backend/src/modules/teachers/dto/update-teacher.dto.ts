import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

/**
 * 更新教师信息 DTO
 * 功能描述：教师补充/修改个人资料时传入的参数校验
 */
export class UpdateTeacherDto {
  /** 教师真实姓名 */
  @IsOptional()
  @IsString({ message: '姓名必须是字符串' })
  @MaxLength(50, { message: '姓名最多50个字符' })
  realName?: string;

  /** 个人简介 */
  @IsOptional()
  @IsString({ message: '简介必须是字符串' })
  introduction?: string;

  /** 擅长领域/标签 */
  @IsOptional()
  @IsString({ message: '擅长领域必须是字符串' })
  @MaxLength(500, { message: '擅长领域最多500个字符' })
  specialties?: string;

  /** 教师头像 */
  @IsOptional()
  @IsString({ message: '头像URL必须是字符串' })
  avatar?: string;

  /** 联系方式 */
  @IsOptional()
  @IsString({ message: '联系方式必须是字符串' })
  @MaxLength(200, { message: '联系方式最多200个字符' })
  contactInfo?: string;

  /** 支付宝账号（手机号） */
  @IsOptional()
  @IsString({ message: '支付宝账号必须是字符串' })
  @MaxLength(200, { message: '支付宝账号最多200个字符' })
  paymentAccount?: string;

  /** 银行账号 */
  @IsOptional()
  @IsString({ message: '银行账号必须是字符串' })
  @MaxLength(200, { message: '银行账号最多200个字符' })
  bankAccount?: string;

  /** 所属支行 */
  @IsOptional()
  @IsString({ message: '所属支行必须是字符串' })
  @MaxLength(200, { message: '所属支行最多200个字符' })
  bankBranch?: string;

  /** 通知偏好（开启/关闭通知） */
  @IsOptional()
  @IsBoolean({ message: '通知偏好必须是布尔值' })
  notificationEnabled?: boolean;
}
