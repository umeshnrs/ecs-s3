# Frontend Dockerfile for development
FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source files
COPY . .

# Expose port
EXPOSE 5173

# Start dev server
CMD ["npm", "run", "dev", "--", "--host"]

