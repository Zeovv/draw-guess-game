# 你画我猜 - 部署指南

## 部署架构
- **前端**: Vercel（免费）
- **后端**: Render（免费）

---

## 第一步：部署后端到 Render

### 1. 创建 GitHub 仓库
```bash
# 在项目根目录初始化 git
git init

# 添加 .gitignore（忽略 node_modules）
echo "node_modules/" > .gitignore
echo "dist/" >> .gitignore

# 提交代码
git add .
git commit -m "Initial commit"
```

然后在 GitHub 上创建一个新仓库，并推送代码：
```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 2. 登录 Render
访问 https://render.com 并使用 GitHub 账号登录

### 3. 创建新服务
1. 点击 **"New +"** → **"Web Service"**
2. 选择 **"Build and deploy from a Git repository"**
3. 选择你的 GitHub 仓库
4. **Root Directory**: 选择 `server` 文件夹
5. **Runtime**: Node
6. **Build Command**: `npm install`
7. **Start Command**: `node index.js`
8. **Instance Type**: Free（免费）
9. 点击 **"Create Web Service"**

### 4. 等待部署完成
部署完成后，Render 会给你一个 URL，例如：
```
https://draw-guess-server.onrender.com
```

**保存这个 URL！后面配置前端需要用到。**

---

## 第二步：部署前端到 Vercel

### 1. 登录 Vercel
访问 https://vercel.com 并使用 GitHub 账号登录

### 2. 创建新项目
1. 点击 **"Add New..."** → **"Project"**
2. 选择你的 GitHub 仓库
3. **Root Directory**: 选择 `client` 文件夹
4. 点击 **"Environment Variables"** 添加环境变量：
   - Name: `VITE_SERVER_URL`
   - Value: `https://你的render后端地址.onrender.com`
   - 然后点击 **"Save"**
5. 点击 **"Deploy"**

### 3. 等待部署完成
部署完成后，Vercel 会给你一个 URL，例如：
```
https://draw-guess-game.vercel.app
```

---

## 第三步：测试访问

1. 在浏览器中打开你的 Vercel 前端地址
2. 创建房间或加入房间
3. 在另一个浏览器窗口中打开相同地址
4. 测试多人联机功能

---

## 常见问题

### 1. Render 后端部署后无法连接？
Render 免费版有 15 分钟无活动会自动休眠，第一次请求可能需要 30-50 秒唤醒。

### 2. Socket 连接失败？
检查：
- `VITE_SERVER_URL` 是否正确设置为 Render 后端地址
- 后端 CORS 配置是否允许所有来源

### 3. 如何更新代码？
```bash
# 本地修改代码后
git add .
git commit -m "update"
git push

# Render 和 Vercel 会自动检测到更新并重新部署
```

### 4. Render 后端地址查看方法
登录 Render → 找到你的服务 → 点击进入 → 复制页面顶部的 URL

---

## 分享给好友
直接将 Vercel 前端地址发送给好友即可，例如：
```
https://draw-guess-game.vercel.app
```

好友可以在手机、平板或电脑上打开这个链接一起玩！
