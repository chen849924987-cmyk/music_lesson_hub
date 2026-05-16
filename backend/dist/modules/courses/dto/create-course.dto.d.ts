import { CourseType } from '../../../common/constants';
export declare class CreateCourseDto {
    title: string;
    cover?: string;
    description?: string;
    categoryId: number;
    courseType?: CourseType;
    price?: number;
    originalPrice?: number;
    previewDuration?: number;
    trailerVideoId?: number;
    tags?: string;
}
