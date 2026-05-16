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
exports.Course = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const chapter_entity_1 = require("./chapter.entity");
const constants_1 = require("../../../common/constants");
let Course = class Course {
    id;
    title;
    cover;
    description;
    categoryId;
    category;
    teacherId;
    courseType;
    price;
    originalPrice;
    status;
    previewDuration;
    trailerVideoId;
    reviewComment;
    reviewerId;
    reviewedAt;
    pendingEdit;
    pendingOffShelf;
    tags;
    studentCount;
    rating;
    reviewCount;
    isRecommended;
    sortOrder;
    previousData;
    chapters;
    createdAt;
    updatedAt;
};
exports.Course = Course;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Course.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Course.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, default: '' }),
    __metadata("design:type", String)
], Course.prototype, "cover", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Course.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Course.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", category_entity_1.Category)
], Course.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Course.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: constants_1.CourseType, default: constants_1.CourseType.SINGLE }),
    __metadata("design:type", String)
], Course.prototype, "courseType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "originalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: constants_1.CourseStatus, default: constants_1.CourseStatus.DRAFT }),
    __metadata("design:type", String)
], Course.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "previewDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Course.prototype, "trailerVideoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Course.prototype, "reviewComment", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Course.prototype, "reviewerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Course.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Course.prototype, "pendingEdit", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Course.prototype, "pendingOffShelf", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, default: '' }),
    __metadata("design:type", String)
], Course.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "studentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "reviewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Course.prototype, "isRecommended", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Course.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'previousData', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Course.prototype, "previousData", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chapter_entity_1.Chapter, (chapter) => chapter.course),
    __metadata("design:type", Array)
], Course.prototype, "chapters", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Course.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Course.prototype, "updatedAt", void 0);
exports.Course = Course = __decorate([
    (0, typeorm_1.Entity)('courses')
], Course);
//# sourceMappingURL=course.entity.js.map