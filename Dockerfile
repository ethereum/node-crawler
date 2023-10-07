# Compile api
FROM golang:1.21-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./ ./
RUN go build ./cmd/crawler


# Copy compiled stuff and run it
FROM alpine

COPY --from=builder /app/crawler /app/crawler

ENTRYPOINT ["/app/crawler"]
