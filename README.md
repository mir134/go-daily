# 家庭健康记录 (Family Health Recorder)

慢病/透析患者每日状态观察系统。

## 快速开始

```bash
# 1. 安装依赖
make init

# 2. 构建单文件二进制（需设置登录密码）
APP_PASSWORD=your_password make build

# 3. 启动服务
./dist/app
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_PORT` | `8080` | 服务端口 |
| `APP_HOST` | `0.0.0.0` | 监听地址 |
| `APP_DB_PATH` | `./data/app.db` | SQLite 数据库路径 |
| `APP_PASSWORD` | （必填） | 登录密码 |

## 开发

在独立终端中分别运行：

```bash
# 终端 1：启动前端开发服务器
make dev-frontend

# 终端 2：启动后端开发服务器（支持热重载）
make dev-backend
```

## 构建

```bash
make build          # 构建当前平台
make build-win      # 构建 Windows AMD64
make build-linux    # 构建 Linux AMD64
make build-all      # 构建所有平台

# cmd 命令

$env:GOOS="windows"; $env:GOARCH="amd64"; go build -ldflags="-s -w" -o ../dist/app.exe ./cmd/server/

# 打包linux
$env:GOOS="linux"; $env:GOARCH="amd64"; go build -ldflags="-s -w" -o ../dist/app ./cmd/server/
```

## 技术栈

- **后端**: Go 1.21+, Gin, GORM, SQLite
- **前端**: React, TypeScript, Vite, TailwindCSS, Recharts
- **架构**: 单文件二进制（前端嵌入后端）