# Compile frontend 
FROM node:16-alpine as npm_builder
RUN apk add git
RUN git clone https://github.com/ethereum/node-crawler.git
WORKDIR ./node-crawler/frontend
RUN  echo localhost:10000 >> .env && cp .env .env.local
RUN npm install && npm run build

# Copy compiled stuff to an alpine nginx image
FROM nginx:1.21.1-alpine
COPY --from=npm_builder /node-crawler/frontend/build/ /usr/share/nginx/html

