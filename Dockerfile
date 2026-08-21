FROM node:18-alpine AS builder
WORKDIR /app

# Dominio de Supabase corregido (sin la 'p' extra)
ARG _VITE_SUPABASE_URL="https://jjkubwujipqjpktqnvib.supabase.co"
ARG _VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3Vid3VqaXBxanBrdHFudmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzUxNjEsImV4cCI6MjEwMjgxMTE2MX0.anOVr6-C2Y9fw2oz7s0LYI8Z6q-bI9MbHP9wES8cgDg"

# Mapeo a las variables de entorno de Vite
ENV VITE_SUPABASE_URL=$_VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$_VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]