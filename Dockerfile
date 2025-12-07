# 构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY vite.config.ts tsconfig.json ./
COPY index.html index.tsx App.tsx types.ts ./
COPY components ./components
COPY services ./services
RUN npm ci
RUN npm run build

# 运行后端 + 前端
FROM node:20-alpine
WORKDIR /app

# 安装系统依赖（better-sqlite3 需要）
RUN apk add --no-cache python3 make g++

# 复制后端代码
COPY server/package.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# 复制前端构建产物
WORKDIR /app
COPY --from=frontend-builder /app/dist ./dist

# 复制后端代码
COPY server/index.js server/database.js ./server/

# 创建数据目录
RUN mkdir -p /app/data

# 设置环境变量
ENV PORT=3001
ENV DB_PATH=/app/data/data.db
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3001

# 修改后端服务器以同时提供前端静态文件
WORKDIR /app/server
# 更新 index.js 以提供静态文件服务（在 server/index.js 中处理）
CMD ["node", "index.js"]

