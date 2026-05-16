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
exports.LearningProgress = void 0;
const typeorm_1 = require("typeorm");
let LearningProgress = class LearningProgress {
    id;
    userId;
    courseId;
    lessonId;
    progress;
    lastPosition;
    duration;
    completed;
    completedAt;
    playCount;
    createdAt;
    updatedAt;
};
exports.LearningProgress = LearningProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LearningProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'userId', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], LearningProgress.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'courseId', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], LearningProgress.prototype, "courseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lessonId', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], LearningProgress.prototype, "lessonId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 1, default: 0 }),
    __metadata("design:type", Number)
], LearningProgress.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 1, default: 0 }),
    __metadata("design:type", Number)
], LearningProgress.prototype, "lastPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LearningProgress.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LearningProgress.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], LearningProgress.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LearningProgress.prototype, "playCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LearningProgress.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LearningProgress.prototype, "updatedAt", void 0);
exports.LearningProgress = LearningProgress = __decorate([
    (0, typeorm_1.Entity)('learning_progress'),
    (0, typeorm_1.Index)(['userId', 'lessonId'], { unique: true }),
    (0, typeorm_1.Index)(['userId', 'courseId'])
], LearningProgress);
//# sourceMappingURL=learning-progress.entity.js.map