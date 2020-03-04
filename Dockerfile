FROM node:alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build/ /usr/share/nginx/html
COPY boot.sh /
RUN chmod +x /boot.sh && dos2unix /boot.sh
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
CMD ["/boot.sh"]
