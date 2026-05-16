import { LearningService } from './learning.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
export declare class LearningController {
    private readonly learningService;
    private readonly logger;
    constructor(learningService: LearningService);
    updateProgress(userId: number, dto: UpdateProgressDto): Promise<{
        id: number;
        lessonId: number;
        progress: number;
        lastPosition: number;
        completed: boolean;
        completedAt: Date | null;
    }>;
    getLessonProgress(userId: number, lessonId: number): Promise<{
        lessonId: number;
        progress: number;
        lastPosition: number;
        completed: boolean;
        completedAt: null;
        id?: undefined;
    } | {
        id: number;
        lessonId: number;
        progress: number;
        lastPosition: number;
        completed: boolean;
        completedAt: Date | null;
    }>;
    getCourseProgress(userId: number, courseId: number): Promise<{
        totalLessons: number;
        completedLessons: number;
        startedLessons: number;
        progress: number;
    }>;
    getCourseLessonProgresses(userId: number, courseId: number): Promise<{
        lessonId: number;
        progress: number;
        lastPosition: number;
        completed: boolean;
    }[]>;
}
