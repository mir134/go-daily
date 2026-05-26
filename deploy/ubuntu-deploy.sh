#!/usr/bin/env bash
set -euo pipefail

APP_NAME="go-daily"
APP_USER="go-daily"
APP_GROUP="go-daily"
INSTALL_DIR="/opt/${APP_NAME}"
DATA_DIR="/var/lib/${APP_NAME}"
CONFIG_DIR="/etc/${APP_NAME}"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"

if [ "$(id -u)" -ne 0 ]; then
  echo "请以 root 身份运行: sudo bash ubuntu-deploy.sh"
  exit 1
fi

echo "=== 家庭健康记录 - Ubuntu 22.04 部署脚本 ==="

# --- Prerequisites ---
echo "[1/7] 检查并安装依赖..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git build-essential rsync

if ! command -v go &>/dev/null; then
  echo "  安装 Go 1.21..."
  wget -q https://go.dev/dl/go1.21.10.linux-amd64.tar.gz -O /tmp/go.tar.gz
  rm -rf /usr/local/go
  tar -C /usr/local -xzf /tmp/go.tar.gz
  rm /tmp/go.tar.gz
  ln -sf /usr/local/go/bin/go /usr/local/bin/go
fi
GO_VER=$(go version 2>/dev/null | grep -oP 'go\K[0-9]+\.[0-9]+')
echo "  Go 版本: ${GO_VER}"

if ! command -v node &>/dev/null; then
  echo "  安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
NODE_VER=$(node -v 2>/dev/null)
echo "  Node.js 版本: ${NODE_VER}"

# --- Create user & directories ---
echo "[2/7] 创建用户和目录..."
id -u ${APP_USER} &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin ${APP_USER}
mkdir -p ${INSTALL_DIR} ${DATA_DIR} ${CONFIG_DIR} ${INSTALL_DIR}/src

# --- Clone source ---
echo "[3/7] 拉取源码..."
if [ -d "${INSTALL_DIR}/src/.git" ]; then
  cd ${INSTALL_DIR}/src && git pull
else
  cd /tmp && rm -rf ${APP_NAME}
  git clone https://github.com/mir134/go-daily.git /tmp/${APP_NAME}
  rsync -a --delete /tmp/${APP_NAME}/ ${INSTALL_DIR}/src/
  rm -rf /tmp/${APP_NAME}
fi

# --- Build frontend ---
echo "[4/7] 构建前端..."
cd ${INSTALL_DIR}/src/frontend
npm ci --omit=dev
npm run build

# --- Build Go binary ---
echo "[5/7] 编译后端二进制..."
cd ${INSTALL_DIR}/src/backend
CGO_ENABLED=1 go build -ldflags="-s -w" -o ${INSTALL_DIR}/${APP_NAME} ./cmd/server/
chmod +x ${INSTALL_DIR}/${APP_NAME}

# --- Configuration ---
echo "[6/7] 配置..."
if [ ! -f "${CONFIG_DIR}/config.yaml" ]; then
  cat > ${CONFIG_DIR}/config.yaml << 'YAML'
server:
  port: 8080
  host: "0.0.0.0"
database:
  path: "/var/lib/go-daily/app.db"
app:
  password: ""
YAML
  echo "  config.yaml 已生成, 请编辑 ${CONFIG_DIR}/config.yaml 设置 app.password"
else
  echo "  config.yaml 已存在, 跳过"
fi

# .env file for env var overrides
if [ ! -f "${CONFIG_DIR}/.env" ]; then
  cat > ${CONFIG_DIR}/.env << 'ENV'
APP_PORT=8080
APP_HOST=0.0.0.0
APP_DB_PATH=/var/lib/go-daily/app.db
# APP_PASSWORD=your_password_here
ENV
fi

# --- Systemd service ---
echo "[7/7] 注册 systemd 服务..."
cat > ${SERVICE_FILE} << SERVICE
[Unit]
Description=家庭健康记录服务 - go-daily
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/${APP_NAME} -config ${CONFIG_DIR}/config.yaml
EnvironmentFile=${CONFIG_DIR}/.env
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
SERVICE

# Fix permissions
chown -R ${APP_USER}:${APP_GROUP} ${INSTALL_DIR} ${DATA_DIR} ${CONFIG_DIR}
chmod 750 ${CONFIG_DIR} ${DATA_DIR}
chmod 640 ${CONFIG_DIR}/config.yaml ${CONFIG_DIR}/.env

systemctl daemon-reload
systemctl enable ${APP_NAME}

echo ""
echo "=== 部署完成 ==="
echo ""
echo "编辑配置:  nano ${CONFIG_DIR}/config.yaml"
echo "            nano ${CONFIG_DIR}/.env"
echo "启动服务:   systemctl start ${APP_NAME}"
echo "查看状态:   systemctl status ${APP_NAME}"
echo "查看日志:   journalctl -u ${APP_NAME} -f"
echo "重启服务:   systemctl restart ${APP_NAME}"
echo ""
echo "服务默认监听 :8080, 通过环境变量 APP_PORT 修改"
echo "请务必设置 APP_PASSWORD 后启动服务"
