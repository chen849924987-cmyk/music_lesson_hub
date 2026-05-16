import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { ApiResponse } from '../../common/dto/response.dto';
import { PaginationMeta } from '../../common/dto/pagination.dto';
export declare class VideosController {
    private readonly videosService;
    constructor(videosService: VideosService);
    upload(userId: number, file: Express.Multer.File): Promise<ApiResponse<import("./entities/video.entity").Video>>;
    create(userId: number, createVideoDto: CreateVideoDto): Promise<ApiResponse<import("./entities/video.entity").Video>>;
    findMyVideos(userId: number, page?: number, pageSize?: number): Promise<ApiResponse<{
        items: import("./entities/video.entity").Video[];
        meta: PaginationMeta;
    }>>;
    findOne(id: number): Promise<ApiResponse<import("./entities/video.entity").Video>>;
    getPlayUrl(id: number): Promise<ApiResponse<{
        url: string;
    }>>;
    getCoverUrl(id: number): Promise<ApiResponse<{
        url: string;
    }>>;
    getPreviewUrl(id: number, previewDuration?: number): Promise<ApiResponse<{
        url: string;
        previewDuration: number;
    }>>;
    remove(userId: number, id: number): Promise<ApiResponse<null>>;
}
