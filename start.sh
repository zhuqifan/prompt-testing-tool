#!/bin/bash

# 创建数据目录（如果不存在）
mkdir -p data

# 启动 Docker Compose
docker-compose up -d

echo "应用已启动！"
echo "访问地址: http://localhost:3001"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"

