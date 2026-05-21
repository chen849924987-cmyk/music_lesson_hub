import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ReplyEvaluationDto } from './dto/reply-evaluation.dto';
import { ApiResponse } from '../../common/dto/response.dto';
export declare class EvaluationsController {
    private readonly evaluationsService;
    constructor(evaluationsService: EvaluationsService);
    create(courseId: number, userId: number, createEvaluationDto: CreateEvaluationDto): Promise<ApiResponse<import("./entities/evaluation.entity").Evaluation>>;
    findByCourse(courseId: number, page?: number, pageSize?: number): Promise<ApiResponse<{
        items: import("./entities/evaluation.entity").Evaluation[];
        meta: import("../../common/dto/pagination.dto").PaginationMeta;
    }>>;
    checkEvaluated(courseId: number, userId: number): Promise<ApiResponse<{
        evaluated: boolean;
        evaluation?: import("./entities/evaluation.entity").Evaluation;
    }>>;
    reply(courseId: number, evaluationId: number, userId: number, replyDto: ReplyEvaluationDto): Promise<ApiResponse<import("./entities/evaluation.entity").Evaluation>>;
}
