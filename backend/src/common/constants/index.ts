/**
 * 公共常量定义
 * 功能描述：集中管理系统中使用的所有常量，包括角色枚举、课程状态、审核状态等
 */

/** 用户角色枚举 */
export enum Role {
  /** 超级管理员 */
  SUPER_ADMIN = 'super_admin',
  /** 内容审核员 */
  REVIEWER = 'reviewer',
  /** 运营管理员 */
  OPERATOR = 'operator',
  /** 教师 */
  TEACHER = 'teacher',
  /** 学员 */
  STUDENT = 'student',
}

/** 课程类型枚举 */
export enum CourseType {
  /** 单课程 */
  SINGLE = 'single',
  /** 系列课程 */
  SERIES = 'series',
}

/** 课程状态枚举 */
export enum CourseStatus {
  /** 草稿 - 教师创建后未提交审核 */
  DRAFT = 'draft',
  /** 待审核 - 已提交审核 */
  PENDING = 'pending',
  /** 审核通过 - 已上架 */
  APPROVED = 'approved',
  /** 审核驳回 */
  REJECTED = 'rejected',
  /** 已下架 */
  OFF_SHELF = 'off_shelf',
}

/** 审核操作枚举 */
export enum ReviewAction {
  /** 通过 */
  APPROVE = 'approve',
  /** 驳回 */
  REJECT = 'reject',
}

/** 审核类型枚举 */
export enum ReviewType {
  /** 课程审核 */
  COURSE = 'course',
  /** 课程资料审核 */
  ATTACHMENT = 'attachment',
}

/** 订单状态枚举 */
export enum OrderStatus {
  /** 待支付 */
  PENDING = 'pending',
  /** 已支付 */
  PAID = 'paid',
  /** 已退款 */
  REFUNDED = 'refunded',
  /** 退款中 */
  REFUNDING = 'refunding',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/** 订单类型枚举 */
export enum OrderType {
  /** 单课程购买 */
  SINGLE_COURSE = 'single_course',
  /** 系列课程购买 */
  SERIES_COURSE = 'series_course',
  /** 捆绑包购买 */
  BUNDLE = 'bundle',
  /** 单独课时购买（系列课内的单课） */
  SINGLE_LESSON = 'single_lesson',
}

/** 支付方式枚举 */
export enum PaymentMethod {
  /** 支付宝 */
  ALIPAY = 'alipay',
  /** 微信支付（预留） */
  WECHAT = 'wechat',
}

/** 支付状态枚举 */
export enum PaymentStatus {
  /** 待支付 */
  PENDING = 'pending',
  /** 支付成功 */
  SUCCESS = 'success',
  /** 支付失败 */
  FAILED = 'failed',
  /** 已退款 */
  REFUNDED = 'refunded',
}

/** 优惠券类型枚举 */
export enum CouponType {
  /** 满减券 */
  FIXED = 'fixed',
  /** 折扣券 */
  PERCENTAGE = 'percentage',
}

/** 附件类型枚举 */
export enum AttachmentType {
  /** 课件 */
  COURSEWARE = 'courseware',
  /** 乐谱 */
  SCORE = 'score',
  /** 其他 */
  OTHER = 'other',
}

/** 附件审核状态枚举 */
export enum AttachmentStatus {
  /** 待审核 */
  PENDING = 'pending',
  /** 已通过 */
  APPROVED = 'approved',
  /** 已驳回 */
  REJECTED = 'rejected',
}

/** 提现状态枚举 */
export enum WithdrawalStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 已打款 */
  COMPLETED = 'completed',
  /** 已驳回 */
  REJECTED = 'rejected',
}

/** 收益状态枚举 */
export enum EarningStatus {
  /** 待结算 */
  PENDING = 'pending',
  /** 已结算 */
  SETTLED = 'settled',
}

/** API 统一响应状态码 */
export enum ResponseCode {
  /** 成功 */
  SUCCESS = 200,
  /** 创建成功 */
  CREATED = 201,
  /** 请求参数错误 */
  BAD_REQUEST = 400,
  /** 未授权 */
  UNAUTHORIZED = 401,
  /** 禁止访问 */
  FORBIDDEN = 403,
  /** 资源不存在 */
  NOT_FOUND = 404,
  /** 请求冲突 */
  CONFLICT = 409,
  /** 请求过于频繁 */
  TOO_MANY_REQUESTS = 429,
  /** 服务器内部错误 */
  INTERNAL_SERVER_ERROR = 500,
  /** 服务不可用 */
  SERVICE_UNAVAILABLE = 503,
}

/** 分页默认值 */
export const PAGINATION = {
  /** 默认页码 */
  DEFAULT_PAGE: 1,
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 20,
  /** 最大每页条数 */
  MAX_PAGE_SIZE: 100,
} as const;
