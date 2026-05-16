import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class CouponsController {
    private readonly couponsService;
    constructor(couponsService: CouponsService);
    create(createCouponDto: CreateCouponDto): Promise<ApiResponse<import("./entities/coupon.entity").Coupon>>;
    findAll(queryDto: QueryCouponDto): Promise<ApiResponse<{
        items: import("./entities/coupon.entity").Coupon[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    findOne(id: number): Promise<ApiResponse<import("./entities/coupon.entity").Coupon>>;
    update(id: number, updateCouponDto: UpdateCouponDto): Promise<ApiResponse<import("./entities/coupon.entity").Coupon>>;
    toggleActive(id: number, isActive: boolean): Promise<ApiResponse<import("./entities/coupon.entity").Coupon>>;
    remove(id: number): Promise<ApiResponse<null>>;
    getStats(couponId?: string): Promise<ApiResponse<any[]>>;
    claimCoupon(userId: number, code: string): Promise<ApiResponse<import("./entities/user-coupon.entity").UserCoupon>>;
    getAvailableCoupons(userId: number): Promise<ApiResponse<any[]>>;
    getMyCoupons(userId: number): Promise<ApiResponse<any[]>>;
    calculateDiscount(userId: number, userCouponId: number, orderAmount: number): Promise<ApiResponse<{
        discountAmount: number;
        finalAmount: number;
        coupon: import("./entities/coupon.entity").Coupon;
    }>>;
}
