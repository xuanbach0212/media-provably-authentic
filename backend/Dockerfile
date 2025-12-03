# Backend Dockerfile
# Build context should be project root (.)
FROM node:20-alpine

# Disable IPv6 to force IPv4 for all connections
RUN echo 'net.ipv6.conf.all.disable_ipv6 = 1' >> /etc/sysctl.conf || true

# Add network diagnostic tools
RUN apk add --no-cache curl bind-tools

WORKDIR /app

# Copy shared package first
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build

# Copy backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# Copy backend source (exclude dist and node_modules)
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

