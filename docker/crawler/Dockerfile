# Compile crawler 
FROM golang:1.16-alpine AS go_builder
RUN apk add gcc musl-dev linux-headers git
RUN git clone -b crawlercmd https://github.com/MariusVanDerWijden/go-ethereum.git 
WORKDIR /go/go-ethereum/cmd/devp2p
RUN go build 

# Copy compiled stuff and run it
FROM golang:1.16-alpine
COPY --from=go_builder /go/go-ethereum/cmd/devp2p /crawler 
ENTRYPOINT ["/crawler/devp2p"]
