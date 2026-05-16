import { PaymentsService } from './payments.service';
import { ApiResponse } from '../../common/dto/response.dto';
import type { Request, Response } from 'express';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    createPayment(userId: number, orderId: number): Promise<ApiResponse<{
        payUrl: string;
    }>>;
    handleNotify(req: Request, res: Response): Promise<void>;
    queryPaymentStatus(orderNo: string): Promise<ApiResponse<{
        status: string;
        tradeNo?: string;
    }>>;
    confirmPayment(userId: number, orderNo: string): Promise<ApiResponse<import("../orders/entities/order.entity").Order>>;
}
