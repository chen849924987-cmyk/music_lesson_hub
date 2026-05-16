import { Repository } from 'typeorm';
import { LearningProgress } from './entities/learning-progress.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';
export declare class LearningService {
    private readonly progressRepository;
    private readonly logger;
    constructor(progressRepository: Repository<LearningProgress>);
    updateProgress(userId: number, dto: UpdateProgressDto): Promise<LearningProgress>;
    getLessonProgress(userId: number, lessonId: number): Promise<LearningProgress | null>;
    getCourseProgress(userId: number, courseId: number): Promise<{
        totalLessons: number;
        completedLessons: number;
        startedLessons: number;
        progress: number;
    }>;
    getCourseLessonProgresses(userId: number, courseId: number): Promise<LearningProgress[]>;
}
