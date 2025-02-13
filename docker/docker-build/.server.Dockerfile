# 使用官方 Node.js 20 Alpine 版本
FROM node:20-alpine3.20 AS base

# 设置环境变量
ENV LANG=C.UTF-8
RUN sed -i 's/dl-cdn.alpinelinux.org/mirror.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 更新软件包索引并安装必要工具
RUN apk update && apk add --no-cache tzdata curl libc6-compat
ENV TZ=Asia/Shanghai


# ========================== 构建阶段 ==========================
FROM base AS builder
WORKDIR /app

# 设置 npm 镜像加速 & 安装 turbo
RUN npm config set registry https://registry.npmmirror.com
RUN npm i -g turbo@2 pnpm

# 复制代码并执行 prune 以优化依赖
COPY . .
RUN turbo prune @app/server --docker

# ========================== 编译阶段 ==========================
FROM builder AS build-stage
WORKDIR /app

# 复制 pruned 之后的文件
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 安装 pnpm 依赖
RUN pnpm i
# 复制完整项目文件
COPY --from=builder /app/out/full/ .
# 运行构建
RUN pnpm turbo build --filter=@app/server

# 删除开发依赖，减少镜像体积
RUN pnpm prune --production

# 拷贝静态资源
COPY ./apps/server/static-data /app/static-data


# ========================== 运行阶段 ==========================
FROM base AS runner
WORKDIR /app

# 复制构建后的产物
COPY --from=build-stage /app/ .

# 确保可执行文件存在
RUN ls -la apps/server/build

# 启动应用
CMD ["node", "--max-old-space-size=16000", "apps/server/build/index.js"]
