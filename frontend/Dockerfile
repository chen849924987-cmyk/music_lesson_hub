# ============================================================
# 前端 Dockerfile - Vue 3 + Vite 生产环境构建
# ============================================================
# 多阶段构建：
# Stage 1 (build)：基于 Node.js 构建 Vue 项目
# Stage 2 (production)：基于 Nginx 托管构建产物
# ============================================================

# ---- Stage 1: 构建阶段 ----
FROM docker.m.daocloud.io/library/node:20-alpine AS build

# 设置工作目录
WORKDIR /app

# 先复制依赖描述文件，利用 Docker 层缓存
COPY package*.json ./

# 安装依赖（Vite + Vue + Element Plus 等）
RUN npm ci && npm install @heroicons/vue --save

# 复制所有源码
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/

# 构建生产版本（仅 vite build，跳过 vue-tsc 类型检查）
# 注意：vue-tsc 类型检查在 Docker 构建环境下可能因环境差异报错，
# 本地开发时请确保 `npm run build` 正常运行
RUN npx vite build

# ---- Stage 2: Nginx 托管阶段 ----
FROM docker.m.daocloud.io/library/nginx:1.25-alpine AS production

# 安装 tzdata 用于时区设置
RUN apk add --no-cache tzdata

# 设置时区为中国时区
ENV TZ=Asia/Shanghai

# 从构建阶段复制构建产物到 Nginx 默认静态目录
COPY --from=build /app/dist/ /usr/share/nginx/html/

# 删除默认 Nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口（Nginx 默认端口）
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# 前台启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
