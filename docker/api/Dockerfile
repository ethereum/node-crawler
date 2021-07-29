# Compile api
FROM golang:1.16-alpine AS go_builder
RUN apk add gcc musl-dev linux-headers git
RUN go get github.com/mattn/go-sqlite3
RUN git clone https://github.com/ethereum/node-crawler.git
WORKDIR /go/node-crawler/api
RUN go build ./ .

# Copy compiled stuff and run it
FROM golang:1.16-alpine
COPY --from=go_builder /go/node-crawler/api /api
ENTRYPOINT ["/api/node-crawler-backend"]
