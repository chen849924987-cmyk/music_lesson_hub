import { PaginationMeta } from './pagination.dto';
export declare class ApiResponse<T = any> {
    code: number;
    message: string;
    data?: T;
    timestamp: number;
    constructor(code: number, message: string, data?: T);
    static success<T>(data?: T, message?: string): ApiResponse<T>;
    static successWithPagination<T>(items: T[], meta: PaginationMeta, message?: string): ApiResponse<{
        items: T[];
        meta: PaginationMeta;
    }>;
    static created<T>(data?: T, message?: string): ApiResponse<T>;
    static error(code: number, message: string): ApiResponse<null>;
}
export declare class BusinessException extends Error {
    code: number;
    constructor(code: number, message: string);
    static badRequest(message: string): BusinessException;
    static unauthorized(message?: string): BusinessException;
    static forbidden(message?: string): BusinessException;
    static notFound(message?: string): BusinessException;
    static conflict(message: string): BusinessException;
    static internalError(message?: string): BusinessException;
}
