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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const coupon_entity_1 = require("./entities/coupon.entity");
const user_coupon_entity_1 = require("./entities/user-coupon.entity");
const constants_1 = require("../../common/constants");
let CouponsService = class CouponsService {
    couponRepository;
    userCouponRepository;
    dataSource;
    constructor(couponRepository, userCouponRepository, dataSource) {
        this.couponRepository = couponRepository;
        this.userCouponRepository = userCouponRepository;
        this.dataSource = dataSource;
    }
    async create(createCouponDto) {
        const { code, type, discount, totalCount, startTime, endTime } = createCouponDto;
        const existing = await this.couponRepository.findOne({ where: { code } });
        if (existing) {
            throw new common_1.ConflictException(`优惠券码"${code}"已存在`);
        }
        if (type === constants_1.CouponType.FIXED && discount < 1) {
            throw new common_1.BadRequestException('满减券的减免金额不能小于1分');
        }
        if (type === constants_1.CouponType.PERCENTAGE && (discount < 1 || discount > 99)) {
            throw new common_1.BadRequestException('折扣券的折扣百分比必须在1-99之间');
        }
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (startDate >= endDate) {
            throw new common_1.BadRequestException('有效期开始时间不能晚于或等于结束时间');
        }
        if (type === constants_1.CouponType.FIXED && createCouponDto.maxDiscount) {
            throw new common_1.BadRequestException('满减券不支持设置最大减免金额');
        }
        const remainingCount = totalCount !== undefined ? totalCount : -1;
        const coupon = this.couponRepository.create({
            ...createCouponDto,
            startTime: startDate,
            endTime: endDate,
            remainingCount,
            totalCount: totalCount !== undefined ? totalCount : -1,
            perUserLimit: createCouponDto.perUserLimit ?? 1,
            minAmount: createCouponDto.minAmount ?? 0,
            isActive: createCouponDto.isActive ?? true,
        });
        return this.couponRepository.save(coupon);
    }
    async findAll(queryDto) {
        const { page = constants_1.PAGINATION.DEFAULT_PAGE, pageSize = constants_1.PAGINATION.DEFAULT_PAGE_SIZE, name, code, type, isActive, } = queryDto;
        const queryBuilder = this.couponRepository
            .createQueryBuilder('coupon')
            .orderBy('coupon.createdAt', 'DESC');
        if (name) {
            queryBuilder.andWhere('coupon.name LIKE :name', { name: `%${name}%` });
        }
        if (code) {
            queryBuilder.andWhere('coupon.code = :code', { code });
        }
        if (type) {
            queryBuilder.andWhere('coupon.type = :type', { type });
        }
        if (isActive !== undefined) {
            queryBuilder.andWhere('coupon.isActive = :isActive', { isActive });
        }
        const [items, total] = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return {
            items,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async findOne(id) {
        const coupon = await this.couponRepository.findOne({ where: { id } });
        if (!coupon) {
            throw new common_1.NotFoundException('优惠券不存在');
        }
        return coupon;
    }
    async update(id, updateCouponDto) {
        const coupon = await this.findOne(id);
        if (updateCouponDto.code) {
            delete updateCouponDto.code;
        }
        const type = updateCouponDto.type || coupon.type;
        const discount = updateCouponDto.discount ?? coupon.discount;
        if (type === constants_1.CouponType.FIXED && discount < 1) {
            throw new common_1.BadRequestException('满减券的减免金额不能小于1分');
        }
        if (type === constants_1.CouponType.PERCENTAGE && (discount < 1 || discount > 99)) {
            throw new common_1.BadRequestException('折扣券的折扣百分比必须在1-99之间');
        }
        if (updateCouponDto.totalCount !== undefined) {
            const diff = updateCouponDto.totalCount - coupon.totalCount;
            const newRemaining = coupon.remainingCount + diff;
            coupon.remainingCount = newRemaining < 0 ? 0 : newRemaining;
        }
        Object.assign(coupon, updateCouponDto);
        return this.couponRepository.save(coupon);
    }
    async toggleActive(id, isActive) {
        const coupon = await this.findOne(id);
        coupon.isActive = isActive;
        return this.couponRepository.save(coupon);
    }
    async remove(id) {
        const coupon = await this.findOne(id);
        await this.couponRepository.remove(coupon);
    }
    async claimCoupon(userId, code) {
        const coupon = await this.couponRepository.findOne({ where: { code } });
        if (!coupon) {
            throw new common_1.NotFoundException('优惠券不存在');
        }
        if (!coupon.isActive) {
            throw new common_1.BadRequestException('该优惠券已停用');
        }
        const now = new Date();
        if (now < coupon.startTime) {
            throw new common_1.BadRequestException('该优惠券尚未到领取时间');
        }
        if (now > coupon.endTime) {
            throw new common_1.BadRequestException('该优惠券已过期');
        }
        if (coupon.totalCount !== -1 && coupon.remainingCount <= 0) {
            throw new common_1.BadRequestException('该优惠券已被领完');
        }
        if (coupon.perUserLimit > 0) {
            const userClaimCount = await this.userCouponRepository.count({
                where: { userId, couponId: coupon.id },
            });
            if (userClaimCount >= coupon.perUserLimit) {
                throw new common_1.BadRequestException(`该优惠券每人限领${coupon.perUserLimit}张`);
            }
        }
        const userCoupon = await this.dataSource.transaction(async (manager) => {
            if (coupon.totalCount !== -1) {
                await manager.decrement(coupon_entity_1.Coupon, { id: coupon.id }, 'remainingCount', 1);
            }
            const record = this.userCouponRepository.create({
                userId,
                couponId: coupon.id,
                status: 'unused',
            });
            return manager.save(user_coupon_entity_1.UserCoupon, record);
        });
        return userCoupon;
    }
    async getUserAvailableCoupons(userId) {
        const now = new Date();
        const userCoupons = await this.userCouponRepository.find({
            where: { userId, status: 'unused' },
            relations: ['coupon'],
        });
        const availableCoupons = userCoupons.filter((uc) => {
            if (!uc.coupon)
                return false;
            if (!uc.coupon.isActive)
                return false;
            if (now < uc.coupon.startTime || now > uc.coupon.endTime)
                return false;
            return true;
        });
        return availableCoupons.map((uc) => ({
            id: uc.id,
            userId: uc.userId,
            couponId: uc.couponId,
            status: uc.status,
            createdAt: uc.createdAt,
            coupon: uc.coupon,
        }));
    }
    async getUserAllCoupons(userId) {
        const userCoupons = await this.userCouponRepository.find({
            where: { userId },
            relations: ['coupon'],
            order: { createdAt: 'DESC' },
        });
        return userCoupons;
    }
    async calculateDiscount(userId, userCouponId, orderAmount) {
        const userCoupon = await this.userCouponRepository.findOne({
            where: { id: userCouponId, userId },
            relations: ['coupon'],
        });
        if (!userCoupon) {
            throw new common_1.NotFoundException('未找到该优惠券记录');
        }
        if (userCoupon.status !== 'unused') {
            throw new common_1.BadRequestException('该优惠券已被使用或已过期');
        }
        const coupon = userCoupon.coupon;
        if (!coupon) {
            throw new common_1.NotFoundException('优惠券不存在');
        }
        if (!coupon.isActive) {
            throw new common_1.BadRequestException('该优惠券已停用');
        }
        const now = new Date();
        if (now < coupon.startTime) {
            throw new common_1.BadRequestException('该优惠券尚未到使用时间');
        }
        if (now > coupon.endTime) {
            throw new common_1.BadRequestException('该优惠券已过期');
        }
        if (orderAmount < coupon.minAmount) {
            const minYuan = (coupon.minAmount / 100).toFixed(2);
            throw new common_1.BadRequestException(`该订单未达到最低使用门槛（满${minYuan}元可用）`);
        }
        let discountAmount = 0;
        if (coupon.type === constants_1.CouponType.FIXED) {
            discountAmount = coupon.discount;
        }
        else {
            discountAmount = Math.floor(orderAmount * coupon.discount / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        }
        if (discountAmount > orderAmount) {
            discountAmount = orderAmount;
        }
        const finalAmount = orderAmount - discountAmount;
        return {
            discountAmount,
            finalAmount,
            coupon,
        };
    }
    async useCouponForOrder(userCouponId, userId, orderId) {
        const userCoupon = await this.userCouponRepository.findOne({
            where: { id: userCouponId, userId },
        });
        if (!userCoupon) {
            throw new common_1.NotFoundException('未找到该优惠券记录');
        }
        if (userCoupon.status !== 'unused') {
            throw new common_1.BadRequestException('该优惠券已被使用');
        }
        userCoupon.status = 'used';
        userCoupon.usedAt = new Date();
        userCoupon.orderId = orderId;
        await this.userCouponRepository.save(userCoupon);
    }
    async getCouponStats(couponId) {
        const queryBuilder = this.userCouponRepository
            .createQueryBuilder('uc')
            .select('uc.couponId', 'couponId')
            .addSelect('COUNT(*)', 'totalClaimed')
            .addSelect("SUM(CASE WHEN uc.status = 'used' THEN 1 ELSE 0 END)", 'usedCount')
            .addSelect("SUM(CASE WHEN uc.status = 'unused' THEN 1 ELSE 0 END)", 'unusedCount');
        if (couponId) {
            queryBuilder.where('uc.couponId = :couponId', { couponId });
        }
        queryBuilder.groupBy('uc.couponId');
        return queryBuilder.getRawMany();
    }
};
exports.CouponsService = CouponsService;
exports.CouponsService = CouponsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(coupon_entity_1.Coupon)),
    __param(1, (0, typeorm_1.InjectRepository)(user_coupon_entity_1.UserCoupon)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CouponsService);
//# sourceMappingURL=coupons.service.js.map