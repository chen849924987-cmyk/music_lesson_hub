export declare class Withdrawal {
    id: number;
    teacherId: number;
    amount: number;
    accountType: string;
    account: string;
    status: string;
    reviewComment?: string;
    reviewerId?: number;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
