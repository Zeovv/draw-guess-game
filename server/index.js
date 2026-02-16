const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { getRandomWords, getHintForWord } = require('./words.js');

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

// 游戏状态常量
const GAME_STATE = {
  WAITING: 'WAITING',      // 等待准备
  SELECTING: 'SELECTING',  // 选词阶段
  DRAWING: 'DRAWING',      // 绘画猜词阶段
  ROUND_END: 'ROUND_END',  // 回合结束
  GAME_END: 'GAME_END'     // 游戏结束
};

// 计时器常量
const TIMER = {
  SELECTING: 25,  // 选词时间25秒
  DRAWING: 60     // 绘画猜词时间60秒
};

// 存储房间数据
const rooms = {};

// 工具函数：向房间内所有用户广播游戏状态更新
function broadcastGameState(io, roomId, room) {
  io.to(roomId).emit('game_state_update', {
    gameState: room.gameState,
    currentDrawerIndex: room.currentDrawerIndex,
    currentWord: room.currentWord,
    timer: room.timer,
    currentRound: room.currentRound,
    maxRounds: room.maxRounds,
    scores: room.scores,
    readyPlayers: room.readyPlayers,
    wordOptions: room.wordOptions,
    roundEndTime: room.roundEndTime
  });
}

// 工具函数：清理房间定时器
function clearRoomTimer(room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  room.timer = null;
}

// 工具函数：开始房间倒计时
function startRoomTimer(io, roomId, room, duration, onTimeout) {
  clearRoomTimer(room);
  room.timer = duration;
  room.roundEndTime = Date.now() + duration * 1000;

  room.timerInterval = setInterval(() => {
    room.timer--;

    // 广播计时器更新
    io.to(roomId).emit('timer_update', { timer: room.timer });

    if (room.timer <= 0) {
      clearRoomTimer(room);
      if (onTimeout) onTimeout();
    }
  }, 1000);
}

// 工具函数：获取下一个画手
function getNextDrawer(room) {
  if (!room.users || room.users.length === 0) return 0;
  return (room.currentDrawerIndex + 1) % room.users.length;
}

// 工具函数：检查是否所有玩家都已准备
function allPlayersReady(room) {
  if (!room.users || room.users.length < 2) return false;
  return room.users.every(user => user.isReady);
}

// 工具函数：获取赢家（最高分）
function getWinner(room) {
  let maxScore = -1;
  let winners = [];

  for (const userId in room.scores) {
    const score = room.scores[userId];
    if (score > maxScore) {
      maxScore = score;
      winners = [userId];
    } else if (score === maxScore) {
      winners.push(userId);
    }
  }

  // 获取赢家昵称
  const winnerNames = winners.map(userId => {
    const user = room.users.find(u => u.id === userId);
    return user ? user.nickname : userId;
  });

  return {
    winners: winnerNames,
    score: maxScore
  };
}

// 工具函数：结束当前回合
function endRound(io, roomId, room, reason = 'timeout') {
  clearRoomTimer(room);

  // 重置用户猜对状态
  room.users.forEach(user => {
    user.guessedCorrectly = false;
  });

  // 广播回合结束
  io.to(roomId).emit('round_end', {
    reason,
    currentWord: room.currentWord,
    scores: room.scores,
    nextDrawerIndex: getNextDrawer(room)
  });

  // 切换到ROUND_END状态
  room.gameState = GAME_STATE.ROUND_END;
  broadcastGameState(io, roomId, room);

  console.log(`房间 ${roomId} 回合结束，原因: ${reason}`);
}

// 工具函数：开始新回合
function startNewRound(io, roomId, room) {
  // 切换到下一个画手
  room.currentDrawerIndex = getNextDrawer(room);

  // 更新用户画手状态
  room.users.forEach((user, index) => {
    user.isDrawer = index === room.currentDrawerIndex;
    user.guessedCorrectly = false;
  });

  // 重置当前单词
  room.currentWord = null;
  room.wordOptions = [];

  // 进入选词阶段
  room.gameState = GAME_STATE.SELECTING;

  // 如果是画手，发送单词选项
  const drawer = room.users[room.currentDrawerIndex];
  if (drawer) {
    room.wordOptions = getRandomWords(3);
    io.to(drawer.id).emit('word_selection', {
      options: room.wordOptions,
      timer: TIMER.SELECTING
    });
  }

  // 开始选词倒计时
  startRoomTimer(io, roomId, room, TIMER.SELECTING, () => {
    // 选词超时，自动选择一个单词
    if (room.gameState === GAME_STATE.SELECTING && room.wordOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * room.wordOptions.length);
      const selectedWord = room.wordOptions[randomIndex];
      selectWord(io, roomId, room, drawer.id, selectedWord);
    }
  });

  broadcastGameState(io, roomId, room);

  console.log(`房间 ${roomId} 开始新回合，画手: ${drawer?.nickname}`);
}

// 工具函数：选择单词
function selectWord(io, roomId, room, userId, wordObj) {
  // 验证选择者是否是当前画手
  const drawer = room.users[room.currentDrawerIndex];
  if (!drawer || drawer.id !== userId) return false;

  // 设置当前单词
  room.currentWord = wordObj;
  room.wordOptions = [];

  // 切换到绘画猜词阶段
  room.gameState = GAME_STATE.DRAWING;
  clearRoomTimer(room);

  // 广播单词已选择（只广播提示，不广播单词本身）
  io.to(roomId).emit('word_selected', {
    hint: wordObj.hint,
    drawerNickname: drawer.nickname,
    wordLength: wordObj.word.length
  });

  // 开始绘画猜词倒计时
  startRoomTimer(io, roomId, room, TIMER.DRAWING, () => {
    // 绘画猜词超时，结束本轮
    endRound(io, roomId, room, 'timeout');
  });

  broadcastGameState(io, roomId, room);

  console.log(`房间 ${roomId} 画手 ${drawer.nickname} 选择了单词: ${wordObj.word}`);
  return true;
}

io.on('connection', (socket) => {
  console.log('用户已连接:', socket.id);

  // 加入房间
  socket.on('join_room', ({ roomId, nickname }) => {
    socket.join(roomId);

    // 初始化房间（如果不存在）
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        gameState: GAME_STATE.WAITING,
        currentDrawerIndex: 0,
        currentWord: null,
        timer: null,
        roundEndTime: 0,
        scores: {},
        readyPlayers: [],
        wordOptions: [],
        currentRound: 0,
        maxRounds: 5, // 默认5轮
        timerInterval: null,
        ownerId: null // 房主ID
      };
    }

    const room = rooms[roomId];

    // 检查是否是第一个用户（房主）
    const isOwner = room.users.length === 0;

    // 添加用户到房间
    const user = {
      id: socket.id,
      nickname,
      isDrawer: false,
      score: 0,
      isReady: false,
      isOwner: isOwner,
      guessedCorrectly: false
    };

    // 如果是房主，设置房主ID
    if (isOwner) {
      room.ownerId = socket.id;
    }

    // 如果房间没有用户，第一个用户自动成为画手
    if (room.users.length === 0) {
      user.isDrawer = true;
      room.currentDrawerIndex = 0;
    }

    room.users.push(user);
    room.scores[socket.id] = 0;

    // 准备用户列表用于广播（移除敏感信息）
    const broadcastUsers = room.users.map(u => ({
      id: u.id,
      nickname: u.nickname,
      isDrawer: u.isDrawer,
      score: u.score,
      isReady: u.isReady,
      isOwner: u.isOwner,
      guessedCorrectly: u.guessedCorrectly
    }));

    // 通知房间内的所有用户
    io.to(roomId).emit('user_joined', {
      users: broadcastUsers,
      message: `${nickname} 加入了房间`,
      roomState: {
        gameState: room.gameState,
        currentDrawerIndex: room.currentDrawerIndex,
        currentWord: room.currentWord,
        timer: room.timer,
        currentRound: room.currentRound,
        maxRounds: room.maxRounds,
        scores: room.scores,
        readyPlayers: room.readyPlayers,
        ownerId: room.ownerId
      }
    });

    // 通知当前用户角色信息
    socket.emit('role_assigned', {
      isDrawer: user.isDrawer,
      isOwner: user.isOwner,
      userId: socket.id
    });

    // 广播游戏状态更新
    broadcastGameState(io, roomId, room);

    console.log(`用户 ${nickname} 加入房间 ${roomId}, 房主: ${user.isOwner}, 画手: ${user.isDrawer}`);
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
    const room = rooms[roomId];
    if (!room) return;

    // 检查是否是猜词阶段并且消息匹配当前单词
    if (room.gameState === GAME_STATE.DRAWING &&
        room.currentWord &&
        message.trim().toLowerCase() === room.currentWord.word.toLowerCase()) {

      // 查找发送者用户
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      if (userIndex === -1) return;

      const user = room.users[userIndex];

      // 检查发送者是否是画手（画手不能猜词）
      if (user.isDrawer) {
        // 画手发送了正确单词，可能是误操作，不处理
        return;
      }

      // 检查用户本轮是否已经猜对
      if (user.guessedCorrectly) {
        // 已经猜对过，发送个人提示
        socket.emit('receive_message', {
          message: `你已经猜对过了！`,
          nickname: '系统',
          timestamp: new Date().toISOString(),
          isSystem: true
        });
        return;
      }

      // 标记用户已猜对
      user.guessedCorrectly = true;

      // 检查是否是第一个猜对的人（本轮还没有人猜对）
      const isFirstCorrect = !room.users.some(u => u.guessedCorrectly && u.id !== socket.id && !u.isDrawer);

      if (isFirstCorrect) {
        // 第一个猜对的人加分
        room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
        user.score = room.scores[socket.id];

        // 广播得分更新
        io.to(roomId).emit('score_update', {
          userId: socket.id,
          score: room.scores[socket.id],
          nickname: user.nickname
        });
      }

      // 发送个人成功消息给猜对者
      socket.emit('receive_message', {
        message: `恭喜！你猜对了 "${room.currentWord.word}"！`,
        nickname: '系统',
        timestamp: new Date().toISOString(),
        isSystem: true
      });

      // 广播给其他人（不包括猜对者）系统消息
      socket.to(roomId).emit('receive_message', {
        message: `${nickname} 猜对了！`,
        nickname: '系统',
        timestamp: new Date().toISOString(),
        isSystem: true
      });

      // 检查是否所有猜题者都猜对了
      const drawerIndex = room.currentDrawerIndex;
      const guessers = room.users.filter((_, index) => index !== drawerIndex);
      const allGuessersCorrect = guessers.every(g => g.guessedCorrectly);

      if (allGuessersCorrect) {
        // 所有猜题者都猜对了，提前结束本轮
        endRound(io, roomId, room, 'all_guessed');
      }

      return;
    }

    // 普通消息，广播给所有人
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

  // 玩家准备/取消准备
  socket.on('player_ready', ({ roomId, isReady }) => {
    const room = rooms[roomId];
    if (!room) return;

    const userIndex = room.users.findIndex(u => u.id === socket.id);
    if (userIndex === -1) return;

    const user = room.users[userIndex];
    user.isReady = isReady;

    // 更新准备玩家列表
    if (isReady && !room.readyPlayers.includes(socket.id)) {
      room.readyPlayers.push(socket.id);
    } else if (!isReady) {
      room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
    }

    // 广播准备状态更新
    io.to(roomId).emit('player_ready_update', {
      userId: socket.id,
      nickname: user.nickname,
      isReady: user.isReady,
      readyPlayers: room.readyPlayers
    });

    broadcastGameState(io, roomId, room);

    console.log(`房间 ${roomId} 玩家 ${user.nickname} ${isReady ? '准备' : '取消准备'}`);
  });

  // 房主开始游戏
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    // 检查是否是房主
    if (room.ownerId !== socket.id) {
      socket.emit('error', { message: '只有房主可以开始游戏' });
      return;
    }

    // 检查是否所有玩家都已准备且人数>1
    if (!allPlayersReady(room)) {
      socket.emit('error', { message: '所有玩家都需要准备才能开始游戏' });
      return;
    }

    if (room.users.length < 2) {
      socket.emit('error', { message: '至少需要2名玩家才能开始游戏' });
      return;
    }

    // 重置游戏状态
    room.currentRound = 0;
    room.currentDrawerIndex = 0;
    room.currentWord = null;

    // 重置所有玩家分数和状态
    room.users.forEach(user => {
      user.score = 0;
      user.isDrawer = false;
      user.guessedCorrectly = false;
      room.scores[user.id] = 0;
    });

    // 设置第一个画手
    room.users[0].isDrawer = true;

    // 开始第一轮
    startNewRound(io, roomId, room);

    console.log(`房间 ${roomId} 游戏开始，房主: ${room.users.find(u => u.id === socket.id)?.nickname}`);
  });

  // 画手选择单词
  socket.on('select_word', ({ roomId, wordIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    // 检查是否是画手
    const drawer = room.users[room.currentDrawerIndex];
    if (!drawer || drawer.id !== socket.id) {
      socket.emit('error', { message: '只有当前画手可以选择单词' });
      return;
    }

    // 检查是否在选词阶段
    if (room.gameState !== GAME_STATE.SELECTING) {
      socket.emit('error', { message: '不在选词阶段' });
      return;
    }

    // 检查单词索引是否有效
    if (wordIndex < 0 || wordIndex >= room.wordOptions.length) {
      socket.emit('error', { message: '无效的单词选择' });
      return;
    }

    const selectedWord = room.wordOptions[wordIndex];
    selectWord(io, roomId, room, socket.id, selectedWord);
  });

  // 画手刷新单词选项
  socket.on('refresh_words', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    // 检查是否是画手
    const drawer = room.users[room.currentDrawerIndex];
    if (!drawer || drawer.id !== socket.id) {
      socket.emit('error', { message: '只有当前画手可以刷新单词' });
      return;
    }

    // 检查是否在选词阶段
    if (room.gameState !== GAME_STATE.SELECTING) {
      socket.emit('error', { message: '不在选词阶段' });
      return;
    }

    // 生成新的单词选项
    room.wordOptions = getRandomWords(3);
    io.to(drawer.id).emit('word_selection', {
      options: room.wordOptions,
      timer: TIMER.SELECTING // 重新使用选词时间
    });
    console.log(`房间 ${roomId} 画手 ${drawer.nickname} 刷新了单词选项`);
  });

  // 下一回合
  socket.on('next_round', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    // 检查是否是房主
    if (room.ownerId !== socket.id) {
      socket.emit('error', { message: '只有房主可以开始下一回合' });
      return;
    }

    // 检查是否在回合结束状态
    if (room.gameState !== GAME_STATE.ROUND_END) {
      socket.emit('error', { message: '不在回合结束阶段' });
      return;
    }

    // 增加回合数
    room.currentRound++;

    // 检查是否达到最大回合数
    if (room.currentRound >= room.maxRounds) {
      // 游戏结束
      room.gameState = GAME_STATE.GAME_END;
      io.to(roomId).emit('game_end', {
        scores: room.scores,
        winner: getWinner(room)
      });
      broadcastGameState(io, roomId, room);
      console.log(`房间 ${roomId} 游戏结束`);
    } else {
      // 开始新回合
      startNewRound(io, roomId, room);
    }
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

        // 调整当前画手索引（因为删除一个用户后索引可能改变）
        if (userIndex < room.currentDrawerIndex) {
          // 删除的用户在当前画手之前，画手索引减1
          room.currentDrawerIndex--;
        }

        // 如果断开连接的用户是当前画手
        if (userIndex === room.currentDrawerIndex) {
          // 如果还有剩余用户，选择新的画手（选下一个用户，如果超出范围则选第一个）
          if (room.users.length > 0) {
            // 如果当前画手索引超出范围，重置为0
            if (room.currentDrawerIndex >= room.users.length) {
              room.currentDrawerIndex = 0;
            }
            // 设置新画手
            room.users[room.currentDrawerIndex].isDrawer = true;
            // 通知新画手
            io.to(room.users[room.currentDrawerIndex].id).emit('role_assigned', { isDrawer: true });
          }
        }

        // 如果断开连接的用户是房主，转移房主给下一个用户
        if (room.ownerId === socket.id && room.users.length > 0) {
          room.ownerId = room.users[0].id;
          room.users[0].isOwner = true;
        }

        // 如果房间为空，删除房间
        if (room.users.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('user_left', {
            users: room.users,
            message: `${user.nickname} 离开了房间`,
          });
          // 广播游戏状态更新（画手/房主可能已改变）
          broadcastGameState(io, roomId, room);
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
