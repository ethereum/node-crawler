# Compile frontend
FROM node:18-alpine as builder
WORKDIR /app


COPY ./package.json package-lock.json ./
RUN npm install

COPY ./ ./
RUN echo '/v1/' >> .env && cp .env .env.local
RUN npm run build

# Copy compiled stuff to an alpine nginx image
FROM nginx:alpine

COPY --from=builder /app/build/ /usr/share/nginx/html
