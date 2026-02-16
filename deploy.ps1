# 你画我猜 - 自动部署脚本 (PowerShell)
# 这个脚本会指导你完成 Render 和 Vercel 的部署

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   你画我猜游戏 - 自动部署助手" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查必要的工具
Write-Host "检查必要的工具..." -ForegroundColor Green
$toolsMissing = @()

# 检查 Git
try {
    git --version 2>&1 | Out-Null
    Write-Host "✅ Git 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装" -ForegroundColor Red
    $toolsMissing += "Git"
}

# 检查 Node.js
try {
    node --version 2>&1 | Out-Null
    Write-Host "✅ Node.js 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装" -ForegroundColor Red
    $toolsMissing += "Node.js"
}

# 检查 npm
try {
    npm --version 2>&1 | Out-Null
    Write-Host "✅ npm 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ npm 未安装" -ForegroundColor Red
    $toolsMissing += "npm"
}

if ($toolsMissing.Count -gt 0) {
    Write-Host "`n请先安装以下工具：" -ForegroundColor Red
    foreach ($tool in $toolsMissing) {
        Write-Host "  - $tool" -ForegroundColor Red
    }
    Write-Host "`n安装完成后重新运行此脚本。" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n所有必要工具都已安装 ✅" -ForegroundColor Green

# 显示当前状态
Write-Host "`n当前 Git 仓库状态：" -ForegroundColor Cyan
git status --short

Write-Host "`n选择部署方式：" -ForegroundColor Yellow
Write-Host "1. 手动部署（推荐新手）" -ForegroundColor White
Write-Host "2. 使用 CLI 工具自动部署（需要账号和 API 密钥）" -ForegroundColor White
Write-Host "3. 查看详细的部署指南" -ForegroundColor White

$choice = Read-Host "`n请选择 (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n==========================================" -ForegroundColor Cyan
        Write-Host "           手动部署指南" -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Cyan

        Write-Host "`n📋 第一步：部署后端到 Render" -ForegroundColor Green
        Write-Host "1. 访问 https://render.com" -ForegroundColor White
        Write-Host "2. 使用 GitHub 账号登录" -ForegroundColor White
        Write-Host "3. 点击 'New +' → 'Web Service'" -ForegroundColor White
        Write-Host "4. 选择你的 GitHub 仓库: Zeovv/draw-guess-game" -ForegroundColor White
        Write-Host "5. 重要配置：" -ForegroundColor White
        Write-Host "   - Root Directory: server (不是根目录!)" -ForegroundColor White
        Write-Host "   - Runtime: Node" -ForegroundColor White
        Write-Host "   - Build Command: npm install" -ForegroundColor White
        Write-Host "   - Start Command: node index.js" -ForegroundColor White
        Write-Host "   - Instance Type: Free" -ForegroundColor White
        Write-Host "6. 点击 'Create Web Service'" -ForegroundColor White
        Write-Host "7. 等待部署完成，复制后端 URL" -ForegroundColor White

        $backendUrl = Read-Host "`n请输入你的 Render 后端 URL (例如: https://draw-guess-server.onrender.com)"

        Write-Host "`n📋 第二步：部署前端到 Vercel" -ForegroundColor Green
        Write-Host "1. 访问 https://vercel.com" -ForegroundColor White
        Write-Host "2. 使用 GitHub 账号登录" -ForegroundColor White
        Write-Host "3. 点击 'Add New...' → 'Project'" -ForegroundColor White
        Write-Host "4. 选择你的 GitHub 仓库: Zeovv/draw-guess-game" -ForegroundColor White
        Write-Host "5. 重要配置：" -ForegroundColor White
        Write-Host "   - Root Directory: client (不是根目录!)" -ForegroundColor White
        Write-Host "   - Framework Preset: Vite" -ForegroundColor White
        Write-Host "6. 在项目设置中找到 'Environment Variables'" -ForegroundColor White
        Write-Host "7. 添加环境变量：" -ForegroundColor White
        Write-Host "   - Name: VITE_SERVER_URL" -ForegroundColor White
        Write-Host "   - Value: $backendUrl" -ForegroundColor White
        Write-Host "8. 点击 'Deploy'" -ForegroundColor White

        Write-Host "`n🎉 部署完成！" -ForegroundColor Green
        Write-Host "分享给好友：你的 Vercel 前端地址" -ForegroundColor Yellow
    }

    "2" {
        Write-Host "`n==========================================" -ForegroundColor Cyan
        Write-Host "       CLI 工具自动部署" -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Cyan

        Write-Host "`n需要先安装以下 CLI 工具：" -ForegroundColor Green
        Write-Host "1. Render CLI: npm install -g render-cli" -ForegroundColor White
        Write-Host "2. Vercel CLI: npm install -g vercel" -ForegroundColor White

        $installChoice = Read-Host "`n是否现在安装？ (y/n)"

        if ($installChoice -eq "y" -or $installChoice -eq "Y") {
            Write-Host "安装 Render CLI..." -ForegroundColor Cyan
            npm install -g render-cli

            Write-Host "安装 Vercel CLI..." -ForegroundColor Cyan
            npm install -g vercel

            Write-Host "`n请按照以下步骤登录：" -ForegroundColor Green
            Write-Host "1. 登录 Render: render login" -ForegroundColor White
            Write-Host "2. 登录 Vercel: vercel login" -ForegroundColor White

            $loginDone = Read-Host "`n登录完成后按 Enter 继续"

            Write-Host "`n开始部署后端到 Render..." -ForegroundColor Green
            Write-Host "执行: cd server && render blueprint create" -ForegroundColor White
            cd server
            render blueprint create

            Write-Host "`n开始部署前端到 Vercel..." -ForegroundColor Green
            cd ..\client
            Write-Host "执行: vercel --prod" -ForegroundColor White

            $backendUrl = Read-Host "`n请输入你的 Render 后端 URL"
            Write-Host "设置环境变量: vercel env add VITE_SERVER_URL" -ForegroundColor White
            vercel env add VITE_SERVER_URL $backendUrl

            Write-Host "`n🎉 部署完成！" -ForegroundColor Green
        }
    }

    "3" {
        Write-Host "`n打开详细的部署指南..." -ForegroundColor Green
        Start-Process "https://github.com/Zeovv/draw-guess-game/blob/main/DEPLOYMENT_GUIDE.md"
    }

    default {
        Write-Host "无效的选择，请重新运行脚本。" -ForegroundColor Red
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "     部署完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`n遇到问题？查看：DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host "GitHub 仓库：https://github.com/Zeovv/draw-guess-game" -ForegroundColor Yellow