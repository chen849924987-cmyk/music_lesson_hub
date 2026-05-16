"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Minio = __importStar(require("minio"));
let StorageService = StorageService_1 = class StorageService {
    configService;
    logger = new common_1.Logger(StorageService_1.name);
    minioClient;
    bucket;
    constructor(configService) {
        this.configService = configService;
        const endPoint = this.configService.get('minio.endPoint') ?? '192.168.1.100';
        const port = this.configService.get('minio.port') ?? 9000;
        const accessKey = this.configService.get('minio.accessKey') ?? 'minioadmin';
        const secretKey = this.configService.get('minio.secretKey') ?? 'minioadmin';
        const useSSL = this.configService.get('minio.useSSL') ?? false;
        this.bucket = this.configService.get('minio.bucket') ?? 'music-edu';
        this.minioClient = new Minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
        this.logger.log(`MinIO 客户端初始化成功: ${endPoint}:${port}/${this.bucket}`);
    }
    getClient() {
        return this.minioClient;
    }
    getBucket() {
        return this.bucket;
    }
    async ensureBucket(bucketName) {
        const name = bucketName ?? this.bucket;
        try {
            const exists = await this.minioClient.bucketExists(name);
            if (!exists) {
                await this.minioClient.makeBucket(name, 'us-east-1');
                this.logger.log(`存储桶已创建: ${name}`);
            }
        }
        catch (error) {
            this.logger.error(`确保存储桶存在失败: ${error.message}`);
            throw error;
        }
    }
    async uploadFile(objectName, buffer, size, mimetype, metadata) {
        await this.ensureBucket();
        const meta = {
            'Content-Type': mimetype,
            ...(metadata ?? {}),
        };
        await this.minioClient.putObject(this.bucket, objectName, buffer, size, meta);
        this.logger.log(`文件上传成功: ${this.bucket}/${objectName}`);
        return { bucket: this.bucket, objectName };
    }
    async getPresignedUrl(objectName, expiry = 3600) {
        try {
            const url = await this.minioClient.presignedGetObject(this.bucket, objectName, expiry);
            return url;
        }
        catch (error) {
            this.logger.error(`获取签名URL失败: ${this.bucket}/${objectName} - ${error.message}`);
            throw error;
        }
    }
    async statObject(objectName) {
        try {
            return await this.minioClient.statObject(this.bucket, objectName);
        }
        catch (error) {
            this.logger.error(`获取文件统计信息失败: ${this.bucket}/${objectName} - ${error.message}`);
            throw error;
        }
    }
    async deleteFile(objectName) {
        try {
            await this.minioClient.removeObject(this.bucket, objectName);
            this.logger.log(`文件删除成功: ${this.bucket}/${objectName}`);
        }
        catch (error) {
            this.logger.error(`删除文件失败: ${this.bucket}/${objectName} - ${error.message}`);
            throw error;
        }
    }
    async deleteFiles(objectNames) {
        try {
            await this.minioClient.removeObjects(this.bucket, objectNames);
            this.logger.log(`批量删除文件成功: ${objectNames.length} 个文件`);
        }
        catch (error) {
            this.logger.error(`批量删除文件失败: ${error.message}`);
            throw error;
        }
    }
    async getPartialObject(objectName, offset, length) {
        try {
            return await this.minioClient.getPartialObject(this.bucket, objectName, offset, length);
        }
        catch (error) {
            this.logger.error(`获取部分对象失败: ${this.bucket}/${objectName} - ${error.message}`);
            throw error;
        }
    }
    async copyObject(sourceObject, destObject) {
        try {
            await this.minioClient.copyObject(this.bucket, destObject, `/${this.bucket}/${sourceObject}`);
            this.logger.log(`文件复制成功: ${sourceObject} -> ${destObject}`);
        }
        catch (error) {
            this.logger.error(`复制文件失败: ${error.message}`);
            throw error;
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map