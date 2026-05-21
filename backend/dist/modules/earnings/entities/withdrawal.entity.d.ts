import { Teacher } from '../../teachers/entities/teacher.entity';
export declare class Withdrawal {
    id: number;
    teacherId: number;
    amount: number;
    status: string;
    accountInfo: string;
    reviewerId: number;
    remark: string;
    processedAt: Date;
    teacher: Teacher;
    createdAt: Date;
    updatedAt: Date;
}
