"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('minio', () => ({
    endPoint: process.env.MINIO_ENDPOINT ?? '192.168.1.100',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'music-edu',
    useSSL: process.env.MINIO_USE_SSL === 'true',
}));
//# sourceMappingURL=minio.config.js.map