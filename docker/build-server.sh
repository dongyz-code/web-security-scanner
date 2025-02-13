pnpm turbo build --filter=@app/server &&

docker build -t wsc-server:1.0.0 -f ./docker/docker-build/.server.Dockerfile .
