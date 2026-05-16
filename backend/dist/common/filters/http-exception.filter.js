"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const response_dto_1 = require("../dto/response.dto");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let statusCode;
        let message;
        if (exception instanceof response_dto_1.BusinessException) {
            statusCode = exception.code;
            message = exception.message;
        }
        else if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse;
                if (Array.isArray(responseObj.message)) {
                    message = responseObj.message[0] || '请求参数错误';
                }
                else {
                    message = responseObj.message || exception.message;
                }
            }
            else {
                message = exception.message;
            }
        }
        else {
            statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = '服务器内部错误';
            this.logger.error(`未处理的异常: ${exception.message}`, exception.stack, `${request.method} ${request.url}`);
        }
        const errorResponse = response_dto_1.ApiResponse.error(statusCode, message);
        response.status(statusCode).json(errorResponse);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map