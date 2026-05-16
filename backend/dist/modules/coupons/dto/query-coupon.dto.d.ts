import { CouponType } from '../../../common/constants';
export declare class QueryCouponDto {
    page?: number;
    pageSize?: number;
    name?: string;
    code?: string;
    type?: CouponType;
    isActive?: boolean;
}
