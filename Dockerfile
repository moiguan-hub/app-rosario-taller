FROM node:18-alpine AS builder
WORKDIR /app

# Definir los argumentos con sus valores por defecto
ARG _VITE_SUPABASE_URL="https://jjkubwujipqpjktqnvib.supabase.co"
ARG _VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3Vid3VqaXBxanBrdHFudmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzUxNjEsImV4cCI6MjEwMjgxMTE2MX0.anOVr6-C2Y9fw2oz7s0LYI8Z6q-bI9MbHP9wES8cgDg"

# Pasar los valores de los ARG a las variables ENV que espera Vite
ENV VITE_SUPABASE_URL=$_VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$_VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install
COPY . .

# Vite incluirá el contenido de ENV directamente en el bundle JS
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]