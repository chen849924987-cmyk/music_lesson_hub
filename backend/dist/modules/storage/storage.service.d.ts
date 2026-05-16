import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
export declare class StorageService {
    private configService;
    private readonly logger;
    private minioClient;
    private bucket;
    constructor(configService: ConfigService);
    getClient(): Minio.Client;
    getBucket(): string;
    ensureBucket(bucketName?: string): Promise<void>;
    uploadFile(objectName: string, buffer: Buffer, size: number, mimetype: string, metadata?: Record<string, string>): Promise<{
        bucket: string;
        objectName: string;
    }>;
    getPresignedUrl(objectName: string, expiry?: number): Promise<string>;
    statObject(objectName: string): Promise<Minio.BucketItemStat>;
    deleteFile(objectName: string): Promise<void>;
    deleteFiles(objectNames: string[]): Promise<void>;
    getPartialObject(objectName: string, offset: number, length: number): Promise<any>;
    copyObject(sourceObject: string, destObject: string): Promise<void>;
}
