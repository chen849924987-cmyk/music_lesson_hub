import { Repository, DataSource } from 'typeorm';
import { Course } from './entities/course.entity';
import { Category } from './entities/category.entity';
import { CourseReview } from './entities/course-review.entity';
import { UserCourse } from './entities/user-course.entity';
import { UserLesson } from './entities/user-lesson.entity';
import { Lesson } from './entities/lesson.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseStatus, Role } from '../../common/constants';
import { PaginationMeta } from '../../common/dto/pagination.dto';
import { StorageService } from '../storage/storage.service';
export declare class CoursesService {
    private readonly courseRepository;
    private readonly categoryRepository;
    private readonly courseReviewRepository;
    private readonly userCourseRepository;
    private readonly userLessonRepository;
    private readonly lessonRepository;
    private readonly storageService;
    private readonly dataSource;
    private readonly logger;
    constructor(courseRepository: Repository<Course>, categoryRepository: Repository<Category>, courseReviewRepository: Repository<CourseReview>, userCourseRepository: Repository<UserCourse>, userLessonRepository: Repository<UserLesson>, lessonRepository: Repository<Lesson>, storageService: StorageService, dataSource: DataSource);
    create(teacherId: number, createCourseDto: CreateCourseDto): Promise<Course>;
    findById(id: number, relations?: string[]): Promise<Course>;
    update(id: number, teacherId: number, updateCourseDto: UpdateCourseDto): Promise<Course>;
    remove(id: number, teacherId: number): Promise<void>;
    findPublished(queryDto: CourseQueryDto): Promise<{
        items: Course[];
        meta: PaginationMeta;
    }>;
    findTeacherCourses(teacherId: number, queryDto: CourseQueryDto): Promise<{
        items: Course[];
        meta: PaginationMeta;
    }>;
    findAll(queryDto: CourseQueryDto): Promise<{
        items: Course[];
        meta: PaginationMeta;
    }>;
    updateStatus(id: number, status: CourseStatus, userId: number, role: Role): Promise<Course>;
    findPendingReview(queryDto: CourseQueryDto): Promise<{
        items: Course[];
        meta: PaginationMeta;
    }>;
    countPendingReview(): Promise<number>;
    submitForReview(id: number, teacherId: number): Promise<Course>;
    getCourseDiff(id: number): Promise<{
        field: string;
        label: string;
        oldValue: string;
        newValue: string;
    }[]>;
    private getCategoryName;
    requestOffShelf(id: number, teacherId: number): Promise<Course>;
    withdrawReview(id: number, teacherId: number): Promise<Course>;
    reviewCourse(id: number, reviewerId: number, approved: boolean, comment?: string): Promise<Course>;
    getReviewHistory(courseId: number): Promise<CourseReview[]>;
    setFeatured(id: number, isRecommended: boolean): Promise<Course>;
    uploadCover(id: number, teacherId: number, file: Express.Multer.File): Promise<string>;
    transformCoverToUrl(course: Course): Promise<void>;
    adminRemove(id: number): Promise<void>;
    checkUserPurchasedCourse(userId: number, courseId: number): Promise<boolean>;
    checkLessonAccess(userId: number | null, courseId: number, lessonId: number): Promise<{
        hasAccess: boolean;
        accessType: 'full' | 'trial' | 'none';
        previewDuration: number;
    }>;
    addUserCourse(userId: number, courseId: number, price: number, orderId?: number): Promise<UserCourse>;
    findUserCourses(userId: number): Promise<Course[]>;
    getTeacherStats(teacherId: number): Promise<{
        totalCourses: number;
        totalStudents: number;
        pendingReviewCount: number;
        totalEarnings: number;
    }>;
    getTeacherProducers(teacherId: number, page?: number, pageSize?: number): Promise<{
        items: any[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    private validateStatusTransition;
}
