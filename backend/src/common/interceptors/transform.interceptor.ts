import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/response.dto';

/**
 * 响应转换拦截器
 * 功能描述：拦截所有 Controller 的正常返回，自动包装为统一的 ApiResponse 格式
 * 注意：此拦截器不处理流式响应或已经使用了 @Res() 的请求
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果返回已经是 ApiResponse 格式，则直接返回
        if (data instanceof ApiResponse) {
          return data;
        }
        // 否则包装为成功响应
        return ApiResponse.success(data);
      }),
    );
  }
}
