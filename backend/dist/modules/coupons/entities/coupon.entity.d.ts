import { CouponType } from '../../../common/constants';
export declare class Coupon {
    id: number;
    name: string;
    code: string;
    type: CouponType;
    discount: number;
    minAmount: number;
    maxDiscount: number;
    totalCount: number;
    perUserLimit: number;
    remainingCount: number;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
