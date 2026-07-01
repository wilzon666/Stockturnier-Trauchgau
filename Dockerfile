# Multi-stage build for efficient container sizes
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for compilation)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Run the build script (runs vite build & esbuild server.ts compilation)
RUN npm run build

# --- Runtime Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Configure production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests for production dependencies
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --omit=dev

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create database directory with correct permissions for non-root user
RUN mkdir -p src/data && chown -R node:node /app

# Expose application port
EXPOSE 3000

# Run container as non-root node user for security
USER node

# Start the compiled CommonJS server
CMD ["node", "dist/server.cjs"]
