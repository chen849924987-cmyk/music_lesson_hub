import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus, OrderType, PaymentMethod } from '../../../common/constants';
export declare class Order {
    id: number;
    user: User;
    orderNo: string;
    userId: number;
    totalAmount: number;
    status: OrderStatus;
    orderType: OrderType;
    paymentMethod: PaymentMethod;
    tradeNo: string;
    paidAt: Date;
    expiredAt: Date;
    remark: string;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
