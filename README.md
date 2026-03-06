# 🎨 Draw & Guess Online | 你画我猜在线版

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.2.0-blue)](https://react.dev/)
[![Socket.io](https://img.shields.io/badge/socket.io-4.8.3-orange)](https://socket.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Vite](https://img.shields.io/badge/vite-7.3.1-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-3.4.1-38B2AC)](https://tailwindcss.com/)

一个基于现代 Web 技术的实时多人"你画我猜"游戏，支持移动端/PC端跨平台游玩，具有微信小游戏风格的可爱界面和流畅的实时画板同步体验。

## ✨ 在线演示

**🎮 立即试玩**: [https://draw-guess-game.vercel.app](https://draw-guess-game.vercel.app) or [https://www.ydig.fun/](https://www.ydig.fun/)

> ⚠️ **注意**: 首次访问需要等待 Render 免费实例启动（约 30-60 秒），后端休眠后再次访问也会有类似等待时间。

## 🎮 核心特性

### 🎨 **实时画板同步**
- 基于 WebSocket (Socket.io) 的毫秒级画板同步
- 支持 PC 端鼠标绘制和移动端触屏操作
- 相对坐标系 (0-1) 算法，确保不同尺寸屏幕看到的画作完全一致
- 移动端防误触优化，提供流畅的绘画体验

### 📱 **多端完美适配**
- 移动端优先的响应式设计
- 自适应不同屏幕尺寸和方向
- 触摸手势优化，支持缩放和精细绘制
- 统一的视觉体验，无论是手机、平板还是电脑

### 🎮 **完整游戏循环**
1. **大厅准备**: 创建房间或加入好友房间
2. **选词阶段**: 随机分配绘画词汇，支持"换一换"功能
3. **绘画/竞猜**: 90秒倒计时，绘画者作画，其他玩家竞猜
4. **计分结算**: 答对得分 + 礼花庆祝，进入下一轮

### 💡 **智能辅助系统**
- **渐进式提示**: 随时间推移自动解锁线索
- **智能词汇库**: 9大类精心挑选的词汇（成语、网络热梗、著名菜肴、书籍名称等）
- **答题统计**: 实时显示猜对人数和剩余时间

### 🎉 **沉浸式交互体验**
- **礼花特效**: 答对时触发 Canvas Confetti 庆祝动画
- **弹幕聊天**: 聊天消息支持弹幕飘屏效果
- **可爱头像**: 使用 DiceBear API 生成随机卡通头像
- **流畅动画**: Framer Motion 驱动的交互动效

### 🛡️ **稳定可靠**
- **房间管理**: 支持自建房、房间号邀请、断线重连
- **错误处理**: 优雅的断线重连和错误恢复机制
- **健康检查**: 后端服务健康监控端点
- **CORS 安全**: 完整的跨域安全配置

## 🛠️ 技术栈

### 前端 (Client)
- **React 19** - 现代化 UI 框架
- **Vite** - 极速构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Socket.io-client** - 实时双向通信
- **Framer Motion** - 丝滑动画库
- **Canvas Confetti** - 庆祝特效
- **Lucide React** - 精美图标库
- **DiceBear API** - 随机头像生成

### 后端 (Server)
- **Node.js** + **Express** - 服务器框架
- **Socket.io** - WebSocket 实时通信
- **CORS** - 跨域资源共享
- **Nodemon** - 开发热重载


## 📁 项目结构

```
draw-guess-game/
├── client/                    # 前端 React 应用
│   ├── src/
│   │   ├── App.jsx           # 主应用组件（游戏逻辑）
│   │   ├── App.css           # 应用样式
│   │   ├── index.css         # 全局 Tailwind 样式
│   │   ├── main.jsx          # 应用入口
│   │   ├── socket.js         # Socket.io 客户端配置
│   │   └── assets/           # 静态资源
│   ├── public/               # 公共资源
│   ├── dist/                 # 构建输出
│   ├── .env.example          # 环境变量示例
│   ├── package.json          # 前端依赖
│   ├── vite.config.js        # Vite 配置
│   ├── tailwind.config.js    # Tailwind 配置
│   └── vercel.json           # Vercel 部署配置
├── server/                   # 后端 Node.js 服务
│   ├── index.js              # 主服务器文件（游戏逻辑）
│   ├── words.js              # 词汇库（9大类词汇）
│   ├── .env.example          # 环境变量示例
│   └── package.json          # 后端依赖
├── render.yaml              # Render 部署配置
├── deploy.sh               # Linux/macOS 部署脚本
├── deploy.ps1              # Windows 部署脚本
├── README_DEPLOY.md        # 快速部署指南
├── DEPLOYMENT_GUIDE.md     # 详细部署指南
└── .gitignore             # Git 忽略配置
```

## 🎯 游戏玩法

1. **创建房间**: 点击"创建房间"按钮，设置房间名称
2. **邀请好友**: 分享房间号给朋友，他们输入房间号即可加入
3. **准备游戏**: 所有玩家点击"准备"按钮
4. **开始游戏**: 系统随机选择绘画者和词汇
5. **绘画阶段**: 绘画者有 90 秒时间用画板描绘词汇
6. **竞猜阶段**: 其他玩家在聊天框输入答案
7. **计分结算**: 答对玩家获得分数，触发庆祝特效
8. **下一轮**: 系统自动选择新的绘画者，继续游戏

## 🎨 词汇库分类

游戏包含 9 大类精心挑选的词汇：
1. **成语类** - 经典成语和俗语
2. **网络热梗** - 当前流行的网络用语
3. **著名菜肴** - 中外知名美食
4. **书籍名称** - 经典文学作品和畅销书
5. **地名/景点** - 著名旅游景点和城市地标
6. **电影/电视剧** - 热门影视作品
7. **名人/历史人物** - 影视音乐体育明星和历史人物
8. **科技产品/品牌** - 知名科技产品和品牌
9. **游戏/动漫** - 热门游戏和动漫作品

### 贡献指南
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 致谢

- [Socket.io](https://socket.io/) - 实时通信库
- [Vite](https://vitejs.dev/) - 前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [DiceBear](https://dicebear.com/) - 头像生成 API
- [Canvas Confetti](https://www.kirilv.com/canvas-confetti/) - 庆祝特效
- [Render](https://render.com/) & [Vercel](https://vercel.com/) - 免费云托管服务

## 📞 支持与反馈

遇到问题或有建议？请通过以下方式联系：

1. 在 GitHub 仓库提交 [Issue](https://github.com/Zeovv/draw-guess-game/issues)
2. 查看详细部署指南 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. 参考快速部署指南 [README_DEPLOY.md](README_DEPLOY.md)

---

**祝你玩得开心！** 🎨✨

> 🚀 项目持续更新中，欢迎 Star 和 Fork！
