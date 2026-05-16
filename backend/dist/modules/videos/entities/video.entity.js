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
exports.Video = void 0;
const typeorm_1 = require("typeorm");
let Video = class Video {
    id;
    userId;
    originalName;
    objectName;
    fileSize;
    mimeType;
    duration;
    width;
    height;
    coverObjectName;
    transcodeStatus;
    transcodeOutputs;
    isDeleted;
    createdAt;
    updatedAt;
};
exports.Video = Video;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Video.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Video.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Video.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Video.prototype, "objectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], Video.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'video/mp4' }),
    __metadata("design:type", String)
], Video.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Video.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Video.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Video.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, default: '' }),
    __metadata("design:type", String)
], Video.prototype, "coverObjectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'pending' }),
    __metadata("design:type", String)
], Video.prototype, "transcodeStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Video.prototype, "transcodeOutputs", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Video.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Video.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Video.prototype, "updatedAt", void 0);
exports.Video = Video = __decorate([
    (0, typeorm_1.Entity)('videos')
], Video);
//# sourceMappingURL=video.entity.js.map