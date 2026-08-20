FROM node:18-alpine AS builder
WORKDIR /app

# Inyectar las claves reales directamente para que Vite las lea durante el build
ARG VITE_SUPABASE_URL="https://jjkubwujipqpjktqnvib.supabase.co"
ARG VITE_SUPABASE_ANON_KEY="sb_publishable_y3Yef1H270ba5Xk07B3RjA_jum6zW_w"

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]