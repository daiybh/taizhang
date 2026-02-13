## Multi-stage Dockerfile for building and running the server
FROM golang:1.21-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /src
COPY go.mod go.sum ./
RUN go env -w GOPROXY=https://goproxy.cn,direct || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/taizhang-server ./cmd

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /out/taizhang-server ./taizhang-server
COPY web ./web
COPY config ./config
RUN addgroup -S taizhang && adduser -S -G taizhang taizhang
RUN chown -R taizhang:taizhang /app
USER taizhang
EXPOSE 8080
ENTRYPOINT ["/app/taizhang-server"]
