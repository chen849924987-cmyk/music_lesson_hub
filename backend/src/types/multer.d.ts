// ============================================================
// Multer 类型声明
// 功能描述：补充 Express.Multer.File 类型定义，解决 NestJS 项目中
// 使用 @UploadedFile() 装饰器时的类型识别问题
// ============================================================
import 'express';

declare global {
  namespace Express {
    namespace Multer {
      /** 上传文件信息 */
      interface File {
        /** Field 字段名称 */
        fieldname: string;
        /** 原始文件名 */
        originalname: string;
        /** 编码类型 */
        encoding: string;
        /** MIME 类型 */
        mimetype: string;
        /** 文件大小（字节） */
        size: number;
        /** 文件存储位置（diskStorage 时使用） */
        destination?: string;
        /** 文件存储路径（diskStorage 时使用） */
        filename?: string;
        /** 完整文件路径（diskStorage 时使用） */
        path?: string;
        /** 文件缓冲区（memoryStorage 时使用） */
        buffer: Buffer;
      }
    }
  }
}
