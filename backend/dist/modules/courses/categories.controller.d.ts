import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<ApiResponse<import("./entities/category.entity").Category[]>>;
    findActive(): Promise<ApiResponse<import("./entities/category.entity").Category[]>>;
    findById(id: number): Promise<ApiResponse<import("./entities/category.entity").Category>>;
    create(createCategoryDto: CreateCategoryDto): Promise<ApiResponse<import("./entities/category.entity").Category>>;
    update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<ApiResponse<import("./entities/category.entity").Category>>;
    remove(id: number): Promise<ApiResponse<null>>;
}
