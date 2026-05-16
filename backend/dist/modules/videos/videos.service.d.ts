import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { StorageService } from '../storage/storage.service';
export declare class VideosService {
    private readonly videoRepository;
    private readonly storageService;
    private readonly logger;
    constructor(videoRepository: Repository<Video>, storageService: StorageService);
    create(userId: number, createVideoDto: CreateVideoDto): Promise<Video>;
    private getVideoDuration;
    uploadFile(userId: number, file: Express.Multer.File): Promise<Video>;
    findOne(id: number): Promise<Video>;
    findByUser(userId: number, page?: number, pageSize?: number): Promise<{
        items: Video[];
        total: number;
    }>;
    getPlayUrl(id: number, expiry?: number): Promise<string>;
    getCoverUrl(id: number, expiry?: number): Promise<string>;
    updateTranscodeStatus(id: number, transcodeStatus: string, transcodeOutputs?: string): Promise<void>;
    updateCover(id: number, coverObjectName: string): Promise<void>;
    softDelete(id: number, userId: number): Promise<void>;
    hardDelete(id: number): Promise<void>;
}
