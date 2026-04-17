# Stage 1: Build Angular app
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

# ✅ FIXED PATH (browser folder)
COPY --from=build /app/dist/quantity-ui/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]