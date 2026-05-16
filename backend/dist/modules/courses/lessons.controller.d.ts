import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class LessonsController {
    private readonly lessonsService;
    constructor(lessonsService: LessonsService);
    findByCourseId(courseId: number): Promise<ApiResponse<import("./entities/lesson.entity").Lesson[]>>;
    findById(id: number): Promise<ApiResponse<import("./entities/lesson.entity").Lesson>>;
    create(courseId: number, createLessonDto: CreateLessonDto): Promise<ApiResponse<import("./entities/lesson.entity").Lesson>>;
    update(id: number, updateLessonDto: UpdateLessonDto): Promise<ApiResponse<import("./entities/lesson.entity").Lesson>>;
    remove(id: number): Promise<ApiResponse<null>>;
    updateSortOrder(id: number, sortOrder: number): Promise<ApiResponse<import("./entities/lesson.entity").Lesson>>;
}
