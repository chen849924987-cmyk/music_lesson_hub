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
exports.Attachment = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../../../common/constants");
let Attachment = class Attachment {
    id;
    userId;
    courseId;
    lessonId;
    originalName;
    objectName;
    fileSize;
    mimeType;
    attachmentType;
    status;
    reviewComment;
    reviewerId;
    reviewedAt;
    isDeleted;
    createdAt;
    updatedAt;
};
exports.Attachment = Attachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Attachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Attachment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Attachment.prototype, "courseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Attachment.prototype, "lessonId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Attachment.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Attachment.prototype, "objectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], Attachment.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'application/octet-stream' }),
    __metadata("design:type", String)
], Attachment.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: constants_1.AttachmentType,
        default: constants_1.AttachmentType.COURSEWARE,
    }),
    __metadata("design:type", String)
], Attachment.prototype, "attachmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: constants_1.AttachmentStatus,
        default: constants_1.AttachmentStatus.PENDING,
    }),
    __metadata("design:type", String)
], Attachment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, default: '' }),
    __metadata("design:type", String)
], Attachment.prototype, "reviewComment", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Attachment.prototype, "reviewerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Attachment.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Attachment.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Attachment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Attachment.prototype, "updatedAt", void 0);
exports.Attachment = Attachment = __decorate([
    (0, typeorm_1.Entity)('attachments')
], Attachment);
//# sourceMappingURL=attachment.entity.js.map