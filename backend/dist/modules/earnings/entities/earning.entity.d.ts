import { EarningStatus } from '../../../common/constants';
export declare class Earning {
    id: number;
    teacherId: number;
    orderId: number;
    orderItemId: number;
    courseId: number;
    courseTitle: string;
    amount: number;
    platformShare: number;
    actualAmount: number;
    type: string;
    status: EarningStatus;
    remark: string;
    createdAt: Date;
}
