import { IsInt, Min, Max, IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

/**
 * 创建提现申请 DTO
 * 功能描述：教师发起提现申请时的请求参数校验。
 *          教师只需输入提现金额，收款账号从教师个人设置中自动读取。
 */
export class CreateWithdrawalDto {
  /**
   * 提现金额（单位：元）
   * @param amount 提现金额，必填，最低 1 元，最高 100000 元
   */
  @IsInt({ message: '提现金额必须为整数' })
  @Min(1, { message: '提现金额最低为 1 元' })
  @Max(100000, { message: '提现金额最高为 100,000 元' })
  amount: number;
}

/**
 * 审核提现 DTO
 * 功能描述：管理员审核提现申请时的请求参数校验
 */
export class ReviewWithdrawalDto {
  /**
   * 审核操作：approved-通过 rejected-驳回
   * @param action 审核动作，必填
   */
  @IsString({ message: '审核操作必须为字符串' })
  @IsNotEmpty({ message: '审核操作不能为空' })
  action: 'approved' | 'rejected';

  /**
   * 审核意见/驳回原因
   * @param remark 驳回时必填，通过时可选
   */
  @IsOptional()
  @IsString({ message: '审核意见必须为字符串' })
  @Length(1, 500, { message: '审核意见长度需在 1~500 字符之间' })
  remark?: string;
}
