// 你画我猜 - 词汇库
// 格式: { word: "词汇", hint: "提示信息" }

const wordLibrary = [
  // 简单词汇（2-3个字）
  { word: "苹果", hint: "2个字 · 水果 · 红色或绿色" },
  { word: "太阳", hint: "2个字 · 天体 · 白天出现" },
  { word: "月亮", hint: "2个字 · 天体 · 夜晚出现" },
  { word: "星星", hint: "2个字 · 天体 · 在夜空中闪烁" },
  { word: "房子", hint: "2个字 · 建筑 · 人们居住的地方" },
  { word: "小猫", hint: "2个字 · 动物 · 喵喵叫的宠物" },
  { word: "小狗", hint: "2个字 · 动物 · 汪汪叫的宠物" },
  { word: "大树", hint: "2个字 · 植物 · 有树干和树叶" },
  { word: "花朵", hint: "2个字 · 植物 · 有花瓣和香味" },
  { word: "汽车", hint: "2个字 · 交通工具 · 四个轮子" },
  { word: "飞机", hint: "2个字 · 交通工具 · 在天空中飞行" },
  { word: "火车", hint: "2个字 · 交通工具 · 在铁轨上行驶" },
  { word: "书本", hint: "2个字 · 物品 · 用于阅读和学习" },
  { word: "手机", hint: "2个字 · 电子产品 · 用于通讯" },
  { word: "电脑", hint: "2个字 · 电子产品 · 用于工作和娱乐" },
  { word: "桌子", hint: "2个字 · 家具 · 用于放置物品" },
  { word: "椅子", hint: "2个字 · 家具 · 用于坐" },
  { word: "床铺", hint: "2个字 · 家具 · 用于睡觉" },
  { word: "窗户", hint: "2个字 · 建筑部件 · 用于采光和通风" },
  { word: "门", hint: "1个字 · 建筑部件 · 用于进出" },

  // 中等难度（4-5个字）
  { word: "大熊猫", hint: "3个字 · 动物 · 黑白相间的国宝" },
  { word: "冰淇淋", hint: "3个字 · 食物 · 冷冻甜品" },
  { word: "彩虹", hint: "2个字 · 自然现象 · 七种颜色" },
  { word: "钢琴", hint: "2个字 · 乐器 · 黑白键" },
  { word: "足球", hint: "2个字 · 运动 · 用脚踢的球" },
  { word: "篮球", hint: "2个字 · 运动 · 用手投的球" },
  { word: "游泳", hint: "2个字 · 运动 · 在水中进行" },
  { word: "跑步", hint: "2个字 · 运动 · 用双腿快速移动" },
  { word: "下雨", hint: "2个字 · 天气现象 · 从天空落下的水" },
  { word: "下雪", hint: "2个字 · 天气现象 · 白色的雪花" },
  { word: "刮风", hint: "2个字 · 天气现象 · 空气流动" },
  { word: "闪电", hint: "2个字 · 自然现象 · 天空中的亮光" },
  { word: "打雷", hint: "2个字 · 自然现象 · 巨大的响声" },
  { word: "春天", hint: "2个字 · 季节 · 万物复苏" },
  { word: "夏天", hint: "2个字 · 季节 · 炎热多雨" },
  { word: "秋天", hint: "2个字 · 季节 · 丰收的季节" },
  { word: "冬天", hint: "2个字 · 季节 · 寒冷下雪" },

  // 较难词汇（成语、概念等）
  { word: "宇宙飞船", hint: "4个字 · 科技 · 在太空中飞行的交通工具" },
  { word: "埃菲尔铁塔", hint: "5个字 · 建筑 · 法国巴黎的地标" },
  { word: "望远镜", hint: "3个字 · 仪器 · 用于观察远方物体" },
  { word: "显微镜", hint: "3个字 · 仪器 · 用于观察微小物体" },
  { word: "人工智能", hint: "4个字 · 科技领域 · 让机器具有智能" },
  { word: "区块链", hint: "3个字 · 科技概念 · 去中心化的数据库" },
  { word: "大数据", hint: "3个字 · 科技概念 · 海量数据集合" },
  { word: "云计算", hint: "3个字 · 科技概念 · 通过网络提供计算服务" },
  { word: "虚拟现实", hint: "4个字 · 科技 · 模拟真实环境的技术" },
  { word: "增强现实", hint: "4个字 · 科技 · 在真实环境中叠加虚拟信息" },

  // 生活用品
  { word: "电冰箱", hint: "3个字 · 家电 · 用于冷藏食物" },
  { word: "洗衣机", hint: "3个字 · 家电 · 用于清洗衣物" },
  { word: "微波炉", hint: "3个字 · 家电 · 用于加热食物" },
  { word: "空调", hint: "2个字 · 家电 · 调节室内温度" },
  { word: "电视", hint: "2个字 · 家电 · 用于观看节目" },
  { word: "沙发", hint: "2个字 · 家具 · 用于坐和躺" },
  { word: "衣柜", hint: "2个字 · 家具 · 存放衣物" },
  { word: "书架", hint: "2个字 · 家具 · 摆放书籍" },
  { word: "台灯", hint: "2个字 · 照明 · 放在桌子上的灯" },
  { word: "闹钟", hint: "2个字 · 计时器 · 用于叫醒" },

  // 食物与饮料
  { word: "披萨", hint: "2个字 · 食物 · 意大利面饼加配料" },
  { word: "汉堡", hint: "2个字 · 食物 · 两片面包夹肉饼" },
  { word: "薯条", hint: "2个字 · 食物 · 油炸土豆条" },
  { word: "可乐", hint: "2个字 · 饮料 · 黑色碳酸饮料" },
  { word: "咖啡", hint: "2个字 · 饮料 · 提神的黑色饮品" },
  { word: "茶", hint: "1个字 · 饮料 · 用茶叶泡的饮品" },
  { word: "牛奶", hint: "2个字 · 饮料 · 来自牛的白色液体" },
  { word: "果汁", hint: "2个字 · 饮料 · 水果榨的汁" },
  { word: "蛋糕", hint: "2个字 · 甜点 · 用面粉、鸡蛋、糖制作" },
  { word: "巧克力", hint: "3个字 · 甜食 · 可可制品" },

  // 职业
  { word: "医生", hint: "2个字 · 职业 · 治疗疾病的人" },
  { word: "护士", hint: "2个字 · 职业 · 协助医生照顾病人" },
  { word: "教师", hint: "2个字 · 职业 · 教育学生的人" },
  { word: "警察", hint: "2个字 · 职业 · 维护治安的人" },
  { word: "消防员", hint: "3个字 · 职业 · 灭火救援的人" },
  { word: "厨师", hint: "2个字 · 职业 · 烹饪食物的人" },
  { word: "司机", hint: "2个字 · 职业 · 驾驶车辆的人" },
  { word: "工程师", hint: "3个字 · 职业 · 设计建造的人" },
  { word: "程序员", hint: "3个字 · 职业 · 编写代码的人" },
  { word: "画家", hint: "2个字 · 职业 · 创作绘画的人" }
];

// 从词库中随机获取指定数量的词汇
function getRandomWords(count = 3) {
  const shuffled = [...wordLibrary].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, wordLibrary.length));
}

// 判断一个词是否在词库中
function isValidWord(word) {
  return wordLibrary.some(item => item.word === word);
}

// 根据词获取提示
function getHintForWord(word) {
  const item = wordLibrary.find(item => item.word === word);
  return item ? item.hint : null;
}

module.exports = {
  wordLibrary,
  getRandomWords,
  isValidWord,
  getHintForWord
};