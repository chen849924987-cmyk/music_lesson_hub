export declare enum Role {
    SUPER_ADMIN = "super_admin",
    REVIEWER = "reviewer",
    OPERATOR = "operator",
    TEACHER = "teacher",
    STUDENT = "student"
}
export declare enum CourseType {
    SINGLE = "single",
    SERIES = "series"
}
export declare enum CourseStatus {
    DRAFT = "draft",
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    OFF_SHELF = "off_shelf"
}
export declare enum ReviewAction {
    APPROVE = "approve",
    REJECT = "reject"
}
export declare enum ReviewType {
    COURSE = "course",
    ATTACHMENT = "attachment"
}
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    REFUNDED = "refunded",
    REFUNDING = "refunding",
    CANCELLED = "cancelled"
}
export declare enum OrderType {
    SINGLE_COURSE = "single_course",
    SERIES_COURSE = "series_course",
    BUNDLE = "bundle",
    SINGLE_LESSON = "single_lesson"
}
export declare enum PaymentMethod {
    ALIPAY = "alipay",
    WECHAT = "wechat"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum CouponType {
    FIXED = "fixed",
    PERCENTAGE = "percentage"
}
export declare enum AttachmentType {
    COURSEWARE = "courseware",
    SCORE = "score",
    OTHER = "other"
}
export declare enum AttachmentStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare enum WithdrawalStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    REJECTED = "rejected"
}
export declare enum EarningStatus {
    PENDING = "pending",
    SETTLED = "settled"
}
export declare enum ResponseCode {
    SUCCESS = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503
}
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly MAX_PAGE_SIZE: 100;
};
