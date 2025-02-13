pnpm turbo build --filter=./apps/client &&

docker build -t wsc-nginx:1.0.0 -f ./docker/docker-build/.nginx.Dockerfile .
