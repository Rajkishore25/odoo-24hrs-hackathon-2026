# ==========================================
# Stage 1: Build Vite React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Node.js + Prisma Backend
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 3: Production Runtime
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV FRONTEND_DIST_PATH=/app/frontend/dist

# Install openssl for Prisma runtime on Alpine
RUN apk add --no-cache openssl

# Copy root and backend configurations
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

# Copy backend node_modules and built dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy frontend static build assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

# Entrypoint runs migrations, optional seed, and starts full-stack service
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && cd .. && npm start"]
