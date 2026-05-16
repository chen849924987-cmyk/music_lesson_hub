import { CourseType, CourseStatus } from '../../../common/constants';
import { PaginationWithSortDto } from '../../../common/dto/pagination.dto';
export declare class CourseQueryDto extends PaginationWithSortDto {
    categoryId?: number;
    courseType?: CourseType;
    status?: CourseStatus;
    teacherId?: number;
    keyword?: string;
}
