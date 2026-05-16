import { AlipayConfig } from '../../config/alipay.config';
import { OrdersService } from '../orders/orders.service';
export declare class PaymentsService {
    private readonly alipayConfig;
    private readonly ordersService;
    private readonly logger;
    constructor(alipayConfig: AlipayConfig, ordersService: OrdersService);
    createPayment(orderId: number, userId: number): Promise<{
        payUrl: string;
    }>;
    handleNotify(notifyData: Record<string, any>): Promise<string>;
    queryPaymentStatus(orderNo: string): Promise<{
        status: string;
        tradeNo?: string;
    }>;
    confirmPayment(orderNo: string, userId: number): Promise<import("../orders/entities/order.entity").Order>;
}
