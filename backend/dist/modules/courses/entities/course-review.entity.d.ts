export declare class CourseReview {
    id: number;
    courseId: number;
    reviewerId: number;
    action: 'approved' | 'rejected';
    comment: string;
    previousStatus: string;
    newStatus: string;
    createdAt: Date;
}
