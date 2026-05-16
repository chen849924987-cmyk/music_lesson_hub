import { Order } from './order.entity';
export declare class OrderItem {
    id: number;
    orderId: number;
    order: Order;
    courseId: number;
    lessonId: number;
    lessonTitle: string;
    courseTitle: string;
    price: number;
    quantity: number;
    createdAt: Date;
}
