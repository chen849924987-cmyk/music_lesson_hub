export declare class LearningProgress {
    id: number;
    userId: number;
    courseId: number;
    lessonId: number;
    progress: number;
    lastPosition: number;
    duration: number;
    completed: boolean;
    completedAt: Date | null;
    playCount: number;
    createdAt: Date;
    updatedAt: Date;
}
