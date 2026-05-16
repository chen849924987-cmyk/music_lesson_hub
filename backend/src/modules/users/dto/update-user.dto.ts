import { IsString, IsOptional, MaxLength, IsEmail, Matches } from 'class-validator';

/**
 * 更新用户信息 DTO
 * 功能描述：用户修改个人资料时传入的参数校验
 */
export class UpdateUserDto {
  /** 用户昵称 */
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname?: string;

  /** 手机号（支持中国大陆11位手机号） */
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确，请输入11位中国大陆手机号' })
  phone?: string;

  /** 邮箱 */
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  /** 个人简介 */
  @IsOptional()
  @IsString({ message: '简介必须是字符串' })
  bio?: string;

  /** 头像URL */
  @IsOptional()
  @IsString({ message: '头像URL必须是字符串' })
  avatar?: string;
}
