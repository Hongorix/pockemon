FROM node:22-alpine AS backend

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

EXPOSE 3000
CMD ["npm", "run", "start:dev"]


FROM node:22-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
