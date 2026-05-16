export declare class CreateOrderDto {
    courseIds?: number[];
    lessonIds?: number[];
}
export declare class AddToCartDto {
    courseId: number;
    quantity?: number;
}
export declare class OrderQueryDto {
    page?: number;
    pageSize?: number;
    status?: string;
}
