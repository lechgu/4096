FROM node:alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM lechgu/dab

COPY --from=build /app/build/ /html

ENV DIR=/html
