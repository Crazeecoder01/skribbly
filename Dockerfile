# Stage 1: Build
FROM node:20-alpine AS builder

# Set container working directory
WORKDIR /app

# Copy root package files and install deps
COPY package*.json ./
RUN npm install

# Copy only backend code and relevant files
COPY tsconfig.json ./
COPY apps/backend ./apps/backend

# Move into backend dir and build backend + generate Prisma
WORKDIR /app/apps/backend

RUN npx prisma generate
RUN npm run build:backend

# Stage 2: Run
FROM node:20-alpine

# Set container working directory
WORKDIR /app

# Copy production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built code and runtime files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/.env ./apps/backend/.env


# Start from inside backend directory
WORKDIR /app/apps/backend
# Generate Prisma client inside the final image
RUN npx prisma generate

# Expose port (change if different)
EXPOSE 4000

# Start backend (entry point must be valid!)
CMD ["node", "dist/server.js"]

