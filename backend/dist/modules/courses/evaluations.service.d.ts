import { Repository } from 'typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Course } from './entities/course.entity';
import { UserCourse } from './entities/user-course.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ReplyEvaluationDto } from './dto/reply-evaluation.dto';
export declare class EvaluationsService {
    private readonly evaluationRepository;
    private readonly courseRepository;
    private readonly userCourseRepository;
    private readonly logger;
    constructor(evaluationRepository: Repository<Evaluation>, courseRepository: Repository<Course>, userCourseRepository: Repository<UserCourse>);
    create(courseId: number, userId: number, createEvaluationDto: CreateEvaluationDto): Promise<Evaluation>;
    reply(evaluationId: number, teacherId: number, replyDto: ReplyEvaluationDto): Promise<Evaluation>;
    findByCourse(courseId: number, page?: number, pageSize?: number): Promise<{
        items: Evaluation[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    findByUser(userId: number, page?: number, pageSize?: number): Promise<{
        items: Evaluation[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    checkUserEvaluated(courseId: number, userId: number): Promise<{
        evaluated: boolean;
        evaluation?: Evaluation;
    }>;
    private syncCourseRating;
}
