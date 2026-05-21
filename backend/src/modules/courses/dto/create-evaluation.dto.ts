import { IsInt, Min, Max, IsString, IsOptional, Length, IsNotEmpty } from 'class-validator';

/**
 * 创建评价 DTO
 * 功能描述：制作人发表课程评价时的请求参数校验
 */
export class CreateEvaluationDto {
  /**
   * 评分：1~5 星，整数
   * @param rating 1~5 的整数，必填
   */
  @IsInt({ message: '评分必须为整数' })
  @Min(1, { message: '评分最低为 1 星' })
  @Max(5, { message: '评分最高为 5 星' })
  rating: number;

  /**
   * 评价内容（文字）
   * @param content 评价文字，选填，最长 2000 字符
   */
  @IsOptional()
  @IsString({ message: '评价内容必须为字符串' })
  @Length(1, 2000, { message: '评价内容长度必须在 1~2000 字符之间' })
  content?: string;
}
