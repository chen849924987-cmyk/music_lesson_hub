"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChapterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_chapter_dto_1 = require("./create-chapter.dto");
class UpdateChapterDto extends (0, swagger_1.PartialType)(create_chapter_dto_1.CreateChapterDto) {
}
exports.UpdateChapterDto = UpdateChapterDto;
//# sourceMappingURL=update-chapter.dto.js.map