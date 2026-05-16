import { ChaptersService } from './chapters.service';
import { LessonsService } from './lessons.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class ChaptersController {
    private readonly chaptersService;
    private readonly lessonsService;
    constructor(chaptersService: ChaptersService, lessonsService: LessonsService);
    findByCourseId(courseId: number): Promise<ApiResponse<import("./entities/chapter.entity").Chapter[]>>;
    findById(id: number): Promise<ApiResponse<import("./entities/chapter.entity").Chapter>>;
    create(courseId: number, createChapterDto: CreateChapterDto): Promise<ApiResponse<import("./entities/chapter.entity").Chapter>>;
    update(id: number, updateChapterDto: UpdateChapterDto): Promise<ApiResponse<import("./entities/chapter.entity").Chapter>>;
    remove(id: number): Promise<ApiResponse<null>>;
    updateSortOrder(id: number, sortOrder: number): Promise<ApiResponse<import("./entities/chapter.entity").Chapter>>;
    findLessonsByChapterId(chapterId: number): Promise<ApiResponse<import("./entities/lesson.entity").Lesson[]>>;
    createLesson(courseId: number, chapterId: number, createLessonDto: CreateLessonDto): Promise<ApiResponse<import("./entities/lesson.entity").Lesson>>;
    updateLesson(id: number, updateLessonDto: UpdateLessonDto): Promise<ApiResponse<import("./entities/lesson.entity").Lesson>>;
    removeLesson(id: number): Promise<ApiResponse<null>>;
}
