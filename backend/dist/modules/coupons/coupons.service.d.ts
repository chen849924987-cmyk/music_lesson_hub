import { Repository, DataSource } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
export declare class CouponsService {
    private readonly couponRepository;
    private readonly userCouponRepository;
    private readonly dataSource;
    constructor(couponRepository: Repository<Coupon>, userCouponRepository: Repository<UserCoupon>, dataSource: DataSource);
    create(createCouponDto: CreateCouponDto): Promise<Coupon>;
    findAll(queryDto: QueryCouponDto): Promise<{
        items: Coupon[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Coupon>;
    update(id: number, updateCouponDto: UpdateCouponDto): Promise<Coupon>;
    toggleActive(id: number, isActive: boolean): Promise<Coupon>;
    remove(id: number): Promise<void>;
    claimCoupon(userId: number, code: string): Promise<UserCoupon>;
    getUserAvailableCoupons(userId: number): Promise<any[]>;
    getUserAllCoupons(userId: number): Promise<any[]>;
    calculateDiscount(userId: number, userCouponId: number, orderAmount: number): Promise<{
        discountAmount: number;
        finalAmount: number;
        coupon: Coupon;
    }>;
    useCouponForOrder(userCouponId: number, userId: number, orderId: number): Promise<void>;
    getCouponStats(couponId?: number): Promise<any[]>;
}
