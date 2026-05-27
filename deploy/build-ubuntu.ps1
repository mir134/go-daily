<#
.SYNOPSIS
   在 Windows 11 上使用 Docker 打包适用于 Ubuntu 的 go-daily 二进制
#>

# 设置 UTF-8 编码，避免中文乱码
$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::UTF8

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== go-daily 跨平台打包 (Windows → Ubuntu) ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 Docker，请先安装 Docker Desktop for Windows" -ForegroundColor Red
    exit 1
}

# 检查 Docker 是否运行
& cmd /c "docker info" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker 未运行，请启动 Docker Desktop" -ForegroundColor Red
    exit 1
}
$FrontendDir = Join-Path $ProjectRoot "frontend"
$EmbedDistDir = Join-Path $ProjectRoot "backend\internal\embed\frontend\dist"
Write-Host "[1/3] 构建前端 (vite build) $EmbedDistDir" -ForegroundColor Green

if (Test-Path $EmbedDistDir) {
    Remove-Item -Path "$EmbedDistDir\*" -Recurse -Force
    Write-Host "已清空 $EmbedDistDir" -ForegroundColor Yellow
}
Set-Location -LiteralPath $FrontendDir
npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "前端构建失败" -ForegroundColor Red
    exit 1
}

Write-Host "[2/3] 使用 Docker 构建 Linux 二进制..." -ForegroundColor Green

# 使用 buildx 构建 Linux amd64 二进制，直接输出到 dist/
# 多阶段构建，output type=local 会把 output 阶段的内容拷贝到本地
docker buildx build `
    --platform linux/amd64 `
    --target output `
    --output type=local,dest="$ProjectRoot\dist" `
    -f "$ProjectRoot\Dockerfile.build" `
    "$ProjectRoot"

if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败" -ForegroundColor Red
    exit 1
}

# 确认输出
$BinaryPath = Join-Path $ProjectRoot "dist\app"
if (Test-Path $BinaryPath) {
    $size = (Get-Item $BinaryPath).Length / 1MB
    Write-Host "[3/3] 构建成功!" -ForegroundColor Green
    Write-Host "  输出: $BinaryPath" -ForegroundColor Yellow
    Write-Host "  大小: $('{0:N1}' -f $size) MB" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "部署到 Ubuntu:" -ForegroundColor Cyan
    Write-Host "  1. 将 dist 目录传到 Ubuntu 服务器" -ForegroundColor White
    Write-Host "  2. 执行: sudo bash deploy/ubuntu-deploy-dist.sh /path/to/dist" -ForegroundColor White
} else {
    Write-Host "错误: 未找到构建产物" -ForegroundColor Red
    exit 1
}
