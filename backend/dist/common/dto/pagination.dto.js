"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationMeta = exports.PaginationWithSortDto = exports.PaginationDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PaginationDto {
    page = 1;
    pageSize = 20;
}
exports.PaginationDto = PaginationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: '页码必须是整数' }),
    (0, class_validator_1.Min)(1, { message: '页码最小为1' }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: '每页条数必须是整数' }),
    (0, class_validator_1.Min)(1, { message: '每页条数最小为1' }),
    (0, class_validator_1.Max)(100, { message: '每页条数最大为100' }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "pageSize", void 0);
class PaginationWithSortDto extends PaginationDto {
    sortBy = 'createdAt';
    sortOrder = 'DESC';
}
exports.PaginationWithSortDto = PaginationWithSortDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PaginationWithSortDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PaginationWithSortDto.prototype, "sortOrder", void 0);
class PaginationMeta {
    total;
    page;
    pageSize;
    totalPages;
    constructor(total, page, pageSize) {
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = Math.ceil(total / pageSize);
    }
}
exports.PaginationMeta = PaginationMeta;
//# sourceMappingURL=pagination.dto.js.map