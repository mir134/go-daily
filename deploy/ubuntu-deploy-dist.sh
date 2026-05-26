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
  echo "请以 root 身份运行: sudo bash ubuntu-deploy-dist.sh"
  exit 1
fi

echo "=== 家庭健康记录 - Ubuntu 22.04 部署脚本 (dist 版) ==="

# --- 参数 ---
SRC_DIR="${1:-./dist}"
if [ ! -f "${SRC_DIR}/app" ]; then
  echo "用法: sudo bash $0 <dist目录>"
  echo "示例: sudo bash $0 /path/to/dist"
  echo ""
  echo "错误: ${SRC_DIR}/app 不存在"
  echo "请将打包后的 dist 目录传入, 确保包含:"
  echo "  dist/app          - Linux amd64 可执行文件"
  echo "  dist/config.yaml  - 配置文件"
  exit 1
fi

# --- 创建用户和目录 ---
echo "[1/3] 创建用户和目录..."
id -u ${APP_USER} &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin ${APP_USER}
mkdir -p ${INSTALL_DIR} ${DATA_DIR} ${CONFIG_DIR}

# --- 部署二进制和配置 ---
echo "[2/3] 部署程序..."
cp -f "${SRC_DIR}/app" "${INSTALL_DIR}/${APP_NAME}"
chmod 755 "${INSTALL_DIR}/${APP_NAME}"

if [ -f "${SRC_DIR}/config.yaml" ]; then
  cp -f "${SRC_DIR}/config.yaml" "${CONFIG_DIR}/config.yaml"
fi
if [ ! -f "${CONFIG_DIR}/config.yaml" ]; then
  # 生成默认配置
  cat > ${CONFIG_DIR}/config.yaml << 'YAML'
server:
  port: 8080
  host: "0.0.0.0"
database:
  path: "/var/lib/go-daily/app.db"
app:
  password: ""
YAML
fi

# .env (环境变量覆盖)
if [ ! -f "${CONFIG_DIR}/.env" ]; then
  cat > ${CONFIG_DIR}/.env << 'ENV'
APP_PORT=8080
APP_HOST=0.0.0.0
APP_DB_PATH=/var/lib/go-daily/app.db
# APP_PASSWORD=your_password_here
ENV
fi

# --- 注册 systemd 服务 ---
echo "[3/3] 注册 systemd 服务..."
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
echo "请务必设置 APP_PASSWORD 后启动服务"
