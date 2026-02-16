import { io } from 'socket.io-client';

// 开发环境使用 localhost，生产环境从环境变量读取后端地址
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  // 移动端优化
  forceNew: false,
  upgrade: true,
  rememberUpgrade: true,
});

// 连接状态日志
socket.on('connect', () => {
  console.log('Socket 已连接:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket 断开连接:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket 连接错误:', error);
});

export default socket;
