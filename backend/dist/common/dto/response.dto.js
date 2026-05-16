"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessException = exports.ApiResponse = void 0;
class ApiResponse {
    code;
    message;
    data;
    timestamp;
    constructor(code, message, data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = Date.now();
    }
    static success(data, message = '操作成功') {
        return new ApiResponse(200, message, data);
    }
    static successWithPagination(items, meta, message = '查询成功') {
        return new ApiResponse(200, message, { items, meta });
    }
    static created(data, message = '创建成功') {
        return new ApiResponse(201, message, data);
    }
    static error(code, message) {
        return new ApiResponse(code, message, null);
    }
}
exports.ApiResponse = ApiResponse;
class BusinessException extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'BusinessException';
    }
    static badRequest(message) {
        return new BusinessException(400, message);
    }
    static unauthorized(message = '请先登录') {
        return new BusinessException(401, message);
    }
    static forbidden(message = '权限不足') {
        return new BusinessException(403, message);
    }
    static notFound(message = '资源不存在') {
        return new BusinessException(404, message);
    }
    static conflict(message) {
        return new BusinessException(409, message);
    }
    static internalError(message = '服务器内部错误') {
        return new BusinessException(500, message);
    }
}
exports.BusinessException = BusinessException;
//# sourceMappingURL=response.dto.js.map