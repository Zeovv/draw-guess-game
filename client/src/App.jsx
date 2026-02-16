import { useState, useEffect, useRef } from 'react';
import socket from './socket';

function App() {
  // 页面状态：'login' | 'game'
  const [page, setPage] = useState('login');

  // 登录页状态
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');

  // 游戏页状态
  const [isDrawer, setIsDrawer] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState([]);

  // Canvas 相关
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // 画笔设置
  const [brushColor, setBrushColor] = useState('#FF6B9D');
  const [brushSize, setBrushSize] = useState(4);

  // 可爱配色方案
  const cuteColors = ['#FF6B9D', '#FFB84D', '#7BC950', '#4ECDC4', '#A855F7', '#F97316', '#3B82F6', '#000000'];

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

  // 监听 Socket 事件
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

  // 登录页
  if (page === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center p-4 overflow-hidden relative">
        {/* 装饰圆圈 */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-pink-400 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-purple-400 rounded-full opacity-30 animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 bg-blue-300 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-60 left-1/4 w-8 h-8 bg-green-300 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '2s' }}></div>

        {/* 星星装饰 */}
        <div className="absolute top-20 right-1/3 text-4xl animate-pulse">✨</div>
        <div className="absolute bottom-32 left-1/4 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute top-1/3 right-20 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>🎨</div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border-4 border-white/50">
          {/* 可爱标题 */}
          <div className="text-center mb-6">
            <span className="text-5xl">🎨</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mt-2">
              你画我猜
            </h1>
            <p className="text-gray-500 text-sm mt-2">和朋友们一起开心画画吧~</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>👤</span> 昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="起个可爱的名字~"
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 outline-none transition-all text-sm"
                maxLength={12}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span>🏠</span> 房间号
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="输入房间号（可选）"
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 outline-none transition-all text-sm"
                maxLength={6}
              />
            </div>
            <button
              onClick={handleCreateRoom}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold rounded-2xl hover:from-pink-500 hover:to-purple-600 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl text-base"
            >
              ✨ 创建房间 ✨
            </button>
            <button
              onClick={handleJoinRoom}
              className="w-full py-3 bg-gradient-to-r from-indigo-400 to-blue-500 text-white font-bold rounded-2xl hover:from-indigo-500 hover:to-blue-600 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl text-base"
            >
              🚀 加入房间 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 游戏页
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* 顶部栏 */}
      <header className="bg-gradient-to-r from-pink-400 to-purple-500 shadow-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎨</span>
          <h1 className="text-xl font-bold text-white drop-shadow-md">你画我猜</h1>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-sm font-medium">房间: {roomId}</span>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${isDrawer ? 'bg-yellow-300 text-yellow-800' : 'bg-blue-300 text-blue-800'} shadow-md`}>
            {isDrawer ? '🎨 你画画' : '🤔 你猜题'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <span className="text-white text-sm font-bold">{users.length}</span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 md:p-4 gap-3">
        {/* 画板区域 */}
        <div className="flex-1 flex flex-col">
          {/* 工具栏 */}
          {isDrawer && (
            <div className="bg-white rounded-3xl shadow-lg p-4 mb-3 flex flex-wrap items-center gap-4 border-2 border-purple-100">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                  <span>🎨</span> 颜色
                </label>
                <div className="flex gap-2 flex-wrap">
                  {cuteColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-9 h-9 rounded-full border-3 transform hover:scale-110 transition-all ${brushColor === color ? 'border-gray-800 ring-4 ring-purple-300 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: color, borderWidth: '3px' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 rounded-2xl px-4 py-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                  <span>✏️</span> 粗细
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-purple-500"
                />
                <span className="text-sm font-bold text-purple-600 w-8">{brushSize}</span>
              </div>
              <button
                onClick={handleClearCanvas}
                className="ml-auto px-5 py-2 bg-gradient-to-r from-red-400 to-pink-500 text-white font-bold rounded-2xl hover:from-red-500 hover:to-pink-600 transform hover:scale-105 transition-all shadow-md"
              >
                🗑️ 清空
              </button>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden border-4 border-white">
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
        </div>

        {/* 聊天区域 */}
        <div className="w-full md:w-80 bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden border-2 border-purple-100">
          {/* 聊天标题 */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-400 to-pink-400">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <span>💬</span> 聊天室
            </h2>
          </div>

          {/* 聊天消息列表 */}
          <div id="chat-container" className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-gradient-to-b from-white to-purple-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">🎈</span>
                <p className="text-gray-400 text-sm font-medium">还没有消息哦~</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className="animate-fade-in">
                {msg.isSystem ? (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
                      {msg.message}
                    </span>
                  </div>
                ) : (
                  <div className={`flex ${msg.nickname === nickname ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[85%] ${msg.nickname === nickname ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs font-bold text-gray-500 mb-1 px-2">
                        {msg.nickname === nickname ? '👤 你' : `👤 ${msg.nickname}`}
                      </span>
                      <div className={`px-4 py-2.5 shadow-md ${
                        msg.nickname === nickname
                          ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-3xl rounded-br-md'
                          : 'bg-white border-2 border-purple-100 text-gray-800 rounded-3xl rounded-bl-md'
                      }`}>
                        <p className="text-sm font-medium break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 输入框 */}
          <div className="p-4 bg-gradient-to-t from-purple-100 to-white border-t-2 border-purple-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isDrawer ? '🎨 画画中...' : '💭 输入答案...'}
                disabled={isDrawer}
                className="flex-1 px-4 py-2.5 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 outline-none text-sm transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={50}
              />
              <button
                onClick={handleSendMessage}
                disabled={isDrawer || !messageInput.trim()}
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-md"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
