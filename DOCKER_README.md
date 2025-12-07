# Docker 部署说明

本项目已配置为使用 Docker 容器运行，数据存储在 SQLite 数据库中。

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

应用将在 `http://localhost:3001` 启动。

### 使用 Docker 命令

```bash
# 构建镜像
docker build -t prompt-testing-tool .

# 运行容器
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  --name prompt-testing \
  prompt-testing-tool

# 查看日志
docker logs -f prompt-testing

# 停止容器
docker stop prompt-testing
docker rm prompt-testing
```

## 数据持久化

数据存储在 `./data/data.db` 文件中（通过 Docker volume 挂载）。

确保在运行容器时挂载数据目录：

```yaml
volumes:
  - ./data:/app/data
```

## 开发模式

如果需要本地开发：

```bash
# 启动后端 API 服务器
cd server
npm install
npm start

# 在另一个终端启动前端开发服务器
npm install
npm run dev
```

前端开发服务器会在 `http://localhost:3000` 启动，并自动代理 API 请求到 `http://localhost:3001`。

## 环境变量

- `PORT`: API 服务器端口（默认: 3001）
- `DB_PATH`: SQLite 数据库文件路径（默认: /app/data/data.db）
- `NODE_ENV`: 运行环境（production/development）

## 数据库

使用 SQLite 作为轻量级数据库，无需额外配置。数据库文件会自动创建在指定的 `DB_PATH` 位置。

## API 端点

- `GET /api/prompts/system` - 获取系统提示词列表
- `POST /api/prompts/system` - 保存系统提示词
- `DELETE /api/prompts/system/:id` - 删除系统提示词
- `PATCH /api/prompts/system/:id/title` - 更新系统提示词标题
- `PATCH /api/prompts/system/:id/favorite` - 切换系统提示词收藏状态

- `GET /api/prompts/user` - 获取用户提示词列表
- `POST /api/prompts/user` - 保存用户提示词
- `DELETE /api/prompts/user/:id` - 删除用户提示词
- `PATCH /api/prompts/user/:id/title` - 更新用户提示词标题
- `PATCH /api/prompts/user/:id/favorite` - 切换用户提示词收藏状态

- `GET /api/history` - 获取测试历史
- `POST /api/history` - 保存测试运行
- `DELETE /api/history/:id` - 删除历史记录
- `PATCH /api/history/:id/favorite` - 切换历史记录收藏状态

- `GET /api/settings/api-key` - 获取 API Key
- `POST /api/settings/api-key` - 保存 API Key

- `GET /api/health` - 健康检查

