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
exports.Withdrawal = void 0;
const typeorm_1 = require("typeorm");
let Withdrawal = class Withdrawal {
    id;
    teacherId;
    amount;
    accountType;
    account;
    status;
    reviewComment;
    reviewerId;
    reviewedAt;
    createdAt;
    updatedAt;
};
exports.Withdrawal = Withdrawal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Withdrawal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_id', type: 'int' }),
    __metadata("design:type", Number)
], Withdrawal.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', comment: '提现金额（单位：分）' }),
    __metadata("design:type", Number)
], Withdrawal.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_type', type: 'varchar', length: 20, default: 'alipay', comment: '收款账户类型' }),
    __metadata("design:type", String)
], Withdrawal.prototype, "accountType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, comment: '收款账号' }),
    __metadata("design:type", String)
], Withdrawal.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: 'pending',
        comment: '提现状态：pending-待处理 completed-已打款 rejected-已驳回',
    }),
    __metadata("design:type", String)
], Withdrawal.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'review_comment', type: 'varchar', length: 500, nullable: true, comment: '审核备注' }),
    __metadata("design:type", String)
], Withdrawal.prototype, "reviewComment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewer_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Withdrawal.prototype, "reviewerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Withdrawal.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Withdrawal.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Withdrawal.prototype, "updatedAt", void 0);
exports.Withdrawal = Withdrawal = __decorate([
    (0, typeorm_1.Entity)('withdrawals'),
    (0, typeorm_1.Index)('idx_withdrawal_teacher', ['teacherId'])
], Withdrawal);
//# sourceMappingURL=withdrawal.entity.js.map