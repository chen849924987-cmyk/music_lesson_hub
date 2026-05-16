import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * 全局参数校验管道
 * 功能描述：自动对所有 Controller 的 DTO 参数进行校验
 * 使用 class-validator 装饰器定义校验规则，在校验失败时返回友好的错误提示
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    // 如果没有定义类型元数据（如参数是原生类型），则直接返回
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 将普通对象转换为类实例，以便 class-validator 可以应用装饰器规则
    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // 自动剔除未使用装饰器标注的属性
      forbidNonWhitelisted: false, // 允许未标注的属性存在，但会被剔除
      transform: true, // 自动类型转换
    });

    if (errors.length > 0) {
      // 提取第一个校验失败的错误消息
      const firstError = errors[0];
      const constraints = firstError.constraints;
      let message = '请求参数校验失败';

      if (constraints) {
        // 获取第一个约束条件的错误消息
        const firstConstraint = Object.values(constraints)[0];
        if (firstConstraint) {
          message = firstConstraint;
        }
      }

      throw new BadRequestException(message);
    }

    return object;
  }

  /**
   * 判断是否需要校验该类型
   * @param metatype 参数的类型元数据
   * @returns 是否需要校验
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
