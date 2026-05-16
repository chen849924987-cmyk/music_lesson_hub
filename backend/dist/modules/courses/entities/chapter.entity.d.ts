import { Course } from './course.entity';
import { Lesson } from './lesson.entity';
export declare class Chapter {
    id: number;
    courseId: number;
    course: Course;
    title: string;
    description: string;
    sortOrder: number;
    lessons: Lesson[];
    createdAt: Date;
    updatedAt: Date;
}
