import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse } from '../../common/dto/response.dto';
import { PaginationDto, PaginationMeta } from '../../common/dto/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: number): Promise<ApiResponse<import("./entities/user.entity").User>>;
    updateProfile(userId: number, updateUserDto: UpdateUserDto): Promise<ApiResponse<import("./entities/user.entity").User>>;
    findAll(paginationDto: PaginationDto, role?: string, keyword?: string): Promise<ApiResponse<{
        items: import("./entities/user.entity").User[];
        meta: PaginationMeta;
    }>>;
    toggleActive(id: number): Promise<ApiResponse<import("./entities/user.entity").User>>;
    remove(id: number, currentUserId: number): Promise<ApiResponse<null>>;
}
