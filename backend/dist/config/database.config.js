"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => ({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10) || 3306,
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root123456',
    database: process.env.DB_DATABASE ?? 'music_edu',
}));
//# sourceMappingURL=database.config.js.map