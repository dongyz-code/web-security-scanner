FROM node:20-alpine3.20 AS base

ENV LANG=C.UTF-8
RUN sed -i 's/dl-cdn.alpinelinux.org/mirror.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update

RUN apk add --no-cache --update tzdata curl
ENV TZ=Asia/Shanghai



FROM base AS builder
WORKDIR /app
RUN apk update
RUN apk add --no-cache libc6-compat
RUN npm config set registry https://registry.npmmirror.com
RUN npm i -g turbo@2
COPY . .
RUN turbo prune @app/server --docker

FROM builder AS builder-next
WORKDIR /app
RUN apk update
RUN apk add --no-cache libc6-compat

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN npm config set registry https://registry.npmmirror.com
RUN npm i -g pnpm turbo@2
# ts 校验问题
RUN pnpm i

COPY --from=builder /app/out/full/ .
RUN pnpm turbo build --filter=@app/server

RUN pnpm rimraf node_modules
RUN pnpm i --prod

COPY ./server/static-data /app/static-data

FROM builder AS runner
WORKDIR /app
COPY --from=builder /app/ .
CMD ["node", "--max-old-space-size=16000", "apps/server/build/index.js"]
