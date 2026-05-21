/**
 * 修复 MinIO URL 生成逻辑的脚本
 * 功能描述：编译后的 storage.service.js 中，getPresignedUrl 需要根据环境判断
 * - Docker 环境（MINIO_ENDPOINT=minio）：返回公开 URL
 * - 本机环境（MINIO_ENDPOINT=127.0.0.1/localhost）：使用预签名 URL
 */
const fs = require('fs');
const path = require('path');

const targetPath = '/app/dist/modules/storage/storage.service.js';

// 读取文件
let code = fs.readFileSync(targetPath, 'utf8');
const lines = code.split('\n');

// 找到函数边界
let startLine = -1, endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async getPresignedUrl(objectName, expiry')) {
    startLine = i;
  }
  if (startLine >= 0 && lines[i].trim() === '}' && i > startLine + 3) {
    if (endLine === -1) {
      // 找到第一个闭合大括号（catch块）
      endLine = i;
    } else {
      // 找到第二个闭合大括号（整个函数）
      endLine = i;
      break;
    }
  }
}

if (startLine >= 0 && endLine > startLine) {
  console.log(`找到函数: 第${startLine + 1}行 ~ 第${endLine + 1}行`);
  
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
  console.log('✅ 替换成功！');
  console.log('新逻辑: 检查 MINIO_ENDPOINT 环境变量');
  console.log('  - Docker 环境 (minio): 返回公开 URL');
  console.log('  - 本机环境 (127.0.0.1): 使用预签名 URL');
} else {
  console.error('❌ 未找到函数边界');
  console.log('startLine:', startLine, 'endLine:', endLine);
  process.exit(1);
}
