import { IsString, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';

/**
 * 注册请求 DTO
 * 功能描述：学员注册时传入的参数校验
 */
export class RegisterDto {
  /** 用户名，长度 4-50 个字符 */
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(4, { message: '用户名最少4个字符' })
  @MaxLength(50, { message: '用户名最多50个字符' })
  username: string;

  /** 密码，长度 6-50 个字符 */
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码最少6个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  password: string;

  /** 昵称（选填） */
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname?: string;

  /** 手机号（选填） */
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  phone?: string;

  /** 邮箱（选填） */
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}

/**
 * 登录请求 DTO
 * 功能描述：登录时传入的参数校验
 */
export class LoginDto {
  /** 用户名 */
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  /** 密码 */
  @IsString({ message: '密码必须是字符串' })
  password: string;
}

/**
 * 创建管理员/教师账号 DTO（后台录入）
 * 功能描述：管理员在后台创建账号时所需参数
 */
export class CreateAccountDto {
  /** 用户名 */
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(4, { message: '用户名最少4个字符' })
  @MaxLength(50, { message: '用户名最多50个字符' })
  username: string;

  /** 密码 */
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码最少6个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  password: string;

  /** 用户昵称 */
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname?: string;

  /** 手机号 */
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  phone?: string;

  /** 邮箱 */
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}
