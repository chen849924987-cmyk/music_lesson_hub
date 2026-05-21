# ============================================================
# 后端 Dockerfile - NestJS 生产环境构建
# ============================================================
# 使用多阶段构建（Multi-stage Build）减小最终镜像体积
#
# 构建阶段（build）：安装依赖 + 编译 TypeScript
# 生产阶段（production）：仅包含运行所需的产物
# ============================================================

# ---- Stage 1: 依赖安装与构建 ----
FROM docker.m.daocloud.io/library/node:20-alpine AS build

# 设置工作目录
WORKDIR /app

# 先复制依赖描述文件，利用 Docker 层缓存
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，因为构建需要 @nestjs/cli 等）
RUN npm ci

# 复制所有源码
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src/ ./src/

# 构建（NestJS 编译）
RUN npm run build

# ---- Stage 2: 生产运行 ----
FROM docker.m.daocloud.io/library/node:20-alpine AS production

# 设置生产环境变量
ENV NODE_ENV=production

# 安装 tzdata 用于时区设置
RUN apk add --no-cache tzdata

# 设置时区为中国时区
ENV TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 仅复制 package.json 用于安装生产依赖
COPY package*.json ./

# 仅安装生产依赖（使用 npm ci 的 --omit=dev 替代 --prod）
RUN npm ci --omit=dev

# 从构建阶段复制编译产物
COPY --from=build /app/dist/ ./dist/

# 暴露应用端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# 启动命令（使用 node 直接运行，不经过 NestJS CLI）
CMD ["node", "dist/main"]
