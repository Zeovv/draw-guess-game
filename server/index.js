const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'draw-guess-server'
  });
});

const httpServer = createServer(app);

// 允许所有来源（生产环境可限制特定域名）
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 存储房间数据
const rooms = {};

io.on('connection', (socket) => {
  console.log('用户已连接:', socket.id);

  // 加入房间
  socket.on('join_room', ({ roomId, nickname }) => {
    socket.join(roomId);

    // 初始化房间（如果不存在）
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        drawer: null,
        currentWord: '',
      };
    }

    // 添加用户到房间
    const user = {
      id: socket.id,
      nickname,
      isDrawer: false,
    };

    // 如果房间没有画手，当前用户成为画手
    if (rooms[roomId].drawer === null) {
      rooms[roomId].drawer = socket.id;
      user.isDrawer = true;
    }

    rooms[roomId].users.push(user);

    // 通知房间内的所有用户
    io.to(roomId).emit('user_joined', {
      users: rooms[roomId].users,
      message: `${nickname} 加入了房间`,
    });

    // 通知当前用户是否是画手
    socket.emit('role_assigned', { isDrawer: user.isDrawer });

    console.log(`用户 ${nickname} 加入房间 ${roomId}`);
  });

  // 画笔路径
  socket.on('draw_line', (data) => {
    const { roomId, startX, startY, endX, endY, color, lineWidth } = data;
    socket.to(roomId).emit('draw_line', {
      startX,
      startY,
      endX,
      endY,
      color,
      lineWidth,
    });
  });

  // 发送消息
  socket.on('send_message', ({ roomId, message, nickname }) => {
    io.to(roomId).emit('receive_message', {
      message,
      nickname,
      timestamp: new Date().toISOString(),
    });
  });

  // 清空画布
  socket.on('clear_canvas', ({ roomId }) => {
    io.to(roomId).emit('clear_canvas');
  });

  // 用户断开连接
  socket.on('disconnect', () => {
    // 查找用户所在的房间
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex((u) => u.id === socket.id);

      if (userIndex !== -1) {
        const user = room.users[userIndex];
        room.users.splice(userIndex, 1);

        // 如果是画手断开连接，随机选一个新画手
        if (room.drawer === socket.id && room.users.length > 0) {
          room.drawer = room.users[0].id;
          room.users[0].isDrawer = true;
          io.to(room.users[0].id).emit('role_assigned', { isDrawer: true });
        }

        // 如果房间为空，删除房间
        if (room.users.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('user_left', {
            users: room.users,
            message: `${user.nickname} 离开了房间`,
          });
        }

        console.log(`用户 ${user.nickname} 离开了房间 ${roomId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
