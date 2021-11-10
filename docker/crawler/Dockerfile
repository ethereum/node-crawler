# Compile crawler 
FROM golang:1.16-alpine AS go_builder
RUN apk add gcc musl-dev linux-headers git
RUN git clone https://github.com/ethereum/node-crawler.git
WORKDIR /go/node-crawler/crawler
RUN go build 

# Copy compiled stuff and run it
FROM golang:1.16-alpine

COPY --from=go_builder /go/node-crawler/crawler/ /crawler 
ENTRYPOINT ["/crawler/crawler"]
