import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, Eraser, Trash2, Send, Copy, Users, Clock,
  Palette, X, Smile, LogOut, Volume2, VolumeX
} from 'lucide-react';
import socket from './socket';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 工具函数：合并 className
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 生成随机头像颜色
function getAvatarColor(nickname) {
  const colors = [
    'from-pink-400 to-pink-500',
    'from-purple-400 to-purple-500',
    'from-blue-400 to-blue-500',
    'from-green-400 to-green-500',
    'from-yellow-400 to-yellow-500',
    'from-orange-400 to-orange-500',
    'from-cyan-400 to-cyan-500',
    'from-indigo-400 to-indigo-500',
  ];
  const index = nickname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// 画笔颜色配置
const brushColors = [
  { color: '#000000', name: '黑色' },
  { color: '#ffffff', name: '白色' },
  { color: '#ef4444', name: '红色' },
  { color: '#f97316', name: '橙色' },
  { color: '#eab308', name: '黄色' },
  { color: '#22c55e', name: '绿色' },
  { color: '#3b82f6', name: '蓝色' },
  { color: '#8b5cf6', name: '紫色' },
  { color: '#ec4899', name: '粉色' },
  { color: '#14b8a6', name: '青色' },
  { color: '#78716c', name: '棕色' },
  { color: '#fbbf24', name: '金色' },
];

// 画笔粗细选项
const brushSizes = [2, 4, 6, 8, 12, 16, 20];

function App() {
  // ========== 页面状态 ==========
  const [page, setPage] = useState('login'); // 'login' | 'game'

  // ========== 登录页状态 ==========
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');

  // ========== 游戏页状态 ==========
  const [isDrawer, setIsDrawer] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState([]);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [copied, setCopied] = useState(false);

  // ========== Canvas 相关 ==========
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // ========== 画笔设置 ==========
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushSizePicker, setShowBrushSizePicker] = useState(false);

  // ========== 业务逻辑函数 ==========

  // 加入房间
  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      alert('请输入昵称');
      return;
    }
    if (!roomId.trim()) {
      alert('请输入房间号');
      return;
    }
    socket.emit('join_room', { roomId, nickname });
    setPage('game');
  };

  // 创建房间（随机生成房间号）
  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      alert('请输入昵称');
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    socket.emit('join_room', { roomId: newRoomId, nickname });
    setPage('game');
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    socket.emit('send_message', {
      roomId,
      message: messageInput,
      nickname,
    });
    setMessageInput('');
  };

  // 清空画布
  const handleClearCanvas = () => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit('clear_canvas', { roomId });
    }
  };

  // 复制房间号
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 获取 Canvas 坐标
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // 绘制线条
  const drawLine = (startX, startY, endX, endY, color, lineWidth) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  // 鼠标/触摸事件处理
  const handleStart = (e) => {
    if (!isDrawer) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
  };

  const handleMove = (e) => {
    if (!isDrawer || !isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const { x: endX, y: endY } = coords;
    const { x: startX, y: startY } = lastPosRef.current;

    // 本地绘制
    drawLine(startX, startY, endX, endY, brushColor, brushSize);

    // 广播给其他玩家
    socket.emit('draw_line', {
      roomId,
      startX,
      startY,
      endX,
      endY,
      color: brushColor,
      lineWidth: brushSize,
    });

    lastPosRef.current = coords;
  };

  const handleEnd = () => {
    isDrawingRef.current = false;
  };

  // Canvas 自适应大小
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  };

  // ========== Socket 事件监听 ==========
  useEffect(() => {
    // 角色分配
    socket.on('role_assigned', ({ isDrawer: assigned }) => {
      setIsDrawer(assigned);
    });

    // 接收消息
    socket.on('receive_message', ({ message, nickname, timestamp }) => {
      setMessages((prev) => [...prev, { message, nickname, timestamp }]);
    });

    // 用户加入
    socket.on('user_joined', ({ users: newUsers, message }) => {
      setUsers(newUsers);
      setMessages((prev) => [...prev, { message, isSystem: true }]);
    });

    // 用户离开
    socket.on('user_left', ({ users: newUsers, message }) => {
      setUsers(newUsers);
      setMessages((prev) => [...prev, { message, isSystem: true }]);
    });

    // 接收画笔路径
    socket.on('draw_line', ({ startX, startY, endX, endY, color, lineWidth }) => {
      drawLine(startX, startY, endX, endY, color, lineWidth);
    });

    // 清空画布
    socket.on('clear_canvas', () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      socket.off('role_assigned');
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('draw_line');
      socket.off('clear_canvas');
    };
  }, [roomId]);

  // 初始化 Canvas 大小
  useEffect(() => {
    if (page === 'game') {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [page]);

  // 消息滚动到底部
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  // ========== 登录页 ==========
  if (page === 'login') {
    return (
      <div className="doodle-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* 装饰元素 */}
        <motion.div
          className="absolute top-20 left-20 w-16 h-16 rounded-full bg-gradient-to-br from-pink-300 to-pink-400 opacity-30"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-32 w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-purple-400 opacity-30"
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 left-40 w-20 h-20 rounded-full bg-gradient-to-br from-blue-300 to-blue-400 opacity-30"
          animate={{
            y: [0, -25, 0],
            rotate: [0, -180, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-14 h-14 rounded-full bg-gradient-to-br from-green-300 to-green-400 opacity-30"
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* 主卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-3d w-full max-w-md p-8 md:p-10"
        >
          {/* Logo */}
          <motion.div
            className="text-center mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
          >
            <motion.div
              className="inline-block mb-4"
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              <Palette className="w-20 h-20 text-pink-500 mx-auto" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2">
              你画我猜
            </h1>
            <p className="text-gray-500 text-base">和朋友们一起开心画画吧~</p>
          </motion.div>

          {/* 输入区域 */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Smile className="w-4 h-4" />
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="起个可爱的名字~"
                className="input-doodle"
                maxLength={12}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                房间号
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="输入房间号（可选）"
                className="input-doodle"
                maxLength={6}
              />
            </motion.div>

            <div className="space-y-3 pt-2">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                className="btn-3d btn-pink w-full py-4 text-lg font-bold rounded-2xl"
              >
                ✨ 创建房间 ✨
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                className="btn-3d btn-purple w-full py-4 text-lg font-bold rounded-2xl"
              >
                🚀 加入房间 🚀
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========== 游戏页 ==========
  return (
    <div className="doodle-bg h-screen flex flex-col">
      {/* 顶部栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-purple-100 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Palette className="w-8 h-8 text-purple-500" />
            </motion.div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hidden md:block">
              你画我猜
            </h1>

            {/* 房间号 Badge */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyRoomId}
              className="badge badge-purple flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {roomId}
              {copied && <span className="text-xs ml-1">已复制!</span>}
            </motion.button>

            {/* 角色 Badge */}
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={cn(
                "badge flex items-center gap-1",
                isDrawer ? "badge-yellow" : "badge-blue"
              )}
            >
              {isDrawer ? (
                <>
                  <Pencil className="w-3 h-3" />
                  画画
                </>
              ) : (
                <>
                  <Smile className="w-3 h-3" />
                  猜题
                </>
              )}
            </motion.span>
          </div>

          {/* 玩家数量 */}
          <div className="flex items-center gap-2">
            <motion.div
              className="badge badge-blue flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="w-4 h-4" />
              {users.length}
            </motion.div>

            {/* 移动端聊天按钮 */}
            <motion.button
              className="md:hidden badge badge-pink flex items-center gap-1"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileChat(true)}
            >
              <Send className="w-4 h-4" />
              {messages.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-3 max-w-7xl mx-auto w-full">
        {/* PC端：左侧玩家列表 */}
        <aside className="hidden md:flex flex-col w-64 card-3d p-4">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            玩家列表
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-xl",
                  user.isDrawer ? "bg-yellow-50" : "bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "avatar",
                    user.isDrawer && "avatar-drawer"
                  )}
                >
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">
                    {user.nickname}
                  </p>
                  {user.isDrawer && (
                    <p className="text-xs text-yellow-600">正在画画...</p>
                  )}
                </div>
                {user.isDrawer && (
                  <Pencil className="w-4 h-4 text-yellow-500" />
                )}
              </motion.div>
            ))}
          </div>
        </aside>

        {/* 中间：画板区域 */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* 工具栏 */}
          {isDrawer && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-3d p-3 mb-3 flex flex-wrap items-center gap-3"
            >
              {/* 颜色选择器 */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: brushColor }}
                >
                  <Palette className="w-5 h-5 text-white drop-shadow-md" />
                </motion.button>

                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-12 left-0 card-3d p-3 z-50 min-w-[280px]"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {brushColors.map(({ color, name }) => (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setBrushColor(color);
                              setShowColorPicker(false);
                            }}
                            className={cn(
                              "color-dot",
                              brushColor === color && "active"
                            )}
                            style={{ backgroundColor: color }}
                            title={name}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 画笔粗细 */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBrushSizePicker(!showBrushSizePicker)}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md"
                >
                  <Pencil className="w-5 h-5 text-white drop-shadow-md" />
                </motion.button>

                <AnimatePresence>
                  {showBrushSizePicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-12 left-0 card-3d p-3 z-50"
                    >
                      <div className="space-y-2">
                        {brushSizes.map((size) => (
                          <motion.button
                            key={size}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setBrushSize(size);
                              setShowBrushSizePicker(false);
                            }}
                            className={cn(
                              "w-full py-2 px-3 rounded-lg text-sm font-semibold text-left transition-all",
                              brushSize === size
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="rounded-full bg-purple-500"
                                style={{ width: `${size}px`, height: `${size}px` }}
                              />
                              <span>{size}px</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 清空画布 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearCanvas}
                className="ml-auto btn-3d btn-red px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </motion.button>
            </motion.div>
          )}

          {/* Canvas */}
          <div className="flex-1 canvas-container relative">
            {isDrawer && (
              <div className="absolute bottom-4 left-4 z-10 badge badge-yellow">
                <Pencil className="w-3 h-3" />
                你的回合
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          </div>
        </main>

        {/* PC端：右侧聊天区域 */}
        <aside className="hidden md:flex flex-col w-80 card-3d overflow-hidden">
          {/* 聊天标题 */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Send className="w-5 h-5" />
              聊天室
            </h3>
          </div>

          {/* 聊天消息列表 */}
          <div
            id="chat-container"
            className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gradient-to-b from-white to-purple-50"
          >
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Smile className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">还没有消息哦~</p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {msg.isSystem ? (
                    <div className="flex items-center justify-center">
                      <span className="chat-bubble-system">{msg.message}</span>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex",
                        msg.nickname === nickname ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "flex flex-col max-w-[85%]",
                          msg.nickname === nickname ? "items-end" : "items-start"
                        )}
                      >
                        <span className="text-xs font-semibold text-gray-500 mb-1 px-1">
                          {msg.nickname === nickname ? "你" : msg.nickname}
                        </span>
                        <div
                          className={cn(
                            "chat-bubble",
                            msg.nickname === nickname
                              ? "chat-bubble-self"
                              : "chat-bubble-other"
                          )}
                        >
                          <p className="text-sm font-medium break-words">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t-2 border-purple-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={isDrawer ? "画画中..." : "输入答案..."}
                disabled={isDrawer}
                className="input-doodle flex-1"
                maxLength={50}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={isDrawer || !messageInput.trim()}
                className={cn(
                  "btn-3d px-5 py-3 rounded-xl flex items-center gap-2",
                  isDrawer || !messageInput.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "btn-purple"
                )}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </aside>
      </div>

      {/* 移动端聊天抽屉 */}
      <AnimatePresence>
        {showMobileChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowMobileChat(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden max-h-[70vh] flex flex-col"
            >
              {/* 抽屉头部 */}
              <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-3xl flex items-center justify-between">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  聊天室
                </h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMobileChat(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* 聊天消息列表 */}
              <div
                id="chat-container-mobile"
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
              >
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Smile className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-medium">还没有消息哦~</p>
                  </div>
                )}
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {msg.isSystem ? (
                        <div className="flex items-center justify-center">
                          <span className="chat-bubble-system">{msg.message}</span>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex",
                            msg.nickname === nickname ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex flex-col max-w-[85%]",
                              msg.nickname === nickname ? "items-end" : "items-start"
                            )}
                          >
                            <span className="text-xs font-semibold text-gray-500 mb-1 px-1">
                              {msg.nickname === nickname ? "你" : msg.nickname}
                            </span>
                            <div
                              className={cn(
                                "chat-bubble",
                                msg.nickname === nickname
                                  ? "chat-bubble-self"
                                  : "chat-bubble-other"
                              )}
                            >
                              <p className="text-sm font-medium break-words">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* 输入框 */}
              <div className="p-4 border-t-2 border-purple-100 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={isDrawer ? "画画中..." : "输入答案..."}
                    disabled={isDrawer}
                    className="input-doodle flex-1"
                    maxLength={50}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={isDrawer || !messageInput.trim()}
                    className={cn(
                      "btn-3d px-5 py-3 rounded-xl flex items-center gap-2",
                      isDrawer || !messageInput.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "btn-purple"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
