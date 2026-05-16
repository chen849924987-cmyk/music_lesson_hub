import { Coupon } from './coupon.entity';
export declare class UserCoupon {
    id: number;
    coupon: Coupon;
    userId: number;
    couponId: number;
    status: string;
    usedAt: Date;
    orderId: number;
    createdAt: Date;
    updatedAt: Date;
}
