import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { Role, CourseStatus } from '../../common/constants';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    private transformPriceToYuan;
    private transformPriceListToYuan;
    findPublished(queryDto: CourseQueryDto): Promise<ApiResponse<{
        items: import("./entities/course.entity").Course[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    findMyCourses(userId: number, queryDto: CourseQueryDto): Promise<ApiResponse<{
        items: import("./entities/course.entity").Course[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    getTeacherStats(userId: number): Promise<ApiResponse<{
        totalCourses: number;
        totalStudents: number;
        pendingReviewCount: number;
        totalEarnings: number;
    }>>;
    getTeacherProducers(userId: number, page?: number, pageSize?: number): Promise<ApiResponse<{
        items: any[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    findAll(queryDto: CourseQueryDto): Promise<ApiResponse<{
        items: import("./entities/course.entity").Course[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    findByIdAdmin(id: number): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    findPendingReview(queryDto: CourseQueryDto): Promise<ApiResponse<{
        items: import("./entities/course.entity").Course[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    getPendingCourseCount(): Promise<ApiResponse<{
        count: number;
    }>>;
    getMyPurchasedCourses(userId: number): Promise<ApiResponse<import("./entities/course.entity").Course[]>>;
    getCourseDiff(id: number): Promise<ApiResponse<{
        field: string;
        label: string;
        oldValue: string;
        newValue: string;
    }[]>>;
    findById(id: number): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    getReviewHistory(id: number): Promise<ApiResponse<import("./entities/course-review.entity").CourseReview[]>>;
    checkPurchaseStatus(id: number, userId: number): Promise<ApiResponse<{
        purchased: boolean;
    }>>;
    checkLessonAccess(courseId: number, lessonId: number, userId?: number): Promise<ApiResponse<{
        hasAccess: boolean;
        accessType: "full" | "trial" | "none";
        previewDuration: number;
    }>>;
    create(userId: number, createCourseDto: CreateCourseDto): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    update(id: number, userId: number, updateCourseDto: UpdateCourseDto): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    remove(id: number, userId: number): Promise<ApiResponse<null>>;
    updateStatus(id: number, status: CourseStatus, userId: number, role: Role): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    uploadCover(id: number, userId: number, file: Express.Multer.File): Promise<ApiResponse<{
        url: string;
    }>>;
    submitForReview(id: number, userId: number): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    requestOffShelf(id: number, userId: number): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    reviewCourse(id: number, approved: boolean, comment: string | undefined, userId: number): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    withdrawReview(id: number, userId: number): Promise<ApiResponse<import("./entities/course.entity").Course>>;
    adminRemove(id: number): Promise<ApiResponse<null>>;
    setFeatured(id: number, isRecommended: boolean): Promise<ApiResponse<import("./entities/course.entity").Course>>;
}
