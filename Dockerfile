# QuantPulse Multi-Stage Container Dockerfile
# Stage 1: Build the Web Dashboard
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runtime with Node.js & Python
FROM node:20-bullseye-slim
WORKDIR /app

# Install Python 3 for quantitative engine CLI & backtesting scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend and server
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/dist/server.js ./server.js 2>/dev/null || true
COPY server.ts ./
COPY src ./src
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY python_engine ./python_engine

# Install Python dependencies
RUN pip3 install --no-cache-dir -r python_engine/requirements.txt

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Runs full-stack server
CMD ["node", "dist/server.js"]
