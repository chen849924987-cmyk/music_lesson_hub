import { TeachersService } from './teachers.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ApiResponse } from '../../common/dto/response.dto';
import { PaginationDto, PaginationMeta } from '../../common/dto/pagination.dto';
export declare class TeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    createProfile(userId: number, realName: string): Promise<ApiResponse<import("./entities/teacher.entity").Teacher>>;
    getProfile(userId: number): Promise<ApiResponse<import("./entities/teacher.entity").Teacher>>;
    updateProfile(userId: number, updateTeacherDto: UpdateTeacherDto): Promise<ApiResponse<import("./entities/teacher.entity").Teacher>>;
    updateSettings(userId: number, updateTeacherDto: UpdateTeacherDto): Promise<ApiResponse<import("./entities/teacher.entity").Teacher>>;
    findAll(paginationDto: PaginationDto): Promise<ApiResponse<{
        items: import("./entities/teacher.entity").Teacher[];
        meta: PaginationMeta;
    }>>;
    findOne(id: number): Promise<ApiResponse<import("./entities/teacher.entity").Teacher>>;
    verifyTeacher(id: number): Promise<ApiResponse<import("./entities/teacher.entity").Teacher>>;
    reviewTeacher(id: number, approved: boolean): Promise<ApiResponse<import("./entities/teacher.entity").Teacher>>;
}
