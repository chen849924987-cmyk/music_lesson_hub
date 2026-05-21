import { User } from '../../users/entities/user.entity';
import { Course } from './course.entity';
export declare class Evaluation {
    id: number;
    courseId: number;
    userId: number;
    rating: number;
    content: string;
    replyContent: string;
    repliedAt: Date;
    isVisible: boolean;
    isPurchased: boolean;
    course: Course;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
