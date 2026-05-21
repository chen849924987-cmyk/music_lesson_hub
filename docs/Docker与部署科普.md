# Docker 与部署科普

> **版本**: v1.0
> **适用项目**: 音乐视频课程销售平台
> **目标读者**: 不了解 Docker 和部署的开发者

---

## 目录

1. [先理解：你的项目现在是怎么跑的](#1-先理解你的项目现在是怎么跑的)
2. [什么是 Docker？](#2-什么是-docker)
3. [Docker 核心概念详解](#3-docker-核心概念详解)
4. [Docker Compose 是什么？](#4-docker-compose-是什么)
5. [什么是部署？](#5-什么是部署)
6. [本项目的完整部署架构](#6-本项目的完整部署架构)
7. [部署到云服务器的全流程](#7-部署到云服务器的全流程)
8. [Nginx 是干什么的？](#8-nginx-是干什么的)
9. [HTTPS / SSL 证书是什么？](#9-https--ssl-证书是什么)
10. [面试演示方案：Tailscale Funnel 等内网穿透工具](#10-面试演示方案tailscale-funnel-等内网穿透工具)
11. [常见问题 FAQ](#11-常见问题-faq)

---

## 1. 先理解：你的项目现在是怎么跑的

在了解 Docker 之前，先看看你现在开发时是怎么启动项目的：

### 你现在的手动启动流程

```
步骤 1: 启动 MySQL 数据库（你电脑上装的一个数据库软件）
步骤 2: 启动 Redis 缓存（你电脑上装的一个缓存软件）
步骤 3: 启动 MinIO 文件存储（你电脑上装的一个文件服务器）
步骤 4: cd backend && npm run start:dev（启动 NestJS 后端）
步骤 5: cd frontend && npm run dev（启动 Vue 前端开发服务器）
步骤 6: 打开浏览器访问 http://localhost:5173
```

### 这里有什么问题？

| 问题 | 说明 |
|:----|:-----|
| **环境依赖多** | 你电脑上要安装 Node.js、MySQL、Redis、MinIO 等一堆软件 |
| **换电脑麻烦** | 换台电脑开发，所有软件要重新安装配置一遍 |
| **部署困难** | 要把项目放到云服务器上，服务器上也要装一堆软件，配置环境变量 |
| **版本冲突** | 你电脑上可能同时有多个项目，需要的 MySQL/Node 版本不一样 |
| **"在我电脑上能跑"** | 开发环境没问题，部署到服务器上各种报错，因为环境不同 |

### Docker 就是为了解决这些问题而生的

---

## 2. 什么是 Docker？

**Docker** 是一个「容器化」平台。它可以把你的应用和它需要的所有东西（代码、运行时、系统工具、库、配置）打包成一个**标准化的单元**，这个单元可以在任何安装了 Docker 的机器上运行。

### 通俗类比：搬家

```
没有 Docker 的情况：

  你搬家了，新家没有：
  - 冰箱（MySQL）
  - 洗衣机（Redis）
  - 空调（MinIO）
  - 电视机（Node.js）
  
  你到了新家，得重新买所有家电，重新安装。

有 Docker 的情况：

  你搬家了，直接把所有家电装进「集装箱」里。
  到了新家，只要把集装箱打开，所有东西直接能用。
  
  这个「集装箱」就是 Docker 容器。
```

### Docker 与虚拟机的对比

```
┌─────────────────────────────────────────────┐
│                 对比表格                      │
├─────────────┬──────────────┬────────────────┤
│             │   虚拟机 VM   │   Docker 容器  │
├─────────────┼──────────────┼────────────────┤
│ 启动速度    │ 几分钟        │ 几秒钟          │
│ 占用空间    │ GB 级别       │ MB 级别         │
│ 性能损耗    │ 较高          │ 几乎无损耗       │
│ 资源利用率  │ 低（每个VM独  │ 高（共享宿主机   │
│             │ 占操作系统）  │ 操作系统内核）   │
│ 隔离性      │ 完全隔离      │ 进程级隔离       │
└─────────────┴──────────────┴────────────────┘
```

---

## 3. Docker 核心概念详解

### 3.1 镜像（Image）

**镜像**是一个只读的「模板」，里面包含了运行应用所需的一切。

你可以把镜像想象成**一个压缩包**，里面装好了：
- 操作系统（比如 Ubuntu、Alpine Linux）
- 运行环境（比如 Node.js 18）
- 应用代码（你写的 NestJS/Vue 代码）
- 依赖包（node_modules）
- 配置文件

```
docker pull node:18-alpine  # 下载 Node.js 18 的镜像
docker images                # 查看本地所有镜像
```

### 3.2 容器（Container）

**容器**是镜像的**运行实例**。一个镜像可以启动多个容器。

你可以把容器想象成**用镜像这个「压缩包」解压后运行的进程**。

```
docker run node:18-alpine    # 基于镜像启动一个容器
docker ps                    # 查看正在运行的容器
docker stop <容器ID>         # 停止容器
docker rm <容器ID>           # 删除容器
```

**镜像 vs 容器：类比**

```
镜像 = 菜谱（固定的配方）
容器 = 按照菜谱做出来的一盘菜（可以做好几盘，每盘独立）
```

### 3.3 Dockerfile

**Dockerfile** 是一个文本文件，里面写了如何构建镜像的「步骤」。

#### 举例：后端 Dockerfile 长什么样？

```dockerfile
# 第1步：基于 Node.js 18 的镜像开始
FROM node:18-alpine

# 第2步：在容器里创建 /app 目录
WORKDIR /app

# 第3步：把 package.json 复制到容器里
COPY package*.json ./

# 第4步：安装依赖
RUN npm install

# 第5步：把全部源码复制到容器里
COPY . .

# 第6步：构建项目
RUN npm run build

# 第7步：暴露 3000 端口
EXPOSE 3000

# 第8步：启动命令
CMD ["node", "dist/main.js"]
```

#### 常用的 Dockerfile 指令

| 指令 | 作用 | 例子 |
|:----|:-----|:-----|
| `FROM` | 指定基础镜像 | `FROM node:18-alpine` |
| `WORKDIR` | 设置工作目录 | `WORKDIR /app` |
| `COPY` | 从宿主机复制文件到镜像 | `COPY package.json ./` |
| `RUN` | 在构建时执行命令 | `RUN npm install` |
| `EXPOSE` | 声明容器运行时监听的端口 | `EXPOSE 3000` |
| `CMD` | 容器启动时执行的命令 | `CMD ["npm", "start"]` |
| `ENV` | 设置环境变量 | `ENV NODE_ENV=production` |

### 3.4 容器与宿主机的文件/端口映射

容器是隔离的，容器里的文件和端口默认外面访问不到。需要用「映射」来打通。

```
┌─────────── 宿主机（你的电脑/服务器）──────────┐
│                                                │
│  端口 3000  ←映射→  容器端口 3000              │
│  端口 3306  ←映射→  容器内的 MySQL 3306        │
│                                                │
│  ./data/mysql  ←映射→  容器内的 /var/lib/mysql  │
│  （宿主机目录）        （容器内数据目录）         │
│                                                │
└────────────────────────────────────────────────┘
```

**为什么要做文件映射（Volume）？**

如果不做映射，容器删除后，里面的数据就全丢了。
做映射后，数据保存在宿主机上，容器删除重建数据还在。

```bash
# -p 端口映射：宿主机端口:容器端口
# -v 文件映射：宿主机目录:容器内目录
docker run -p 3306:3306 -v ./mysql-data:/var/lib/mysql mysql:8.0
```

---

## 4. Docker Compose 是什么？

**Docker Compose** 是一个用来定义和运行多个 Docker 容器的工具。

### 为什么要用 Compose？

你的项目需要同时启动 **5 个服务**：
- MySQL（数据库）
- Redis（缓存）
- MinIO（文件存储）
- backend（NestJS 后端）
- frontend（Vue 前端）

如果没有 Compose，你要手动执行 5 次 `docker run` 命令。
有了 Compose，一个命令就全部启动：

```bash
docker compose up -d  # -d 表示后台运行
```

### docker-compose.yml 文件结构

```yaml
version: '3.8'          # Compose 文件格式版本

services:
  mysql:                # 服务名称
    image: mysql:8.0    # 使用什么镜像
    container_name: music-edu-mysql  # 容器名称
    ports:
      - "3306:3306"     # 端口映射
    volumes:
      - mysql_data:/var/lib/mysql  # 数据持久化
    environment:        # 环境变量
      MYSQL_ROOT_PASSWORD: root123456
    restart: unless-stopped  # 宕机后自动重启

  backend:
    build: ./backend    # 使用 Dockerfile 构建
    ports:
      - "3000:3000"
    depends_on:         # 依赖关系（先启动 MySQL/Redis 再启动后端）
      - mysql
      - redis
    environment:
      DB_HOST: mysql    # 注意：这里填的是服务名，不是 localhost

volumes:                # 定义数据卷
  mysql_data:
  redis_data:
```

### 关键概念：容器间通信

在 Docker Compose 中，服务名就是主机名。

```
你的后端要连接数据库：
  - 开发环境：DB_HOST=localhost（你电脑本机）
  - Docker 环境：DB_HOST=mysql（Compose 里的服务名）

Docker 会为所有容器创建一个内部网络，
容器之间可以通过服务名互相访问。
```

---

## 5. 什么是部署？

**部署（Deployment）** 就是把你的应用放到**服务器**上，让互联网上的用户可以访问。

### 你现在在本地开发

```
你的电脑（localhost）
  └─ 后端: http://localhost:3000
  └─ 前端: http://localhost:5173
  └─ 数据库: localhost:3306

只有你自己能访问
```

### 部署到云服务器后

```
云服务器（公网 IP: 123.123.123.123）
  └─ 后端: http://123.123.123.123:3000
  └─ 前端: http://123.123.123.123
  └─ 数据库: 只在服务器内部访问，不对外暴露

全世界的用户都能访问
```

### 还需要一个域名

```
直接访问 IP 地址不好记，所以需要域名：

  用户访问: https://www.music-edu.com
  DNS 解析: www.music-edu.com → 123.123.123.123
  服务器: 处理请求并返回网页
  
  DNS = 电话本（把域名翻译成 IP 地址）
```

---

## 6. 本项目的完整部署架构

以下是你的项目在 Docker 环境下的完整架构图：

```
                           ┌─────────────┐
                           │  用户浏览器   │
                           └──────┬──────┘
                                  │
                            HTTPS（443端口）
                                  │
                    ┌─────────────▼─────────────┐
                    │      Nginx（反向代理）       │
                    │                            │
                    │  • 处理 HTTPS/SSL 证书      │
                    │  • 静态文件直接返回（前端）   │
                    │  • /api/* 转发到后端        │
                    │  • 负载均衡（可选）          │
                    └────────┬─────────┬────────┘
                             │         │
                    /api/*    │         │ 静态文件
                             │         │
              ┌──────────────▼──┐  ┌──▼──────────────┐
              │  NestJS 后端    │  │  Nginx 托管前端  │
              │  (端口 3000)    │  │  (Vue 构建产物)  │
              └──┬────┬────┬───┘  └─────────────────┘
                 │    │    │
           ┌─────▼┐ ┌▼───┐ ┌▼──────┐
           │ MySQL│ │Redis│ │ MinIO │
           │ 数据库│ │缓存 │ │文件存储│
           └──────┘ └────┘ └───────┘
```

### 为什么需要 Nginx？

1. **统一入口**：所有请求（前端页面 + API 请求）都走同一个域名
2. **HTTPS**：Nginx 负责处理 SSL 证书加密
3. **静态文件服务**：前端文件（HTML/CSS/JS）由 Nginx 直接返回，比 Node.js 快得多
4. **反向代理**：API 请求转发给后端，用户不需要知道后端地址

---

## 7. 部署到云服务器的全流程

### 第1步：购买云服务器

| 云服务商 | 最低配置推荐 | 预估费用 |
|:---------|:------------|:---------|
| **阿里云** ECS | 2核4G + 40GB SSD | 约 100-200元/月 |
| **腾讯云** CVM | 2核4G + 40GB SSD | 约 100-200元/月 |
| **华为云** ECS | 2核4G + 40GB SSD | 约 100-200元/月 |

> **省钱技巧**：新用户有优惠，首年可能只要几百块。也可以按量付费。

### 第2步：购买域名

在**阿里云万网**或**腾讯云 DNSPod** 购买域名，比如：
- `music-edu.com`（每年约 50-80元）
- `.cn` 后缀更便宜（约 30元/年）

### 第3步：配置 DNS

在域名管理后台，添加 DNS 解析记录：

```
www.music-edu.com → A记录 → 你的服务器公网 IP
```

> DNS 解析可能需要几分钟到几小时才能全球生效。

### 第4步：登录服务器配置

```bash
# 通过 SSH 登录服务器
ssh root@你的服务器IP

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
apt-get install docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

### 第5步：上传项目到服务器

```bash
# 方法1：通过 Git 拉取（推荐）
git clone https://github.com/你的账号/你的项目.git
cd 你的项目

# 方法2：通过 SCP 上传
scp -r ./你的项目 root@服务器IP:/root/
```

### 第6步：配置生产环境变量

```bash
# 复制并修改环境变量
cp backend/.env.example backend/.env

# 修改以下关键配置：
# DB_PASSWORD=复杂密码
# JWT_SECRET=随机字符串（不要用默认值）
# MINIO_SECRET_KEY=复杂密码
# ALIPAY_APP_ID=你的支付宝应用ID
# ALIPAY_PRIVATE_KEY=你的应用私钥
```

### 第7步：配置 HTTPS（SSL 证书）

```bash
# 使用 certbot 自动申请免费证书
apt-get install certbot
certbot --nginx -d www.music-edu.com

# 证书会自动更新，不用担心过期
```

### 第8步：启动所有服务

```bash
# 启动所有 Docker 容器
docker compose up -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 第9步：初始化数据库

```bash
# 运行数据库迁移
docker compose exec backend npm run migration:run

# 或者运行种子数据脚本
docker compose exec backend node scripts/seeds/create-accounts.js
```

### 第10步：访问验证

```
浏览器访问：https://www.music-edu.com

测试流程：
1. 注册账号 → 登录 → 浏览课程 → 购课 → 学习 → 评价
```

---

## 8. Nginx 是干什么的？

很多初学者搞不清 Nginx 的作用，这里详细解释。

### 场景：没有 Nginx

```
用户访问 http://服务器IP:5173 → 直接访问 Vue 开发服务器
用户访问 http://服务器IP:3000 → 直接访问 NestJS 后端

问题：
  1. 端口号不友好（用户不想记端口号）
  2. 两个服务两个地址，管理混乱
  3. 不能配置 HTTPS（开发服务器不支持）
  4. 静态文件服务效率低
```

### 场景：有 Nginx

```
用户访问 https://www.music-edu.com
  → Nginx 收到请求
  → 如果是静态文件（/assets/*），Nginx 直接返回
  → 如果是 API 请求（/api/*），Nginx 转发给后端 http://backend:3000
  → Nginx 统一处理 HTTPS 加密
  
用户只需要记住一个域名，不需要管端口号，不需要管后端地址。
```

### Nginx 配置示例

```nginx
server {
    listen 443 ssl;
    server_name www.music-edu.com;

    # SSL 证书配置
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        expires 7d;
    }

    # API 请求转发给后端
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件（超过1MB的请求需要单独配置）
    location ~ ^/uploads/ {
        proxy_pass http://backend:3000;
        client_max_body_size 2048M;  # 支持大文件上传
    }
}
```

---

## 9. HTTPS / SSL 证书是什么？

### 为什么需要 HTTPS？

```
HTTP（不安全）：
  ┌─用户─┐       ┌─中间人─┐       ┌─服务器─┐
  │ 密码  │──→    │ 看到了！│──→    │ 收到   │
  │ 123456│       │ 密码是  │       │ 密码   │
  └──────┘       │ 123456  │       └───────┘
                  └────────┘

HTTPS（安全）：
  ┌─用户─┐       ┌─中间人─┐       ┌─服务器─┐
  │ 密码  │──→    │ 看不懂！│──→    │ 解密后  │
  │ 123456│       │ 一堆乱码│       │ 收到   │
  └──────┘       │ ㊙️🤷‍♂️  │       │ 密码   │
                  └────────┘
```

简单说：HTTP 传输的数据是明文的，HTTPS 是加密的。

### SSL 证书是什么？

**SSL 证书** 是 HTTPS 的「通行证」，由**证书颁发机构（CA）**签发。

```
SSL 证书 = 数字身份证

作用：
  1. 加密数据（防止被窃听）
  2. 验证身份（证明你是这个域名的拥有者）
  
去哪申请：
  1. Let's Encrypt（免费，推荐）
  2. 阿里云/腾讯云免费证书
  3. 商业证书（几百到几千元/年）
```

### 如何获取免费证书？

```bash
# 最简单的方式：使用 certbot
certbot --nginx -d your-domain.com

# 它会自动：
# 1. 验证你拥有这个域名
# 2. 签发证书
# 3. 配置 Nginx
# 4. 设置自动续期（证书90天过期）
```

---

## 10. 面试演示方案：Tailscale Funnel 等内网穿透工具

### 需求场景

```
你想给面试官展示项目，但：
  ✅ 不想花钱买云服务器
  ✅ 不想配置域名和 SSL
  ✅ 只想在你自己电脑上运行，面试官能访问就行
```

### 解决方案对比

有几种方式可以让外网访问你本机开发环境：

| 方案 | 费用 | 难度 | 速度 | 适合场景 |
|:-----|:----|:-----|:-----|:---------|
| **Tailscale Funnel** | 免费 | ⭐ 极低 | ⭐⭐⭐ 快 | 面试演示、临时分享 |
| **ngrok** | 免费版有限额 | ⭐ 低 | ⭐⭐ 中等 | 临时分享、调试 |
| **Cloudflare Tunnel** | 免费（需自有域名） | ⭐⭐ 中等 | ⭐⭐⭐ 快 | 长期分享、生产环境 |
| **cpolar / frp** | 免费/付费 | ⭐⭐ 中等 | ⭐⭐ 中等 | 国内网络不好的场景 |
| **买云服务器部署** | 100-200元/月 | ⭐⭐⭐ 较高 | ⭐⭐⭐ 最快 | 正式上线 |

### Tailscale Funnel 详解（推荐）

**Tailscale** 是一个基于 WireGuard 的组网工具，可以把你所有的设备（电脑、手机、服务器）连接到一个虚拟的私有网络中。

**Tailscale Funnel** 是 Tailscale 的一个功能，它可以把你在本地运行的服务，通过 Tailscale 的节点暴露到公网上。

#### 工作原理

```
面试官浏览器                    Tailscale 边缘节点
┌────────────┐                ┌─────────────────┐
│ https://    │──── HTTPS ───→│  *.ts.net 域名   │
│ your-dev    │               │  SSL 证书自动处理 │
│ .ts.net     │               └────────┬────────┘
└────────────┘                        │
                         Tailscale  内部网络
                                      │
                            ┌─────────▼─────────┐
                            │   你的电脑          │
                            │  ┌──────────────┐  │
                            │  │ 前端 :5173   │  │
                            │  │ 后端 :3000   │  │
                            │  │ MySQL/Redis  │  │
                            │  └──────────────┘  │
                            └───────────────────┘
```

#### 优势

1. **免费**：个人使用完全免费，没有流量限制
2. **自带 HTTPS**：自动分配 `https://你的设备名.ts.net` 域名和 SSL 证书
3. **零配置**：安装登录后，一条命令暴露服务
4. **速度快**：基于 WireGuard，点对点直连（P2P），不走中转服务器
5. **安全**：仅暴露你指定的端口，不会暴露整个电脑
6. **跨平台**：Windows/Mac/Linux/手机都支持

#### 使用步骤

```bash
# 第1步：安装 Tailscale（Windows）
# 去 https://tailscale.com/download 下载安装包
# 安装后用微软/Google/GitHub 账号登录

# 第2步：验证 Tailscale 已连接（任务栏会显示图标）
tailscale status  # 查看连接的设备

# 第3步：用 Funnel 暴露前端（假设前端运行在 5173 端口）
tailscale funnel 5173

# 输出类似：
# Available at: https://your-device-name.ts.net/
# 把这个网址发给面试官就行！

# 第4步：同理暴露后端（在另一个终端窗口）
tailscale funnel 3000

# 面试官可以访问：
# https://your-device-name.ts.net/          → 前端页面
# https://your-device-name.ts.net:3000/      → 后端 API
```

> **注意**：你不需要 Funnel 暴露 MySQL、MinIO 这些，因为前端和后端在你自己电脑上能互相访问就行。Funnel 只需要暴露 Nginx 或前端的端口。

#### 快速演示脚本

你可以创建一个简单的启动脚本`start-demo.bat`，一键启动所有服务并暴露：

```batch
@echo off
echo === 启动演示环境 ===

REM 启动后端
start "Backend" cmd /c "cd /d %~dp0backend && npm run start:dev"

REM 启动前端
start "Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

REM 等待服务启动
timeout /t 10 /nobreak

REM 暴露前端
echo === 前端地址：===
echo 请在新终端运行：tailscale funnel 5173

pause
```

### 其他方案简介

#### ngrok（备选）

```
注册 ngrok 账号 → 下载安装 → 运行：

ngrok http 5173

输出：
Forwarding https://xxxx.ngrok.io → http://localhost:5173

优势：老牌工具，文档丰富
劣势：免费版有连接数限制，域名随机，每次重启变化
```

#### Cloudflare Tunnel（进阶）

```
需要你有自己的域名（可以买便宜域名）
配置 DNS 指向 Cloudflare
通过 cloudflared 创建隧道

优势：可以自定义域名、自带 DDoS 防护
劣势：配置稍复杂，需要域名
```

### 面试演示的推荐方案

```
┌──────────────────────────────────────────────────┐
│             面试演示最佳实践                      │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. 平时：在本机开发（localhost）                 │
│                                                  │
│  2. 面试前：                                    │
│     a. 启动所有服务（npm run dev 等）            │
│     b. 打开浏览器确认项目正常运行                 │
│     c. 执行 tailscale funnel 5173                │
│     d. 把 https://你设备名.ts.net 发给面试官     │
│                                                  │
│  3. 面试时：                                    │
│     a. 面试官可以直接访问你的本地项目             │
│     b. 你可以在本地实时修改代码，面试官立即看到   │
│     c. 面试结束后关闭 Funnel 即可                │
│                                                  │
│  4. 注意事项：                                   │
│     - 确保电脑不要休眠/关屏                      │
│     - 网络要稳定（面试官访问时需要你在线）        │
│     - 提前测试好，别等面试开始才配置              │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 为什么要学 Docker 部署？

虽然面试演示可以用 Tailscale Funnel，但如果你想在简历上写「有生产部署经验」，还是需要了解 Docker 部署：

| 面试场景 | 用什么 | 面试官想听 |
|:---------|:-------|:-----------|
| 展示项目功能 | Tailscale Funnel | 项目做得怎么样 |
| 回答「怎么部署的」 | Docker + 云服务器 | 你懂不懂生产环境 |
| 回答「遇到什么技术挑战」 | 部署经验+解决方案 | 你有解决实际问题的能力 |

> **建议**：Funnel 用来方便展示，但简历上还是写 Docker 部署经验更有分量。

---

## 11. 常见问题 FAQ

### Q1: Docker 和虚拟机有什么区别？

**Docker 容器**共享宿主机的操作系统内核，只隔离进程。
**虚拟机**每个都有独立的内核，相当于一台完整的电脑。

所以 Docker 更轻量、启动更快、资源占用更少。

### Q2: 部署一定要用 Docker 吗？

**不一定**。你也可以直接在服务器上安装 Node.js、MySQL、Redis 等软件，然后手动启动项目。

**但是用 Docker 的好处**：
- 服务器上不需要安装任何软件，只需要装 Docker
- 环境完全和开发环境一致
- 迁移服务器非常方便（把 docker-compose.yml 和配置复制过去就行）

### Q3: 部署到云服务器要花多少钱？

| 项目 | 费用 |
|:-----|:-----|
| 云服务器（2核4G） | 约 100-200元/月 |
| 域名 | 约 30-80元/年 |
| SSL 证书 | 免费 |
| 对象存储（可选） | 按量付费，小项目几乎不花钱 |
| **总计** | **约 100-200元/月 + 30-80元/年** |

### Q4: 部署后怎么更新代码？

```bash
# 登录服务器
ssh root@你的服务器IP

# 进入项目目录
cd /root/你的项目

# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build

# 搞定！
```

### Q5: 数据会丢吗？

**Docker 容器的数据默认会丢**，因为容器删除后数据就没了。

**解决方案**：使用 Volume 挂载（数据卷），把容器内的数据目录映射到宿主机上。

```yaml
volumes:
  - mysql_data:/var/lib/mysql  # 数据库数据保存在宿主机的 mysql_data 卷中
```

这样即使容器删除重建，数据还在。生产环境一定要配置好数据持久化。

### Q6: 备份数据怎么做？

```bash
# 备份 MySQL
docker compose exec mysql mysqldump -u root -p music_edu > backup.sql

# 备份 MinIO 文件
# 使用 MinIO Client 或直接备份数据卷目录

# 定期备份（推荐使用 crontab 定时任务）
# 每天早上3点备份
0 3 * * * cd /root/项目 && docker compose exec mysql mysqldump -u root -p密码 music_edu > /backup/$(date +\%Y\%m\%d).sql
```

### Q7: Docker 和 Tailscale Funnel 可以一起用吗？是不是更安全？

**可以，完全可以一起用，而且确实更安全。**

这是推荐的「面试演示最佳组合」：

```
你的电脑
┌──────────────────────────────────────────────────┐
│  Docker Compose 管理所有服务                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ MySQL    │  │ Redis    │  │ MinIO    │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│  ┌─────────────────────────────────────────┐      │
│  │   Nginx (统一入口, 端口 80)              │      │
│  │   ┌─ 前端静态文件                         │      │
│  │   └─ /api/* → 后端 :3000                 │      │
│  └─────────────────────────────────────────┘      │
└────────────────────┬─────────────────────────────┘
                     │ Tailscale Funnel 只暴露 Nginx 80 端口
                     │
            ┌────────▼────────┐
            │  Tailscale      │
            │  Funnel 80      │
            │  → *.ts.net     │
            └────────────────┘
```

**这样做的好处：**

| 层面 | 单独用 Funnel（无 Docker） | Docker + Funnel 一起用 |
|:-----|:--------------------------|:----------------------|
| **环境一致性** | 依赖你本机安装的软件版本 | 完全容器化，环境统一 |
| **安全性** | 暴露的是本机原生服务 | 暴露的是 Docker 容器，多了一层容器隔离 |
| **管理便捷性** | 要手动启动 5 个终端窗口 | 一条 `docker compose up` 全部搞定 |
| **面试官体验** | 需要暴露 5173 + 3000 两个端口 | 只暴露 Nginx 80 一个端口，统一入口 |
| **移植性** | 换个电脑要重新装软件 | 只要有 Docker 就能跑 |

**安全性提升的具体原因：**

```
仅用 Funnel（无 Docker）：
  面试官访问 → Funnel → 你的本机 5173 端口
  → 你的本机暴露在公网上，如果前端有漏洞，
    攻击者可能通过 5173 访问你的电脑文件

Docker + Funnel：
  面试官访问 → Funnel → 你的 Docker 容器
  → 请求被限制在容器内部，即使容器被攻破，
    攻击者也只控制了一个沙箱，接触不到你的电脑
```

**结论**：用 Docker 把服务容器化，然后用 Funnel 只暴露 Nginx 端口，是最安全、最规范的面试演示方式。面试官访问的是 `https://你的设备名.ts.net`（一个端口），体验和线上项目完全一样。

### Q8: 用 Docker 后，MySQL、MinIO 这些需要重新安装一次吗？

**不需要手动安装，Docker 会自动从镜像仓库下载。**

这里有三个关键概念你需要理解：

#### 概念1：Docker 容器与本机软件是「隔离」的

```
你的电脑
┌──────────────────────────────────────────────────┐
│  本机已安装的软件（跟 Docker 无关）               │
│  ├─ MySQL 8.0（你手动安装的）                    │
│  ├─ MinIO（你手动安装的）                        │
│  └─ Redis（你手动安装的）                        │
│                                                  │
│  Docker 容器（跟本机软件完全隔离）                 │
│  ├─ mysql:8.0 容器（自带的 MySQL，独立的）        │
│  ├─ minio/minio 容器（自带的 MinIO，独立的）      │
│  └─ redis:7-alpine 容器（自带的 Redis，独立的）   │
└──────────────────────────────────────────────────┘
```

- 你本机已经安装的 MySQL/MinIO 完全不受影响
- Docker 容器里的 MySQL/MinIO 是独立的实例
- 两者可以同时运行，互不干扰

#### 概念2：Docker 会自动下载镜像（不是手动安装）

```
你手动安装 MySQL 的步骤：
  1. 去 MySQL 官网下载安装包
  2. 双击安装下一步下一步
  3. 配置 root 密码
  4. 启动服务

Docker 启动 MySQL 的步骤（你的电脑上需要有 Docker）：
  docker compose up -d
  # Docker 会自动从官网下载 mysql:8.0 镜像
  # 然后自动创建并启动容器
  # 你不需要手动安装任何东西
```

你现有的 MySQL/MinIO 数据怎么处理？

```
方案一：完全用全新的 Docker 容器（推荐第一次用）
  - docker compose up 后会创建一个全新的空数据库
  - 你需要重新运行种子数据脚本（创建账号、课程等）

方案二：让 Docker 容器读取你本机已有的数据
  - 把本机 MySQL 数据目录映射到 Docker 容器
  - 例如：-v "C:\ProgramData\MySQL\Data:/var/lib/mysql"
  - 这样 Docker 容器会使用你已有的数据库数据

方案三：开发时用本机软件，部署时用 Docker
  - 本地开发：继续用你本机安装的 MySQL/MinIO
  - 面试演示/部署：用 docker compose 启动
  - 这是最简单的方式，不需要迁移数据
```

#### 结论

```
你现在的情况                推荐做法
────────────────────────────────────────────
本地开发（日常写代码）   继续用本机 MySQL/MinIO（不动）
面试演示（给面试官看）   docker compose up（全新容器）
生产部署（上云服务器）   docker compose up（全新容器）

你的本机软件不需要卸载，Docker 和本机软件可以共存。
```

### Q9: 部署后访问慢怎么办？

| 原因 | 解决方案 |
|:-----|:---------|
| 服务器配置太低 | 升级服务器 |
| 带宽不够 | 升级带宽（一般 5Mbps 起步） |
| 视频文件太大 | 使用 CDN 加速（如阿里云 CDN） |
| 没有缓存 | 使用 Redis 缓存 + Nginx 缓存静态文件 |
| 数据库查询慢 | 优化 SQL + 加索引 |

---

## 总结：一张图看懂

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker 体系                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────┐    ┌──────────┐    ┌──────────┐                   │
│  │Docker- │    │  镜像     │    │  容器     │                  │
│  │ file   │──→ │ (Image)  │──→ │(Container)│                  │
│  │(配方)  │    │ (模板)    │    │  (实例)   │                  │
│  └───────┘    └──────────┘    └──────────┘                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Docker Compose                          │     │
│  │  一键编排：MySQL + Redis + MinIO + 后端 + 前端      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        部署流程                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  面试演示：Tailscale Funnel → 一条命令暴露本地服务            │
│  (免费, 无需服务器, 自带 HTTPS)                              │
│                                                              │
│  生产部署：买服务器 → 装 Docker → 上传项目 → 配域名 →        │
│  HTTPS(免费) → docker compose up → 完成！                    │
│                                                              │
│  以后更新代码：git pull → docker compose up -d --build       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> **提示**：如果你已经理解了 Docker 和部署的基本概念，我们就可以正式开始 v5.2 的开发了。
