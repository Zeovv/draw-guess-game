#!/bin/bash

# 你画我猜 - 自动部署脚本 (Linux/macOS)
# 这个脚本会指导你完成 Render 和 Vercel 的部署

echo "=========================================="
echo "   你画我猜游戏 - 自动部署助手"
echo "=========================================="
echo ""

# 检查必要的工具
echo "检查必要的工具..."
tools_missing=()

# 检查 Git
if command -v git &> /dev/null; then
    echo "✅ Git 已安装"
else
    echo "❌ Git 未安装"
    tools_missing+=("Git")
fi

# 检查 Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js 已安装"
else
    echo "❌ Node.js 未安装"
    tools_missing+=("Node.js")
fi

# 检查 npm
if command -v npm &> /dev/null; then
    echo "✅ npm 已安装"
else
    echo "❌ npm 未安装"
    tools_missing+=("npm")
fi

if [ ${#tools_missing[@]} -gt 0 ]; then
    echo -e "\n请先安装以下工具："
    for tool in "${tools_missing[@]}"; do
        echo "  - $tool"
    done
    echo -e "\n安装完成后重新运行此脚本。"
    exit 1
fi

echo -e "\n所有必要工具都已安装 ✅"

# 显示当前状态
echo -e "\n当前 Git 仓库状态："
git status --short

echo -e "\n选择部署方式："
echo "1. 手动部署（推荐新手）"
echo "2. 使用 CLI 工具自动部署（需要账号和 API 密钥）"
echo "3. 查看详细的部署指南"
echo -e "\n请选择 (1-3): "
read -r choice

case $choice in
    "1")
        echo -e "\n=========================================="
        echo "           手动部署指南"
        echo "=========================================="

        echo -e "\n📋 第一步：部署后端到 Render"
        echo "1. 访问 https://render.com"
        echo "2. 使用 GitHub 账号登录"
        echo "3. 点击 'New +' → 'Web Service'"
        echo "4. 选择你的 GitHub 仓库: Zeovv/draw-guess-game"
        echo "5. 重要配置："
        echo "   - Root Directory: server (不是根目录!)"
        echo "   - Runtime: Node"
        echo "   - Build Command: npm install"
        echo "   - Start Command: node index.js"
        echo "   - Instance Type: Free"
        echo "6. 点击 'Create Web Service'"
        echo "7. 等待部署完成，复制后端 URL"

        echo -e "\n请输入你的 Render 后端 URL (例如: https://draw-guess-server.onrender.com)"
        read -r backendUrl

        echo -e "\n📋 第二步：部署前端到 Vercel"
        echo "1. 访问 https://vercel.com"
        echo "2. 使用 GitHub 账号登录"
        echo "3. 点击 'Add New...' → 'Project'"
        echo "4. 选择你的 GitHub 仓库: Zeovv/draw-guess-game"
        echo "5. 重要配置："
        echo "   - Root Directory: client (不是根目录!)"
        echo "   - Framework Preset: Vite"
        echo "6. 在项目设置中找到 'Environment Variables'"
        echo "7. 添加环境变量："
        echo "   - Name: VITE_SERVER_URL"
        echo "   - Value: $backendUrl"
        echo "8. 点击 'Deploy'"

        echo -e "\n🎉 部署完成！"
        echo "分享给好友：你的 Vercel 前端地址"
        ;;

    "2")
        echo -e "\n=========================================="
        echo "       CLI 工具自动部署"
        echo "=========================================="

        echo -e "\n需要先安装以下 CLI 工具："
        echo "1. Render CLI: npm install -g render-cli"
        echo "2. Vercel CLI: npm install -g vercel"

        echo -e "\n是否现在安装？ (y/n)"
        read -r installChoice

        if [[ "$installChoice" == "y" || "$installChoice" == "Y" ]]; then
            echo "安装 Render CLI..."
            npm install -g render-cli

            echo "安装 Vercel CLI..."
            npm install -g vercel

            echo -e "\n请按照以下步骤登录："
            echo "1. 登录 Render: render login"
            echo "2. 登录 Vercel: vercel login"

            echo -e "\n登录完成后按 Enter 继续"
            read -r

            echo -e "\n开始部署后端到 Render..."
            echo "执行: cd server && render blueprint create"
            cd server
            render blueprint create

            echo -e "\n开始部署前端到 Vercel..."
            cd ../client
            echo "执行: vercel --prod"
            vercel --prod

            echo -e "\n请输入你的 Render 后端 URL"
            read -r backendUrl
            echo "设置环境变量: vercel env add VITE_SERVER_URL"
            vercel env add VITE_SERVER_URL "$backendUrl"

            echo -e "\n🎉 部署完成！"
        fi
        ;;

    "3")
        echo -e "\n打开详细的部署指南..."
        if command -v xdg-open &> /dev/null; then
            xdg-open "https://github.com/Zeovv/draw-guess-game/blob/main/DEPLOYMENT_GUIDE.md"
        elif command -v open &> /dev/null; then
            open "https://github.com/Zeovv/draw-guess-game/blob/main/DEPLOYMENT_GUIDE.md"
        else
            echo "请访问: https://github.com/Zeovv/draw-guess-game/blob/main/DEPLOYMENT_GUIDE.md"
        fi
        ;;

    *)
        echo "无效的选择，请重新运行脚本。"
        ;;
esac

echo -e "\n=========================================="
echo "     部署完成！"
echo "=========================================="
echo -e "\n遇到问题？查看：DEPLOYMENT_GUIDE.md"
echo "GitHub 仓库：https://github.com/Zeovv/draw-guess-game"