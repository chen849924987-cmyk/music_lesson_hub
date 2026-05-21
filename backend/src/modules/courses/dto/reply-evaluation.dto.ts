import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * 教师回复评价 DTO
 * 功能描述：教师回复制作人的课程评价时的请求参数校验
 */
export class ReplyEvaluationDto {
  /**
   * 回复内容
   * @param replyContent 回复文字，必填，最长 2000 字符
   */
  @IsString({ message: '回复内容必须为字符串' })
  @IsNotEmpty({ message: '回复内容不能为空' })
  @Length(1, 2000, { message: '回复内容长度必须在 1~2000 字符之间' })
  replyContent: string;
}
