import { CouponType } from '../../../common/constants';
export declare class CreateCouponDto {
    name: string;
    code: string;
    type: CouponType;
    discount: number;
    minAmount?: number;
    maxDiscount?: number;
    totalCount?: number;
    perUserLimit?: number;
    startTime: string;
    endTime: string;
    isActive?: boolean;
    description?: string;
}
