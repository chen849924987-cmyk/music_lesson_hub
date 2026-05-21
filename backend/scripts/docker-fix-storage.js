/**
 * 修复 Docker 容器中 storage.service.js 的脚本
 * 本脚本在 Docker 容器内执行
 */
const fs = require('fs');
const targetPath = '/app/dist/modules/storage/storage.service.js';

try {
  let code = fs.readFileSync(targetPath, 'utf8');
  const lines = code.split('\n');

  let startLine = -1, endLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('async getPresignedUrl(objectName, expiry')) startLine = i;
    if (startLine >= 0 && lines[i].includes('throw error;')) endLine = i;
  }

  if (startLine < 0 || endLine <= startLine) {
    console.error('❌ 未找到函数边界');
    process.exit(1);
  }

  const newFunc = [
    '    async getPresignedUrl(objectName, expiry = 3600) {',
    '        try {',
    "            const endPoint = this.configService.get('minio.endPoint') || '';",
    '            const minioPort = this.configService.get("minio.port") || 9000;',
    "            if (endPoint !== '127.0.0.1' && endPoint !== 'localhost') {",
    "                return 'http://localhost:' + minioPort + '/' + this.bucket + '/' + objectName;",
    '            }',
    '            const url = await this.minioClient.presignedGetObject(this.bucket, objectName, expiry);',
    '            return url;',
    '        }',
    '        catch (error) {',
    "            this.logger.error('获取签名URL失败: ' + this.bucket + '/' + objectName + ' - ' + error.message);",
    '            throw error;',
    '        }',
    '    }',
  ];

  const result = [...lines.slice(0, startLine), ...newFunc, ...lines.slice(endLine + 1)].join('\n');
  fs.writeFileSync(targetPath, result);
  console.log('✅ 修复成功！');
} catch (e) {
  console.error('❌ 失败:', e.message);
  process.exit(1);
}
