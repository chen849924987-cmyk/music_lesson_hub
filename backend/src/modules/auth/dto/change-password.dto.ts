/**
 * 修改密码请求 DTO
 *
 * 功能描述：用户修改密码时传入的参数校验
 */
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  /** 旧密码，用于验证身份 */
  @IsString({ message: '旧密码必须是字符串' })
  oldPassword: string;

  /** 新密码，长度 6-50 个字符 */
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(6, { message: '新密码最少6个字符' })
  @MaxLength(50, { message: '新密码最多50个字符' })
  newPassword: string;
}
