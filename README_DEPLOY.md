# 🚀 你画我猜 - 快速部署指南

## 📋 一键部署脚本

根据你的操作系统选择合适的脚本：

### Windows (PowerShell)
```powershell
# 运行部署助手
.\deploy.ps1
```

### Linux/macOS (Bash)
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署助手
./deploy.sh
```

## 🎯 最简单部署方法（5分钟完成）

### 第一步：部署后端到 Render（免费）
1. **访问** [https://render.com](https://render.com)
2. **登录** 使用 GitHub 账号
3. **创建服务** 点击 "New +" → "Web Service"
4. **连接仓库** 选择 `Zeovv/draw-guess-game`
5. **关键配置**：
   - **Root Directory**: `server` (必须选择这个！)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free
6. **点击** "Create Web Service"
7. **等待** 2-3分钟部署完成
8. **复制** 你的后端 URL (如 `https://xxx.onrender.com`)

### 第二步：部署前端到 Vercel（免费）
1. **访问** [https://vercel.com](https://vercel.com)
2. **登录** 使用 GitHub 账号
3. **导入项目** 点击 "Add New..." → "Project"
4. **连接仓库** 选择 `Zeovv/draw-guess-game`
5. **关键配置**：
   - **Root Directory**: `client` (必须选择这个！)
   - **Framework Preset**: Vite
6. **环境变量**：
   - 点击 "Environment Variables"
   - 添加新变量：
     - **Name**: `VITE_SERVER_URL`
     - **Value**: 你的 Render 后端 URL
7. **点击** "Deploy"
8. **等待** 1-2分钟部署完成
9. **复制** 你的前端 URL (如 `https://xxx.vercel.app`)

## 🎮 开始游戏！
将你的 Vercel 前端地址分享给好友，即可开始游戏：
```
https://你的项目名.vercel.app
```

## 🔧 配置文件说明

### `render.yaml` - Render 部署配置
```yaml
services:
  - type: web
    name: draw-guess-server
    env: node
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && node index.js
    envVars:
      - key: PORT
        value: 3001
      - key: NODE_ENV
        value: production
    healthCheckPath: /health
    autoDeploy: true
```

### `client/.env.example` - 前端环境变量
```env
# 后端服务器地址
VITE_SERVER_URL=http://localhost:3001
```

## ⚡ 技术栈
- **前端**: React 19 + Vite + Tailwind CSS + Framer Motion
- **后端**: Node.js + Express + Socket.io
- **部署**: Render (后端) + Vercel (前端)
- **实时通信**: WebSocket (Socket.io)

## 🛠️ 本地开发
```bash
# 启动后端
cd server && npm install && node index.js

# 启动前端
cd client && npm install && npm run dev
```

## 📱 功能特性
✅ **全新微信小游戏风格 UI** - 暖色调设计，移动端优先
✅ **实时多人游戏** - WebSocket 实时通信
✅ **响应式设计** - 手机、平板、电脑全适配
✅ **可爱头像** - DiceBear API 随机生成
✅ **流畅动画** - Framer Motion 交互体验
✅ **免费部署** - 完全免费托管方案

## ❓ 常见问题

### 1. Render 后端无法连接？
- 免费版有 15 分钟休眠机制
- 第一次访问需要 30-50 秒唤醒时间
- 这是正常现象，不是 bug

### 2. Socket 连接失败？
- 检查 `VITE_SERVER_URL` 是否正确设置
- 确保前后端 URL 匹配
- 清除浏览器缓存重试

### 3. 如何更新代码？
```bash
# 本地修改后
git add .
git commit -m "更新说明"
git push

# Render 和 Vercel 会自动重新部署
```

## 📞 技术支持
- **GitHub Issues**: [问题反馈](https://github.com/Zeovv/draw-guess-game/issues)
- **部署问题**: 查看 `DEPLOYMENT_GUIDE.md`

---

**🎉 现在就去部署吧！5分钟后就能和朋友一起玩了！**