# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy rest of the application source code
COPY . .

# Stage 2: Production stage (smaller final image)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .

# Expose the port the app runs on
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health/live || exit 1

# Start the application
CMD ["node", "src/index.js"]
