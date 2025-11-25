# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy shared package first
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install && npm run build

# Copy backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

COPY backend .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

