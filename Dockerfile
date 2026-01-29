# Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port (Cloud Run sets this env var, default 8080)
ENV PORT=8080
EXPOSE 8080

# Start the server listening on $PORT
CMD ["sh", "-c", "serve -s dist -l $PORT"]
