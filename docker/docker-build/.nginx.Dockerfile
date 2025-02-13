FROM nginx:1.27-alpine-slim

ENV LANG=C.UTF-8
RUN sed -i 's/dl-cdn.alpinelinux.org/mirror.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Shanghai

COPY ./apps/client/dist /app/dist
COPY ./docker/docker-build/nginx/nginx.conf /etc/nginx/nginx.conf

