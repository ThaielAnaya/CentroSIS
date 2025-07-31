# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci

# sources
COPY . .

# compile with a backend-ready URL
ARG VITE_API_BASE=http://backend:8000/api        # ← injected from compose
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build            # → /app/dist
# ---------- runtime stage ----------
FROM nginx:stable-alpine
# simple SPA config: always hand off to index.html
RUN rm /etc/nginx/conf.d/default.conf \
 && printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  try_files $uri /index.html;\n}\n' \
    > /etc/nginx/conf.d/spa.conf

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
