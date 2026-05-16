import { OrdersService } from './orders.service';
import { CreateOrderDto, AddToCartDto } from './dto/create-order.dto';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(userId: number, createOrderDto: CreateOrderDto): Promise<ApiResponse<import("./entities/order.entity").Order>>;
    getMyOrders(userId: number, page?: number, pageSize?: number, status?: string): Promise<ApiResponse<{
        items: import("./entities/order.entity").Order[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    getOrderDetail(id: number, userId: number): Promise<ApiResponse<import("./entities/order.entity").Order>>;
    cancelOrder(id: number, userId: number): Promise<ApiResponse<import("./entities/order.entity").Order>>;
    getAllOrders(page?: number, pageSize?: number, status?: string, userId?: number): Promise<ApiResponse<{
        items: import("./entities/order.entity").Order[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
        stats: {
            total: number;
            pending: number;
            paid: number;
            refunded: number;
            refunding: number;
            cancelled: number;
        };
    }>>;
    refundOrder(id: number, remark?: string): Promise<ApiResponse<import("./entities/order.entity").Order>>;
    getCart(userId: number): Promise<ApiResponse<any[]>>;
    getCartCount(userId: number): Promise<ApiResponse<{
        count: number;
    }>>;
    addToCart(userId: number, addToCartDto: AddToCartDto): Promise<ApiResponse<import("./entities/cart.entity").CartItem>>;
    removeFromCart(userId: number, courseId: number): Promise<ApiResponse<null>>;
    clearCart(userId: number): Promise<ApiResponse<null>>;
    checkPurchase(userId: number, courseId: number): Promise<ApiResponse<{
        purchased: boolean;
    }>>;
}
