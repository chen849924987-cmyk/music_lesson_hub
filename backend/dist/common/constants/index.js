"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.ResponseCode = exports.EarningStatus = exports.WithdrawalStatus = exports.AttachmentStatus = exports.AttachmentType = exports.CouponType = exports.PaymentStatus = exports.PaymentMethod = exports.OrderType = exports.OrderStatus = exports.ReviewType = exports.ReviewAction = exports.CourseStatus = exports.CourseType = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["REVIEWER"] = "reviewer";
    Role["OPERATOR"] = "operator";
    Role["TEACHER"] = "teacher";
    Role["STUDENT"] = "student";
})(Role || (exports.Role = Role = {}));
var CourseType;
(function (CourseType) {
    CourseType["SINGLE"] = "single";
    CourseType["SERIES"] = "series";
})(CourseType || (exports.CourseType = CourseType = {}));
var CourseStatus;
(function (CourseStatus) {
    CourseStatus["DRAFT"] = "draft";
    CourseStatus["PENDING"] = "pending";
    CourseStatus["APPROVED"] = "approved";
    CourseStatus["REJECTED"] = "rejected";
    CourseStatus["OFF_SHELF"] = "off_shelf";
})(CourseStatus || (exports.CourseStatus = CourseStatus = {}));
var ReviewAction;
(function (ReviewAction) {
    ReviewAction["APPROVE"] = "approve";
    ReviewAction["REJECT"] = "reject";
})(ReviewAction || (exports.ReviewAction = ReviewAction = {}));
var ReviewType;
(function (ReviewType) {
    ReviewType["COURSE"] = "course";
    ReviewType["ATTACHMENT"] = "attachment";
})(ReviewType || (exports.ReviewType = ReviewType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PAID"] = "paid";
    OrderStatus["REFUNDED"] = "refunded";
    OrderStatus["REFUNDING"] = "refunding";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["SINGLE_COURSE"] = "single_course";
    OrderType["SERIES_COURSE"] = "series_course";
    OrderType["BUNDLE"] = "bundle";
    OrderType["SINGLE_LESSON"] = "single_lesson";
})(OrderType || (exports.OrderType = OrderType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["ALIPAY"] = "alipay";
    PaymentMethod["WECHAT"] = "wechat";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var CouponType;
(function (CouponType) {
    CouponType["FIXED"] = "fixed";
    CouponType["PERCENTAGE"] = "percentage";
})(CouponType || (exports.CouponType = CouponType = {}));
var AttachmentType;
(function (AttachmentType) {
    AttachmentType["COURSEWARE"] = "courseware";
    AttachmentType["SCORE"] = "score";
    AttachmentType["OTHER"] = "other";
})(AttachmentType || (exports.AttachmentType = AttachmentType = {}));
var AttachmentStatus;
(function (AttachmentStatus) {
    AttachmentStatus["PENDING"] = "pending";
    AttachmentStatus["APPROVED"] = "approved";
    AttachmentStatus["REJECTED"] = "rejected";
})(AttachmentStatus || (exports.AttachmentStatus = AttachmentStatus = {}));
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "pending";
    WithdrawalStatus["COMPLETED"] = "completed";
    WithdrawalStatus["REJECTED"] = "rejected";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
var EarningStatus;
(function (EarningStatus) {
    EarningStatus["PENDING"] = "pending";
    EarningStatus["SETTLED"] = "settled";
})(EarningStatus || (exports.EarningStatus = EarningStatus = {}));
var ResponseCode;
(function (ResponseCode) {
    ResponseCode[ResponseCode["SUCCESS"] = 200] = "SUCCESS";
    ResponseCode[ResponseCode["CREATED"] = 201] = "CREATED";
    ResponseCode[ResponseCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    ResponseCode[ResponseCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    ResponseCode[ResponseCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    ResponseCode[ResponseCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    ResponseCode[ResponseCode["CONFLICT"] = 409] = "CONFLICT";
    ResponseCode[ResponseCode["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
    ResponseCode[ResponseCode["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    ResponseCode[ResponseCode["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(ResponseCode || (exports.ResponseCode = ResponseCode = {}));
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};
//# sourceMappingURL=index.js.map