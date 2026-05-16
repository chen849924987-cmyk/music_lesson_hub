import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse, BusinessException } from '../dto/response.dto';

/**
 * 全局异常过滤器
 * 功能描述：捕获所有未处理的异常，转换为统一的 API 响应格式返回给客户端
 * 处理逻辑：
 * 1. BusinessException → 业务异常，直接返回自定义 code 和 message
 * 2. HttpException → HTTP 异常，提取 status 和 message
 * 3. 未知异常 → 500 服务器内部错误，记录日志
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;

    if (exception instanceof BusinessException) {
      // 业务异常：使用自定义的 code 和 message
      statusCode = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      // HTTP 异常：提取状态码和错误信息
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        // 处理 class-validator 的校验错误消息
        const responseObj = exceptionResponse as Record<string, any>;
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message[0] || '请求参数错误';
        } else {
          message = responseObj.message || exception.message;
        }
      } else {
        message = exception.message;
      }
    } else {
      // 未知异常：记录错误日志并返回 500
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      this.logger.error(
        `未处理的异常: ${(exception as Error).message}`,
        (exception as Error).stack,
        `${request.method} ${request.url}`,
      );
    }

    // 构建统一的错误响应
    const errorResponse = ApiResponse.error(statusCode, message);

    response.status(statusCode).json(errorResponse);
  }
}
