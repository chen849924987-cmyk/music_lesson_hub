import { PaginationMeta } from './pagination.dto';

/**
 * 统一 API 响应格式
 * 功能描述：所有 API 响应的统一包装格式，确保前端可以统一处理响应
 */
export class ApiResponse<T = any> {
  /** 状态码，200 表示成功 */
  code: number;

  /** 提示信息 */
  message: string;

  /** 响应数据 */
  data?: T;

  /** 时间戳 */
  timestamp: number;

  constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = Date.now();
  }

  /**
   * 返回成功的响应
   * @param data 响应数据
   * @param message 成功提示信息
   */
  static success<T>(data?: T, message: string = '操作成功'): ApiResponse<T> {
    return new ApiResponse(200, message, data);
  }

  /**
   * 返回带分页的成功响应
   * @param items 数据列表
   * @param meta 分页元数据
   * @param message 成功提示信息
   */
  static successWithPagination<T>(
    items: T[],
    meta: PaginationMeta,
    message: string = '查询成功',
  ): ApiResponse<{ items: T[]; meta: PaginationMeta }> {
    return new ApiResponse(200, message, { items, meta });
  }

  /**
   * 返回创建成功的响应（201）
   * @param data 响应数据
   * @param message 创建成功提示信息
   */
  static created<T>(data?: T, message: string = '创建成功'): ApiResponse<T> {
    return new ApiResponse(201, message, data);
  }

  /**
   * 返回错误响应
   * @param code 错误状态码
   * @param message 错误提示信息
   */
  static error(code: number, message: string): ApiResponse<null> {
    return new ApiResponse(code, message, null);
  }
}

/**
 * 业务异常类
 * 功能描述：用于在 Service 层抛出可预知的业务异常，由全局异常过滤器捕获并转换为友好提示
 */
export class BusinessException extends Error {
  /** 状态码 */
  code: number;

  /**
   * @param code 状态码
   * @param message 错误提示信息
   */
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'BusinessException';
  }

  /** 400 请求参数错误 */
  static badRequest(message: string): BusinessException {
    return new BusinessException(400, message);
  }

  /** 401 未授权 */
  static unauthorized(message: string = '请先登录'): BusinessException {
    return new BusinessException(401, message);
  }

  /** 403 禁止访问 */
  static forbidden(message: string = '权限不足'): BusinessException {
    return new BusinessException(403, message);
  }

  /** 404 资源不存在 */
  static notFound(message: string = '资源不存在'): BusinessException {
    return new BusinessException(404, message);
  }

  /** 409 请求冲突 */
  static conflict(message: string): BusinessException {
    return new BusinessException(409, message);
  }

  /** 500 服务器内部错误 */
  static internalError(message: string = '服务器内部错误'): BusinessException {
    return new BusinessException(500, message);
  }
}
