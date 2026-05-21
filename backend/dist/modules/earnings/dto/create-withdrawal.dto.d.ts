export declare class CreateWithdrawalDto {
    amount: number;
}
export declare class ReviewWithdrawalDto {
    action: 'approved' | 'rejected';
    remark?: string;
}
