# Backend Dockerfile
# Build context should be project root (.)
FROM node:20-alpine

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

