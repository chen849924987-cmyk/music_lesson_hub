export declare class PaginationDto {
    page?: number;
    pageSize?: number;
}
export declare class PaginationWithSortDto extends PaginationDto {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export declare class PaginationMeta {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    constructor(total: number, page: number, pageSize: number);
}
