import { Chapter } from './chapter.entity';
export declare class Lesson {
    id: number;
    chapterId: number;
    chapter: Chapter;
    courseId: number;
    title: string;
    description: string;
    duration: number;
    videoId: number;
    isFree: boolean;
    previewDuration: number;
    canSinglePurchase: boolean;
    singlePrice: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
