/* =========================================================
   英语板块 - 单词与绘本数据（小样本）
   单词 id 前缀 ew（english word），绘本 id 前缀 eb（english book）
   首期内置 30 词 + 4 本自编绘本，后续内容扩充（ticket 12）
   ========================================================= */

export const ENGLISH_WORDS = [
  { id: 'ew001', word: 'apple', cn: '苹果', ico: '🍎', py: 'ˈæpl' },
  { id: 'ew002', word: 'banana', cn: '香蕉', ico: '🍌', py: 'bəˈnɑːnə' },
  { id: 'ew003', word: 'cat', cn: '猫', ico: '🐱', py: 'kæt' },
  { id: 'ew004', word: 'dog', cn: '狗', ico: '🐶', py: 'dɒɡ' },
  { id: 'ew005', word: 'egg', cn: '鸡蛋', ico: '🥚', py: 'eɡ' },
  { id: 'ew006', word: 'fish', cn: '鱼', ico: '🐟', py: 'fɪʃ' },
  { id: 'ew007', word: 'grape', cn: '葡萄', ico: '🍇', py: 'ɡreɪp' },
  { id: 'ew008', word: 'hat', cn: '帽子', ico: '🎩', py: 'hæt' },
  { id: 'ew009', word: 'ice', cn: '冰', ico: '🧊', py: 'aɪs' },
  { id: 'ew010', word: 'juice', cn: '果汁', ico: '🧃', py: 'dʒuːs' },
  { id: 'ew011', word: 'kite', cn: '风筝', ico: '🪁', py: 'kaɪt' },
  { id: 'ew012', word: 'lion', cn: '狮子', ico: '🦁', py: 'ˈlaɪən' },
  { id: 'ew013', word: 'milk', cn: '牛奶', ico: '🥛', py: 'mɪlk' },
  { id: 'ew014', word: 'nose', cn: '鼻子', ico: '👃', py: 'nəʊz' },
  { id: 'ew015', word: 'orange', cn: '橙子', ico: '🍊', py: 'ˈɒrɪndʒ' },
  { id: 'ew016', word: 'pig', cn: '猪', ico: '🐷', py: 'pɪɡ' },
  { id: 'ew017', word: 'queen', cn: '女王', ico: '👑', py: 'kwiːn' },
  { id: 'ew018', word: 'rabbit', cn: '兔子', ico: '🐰', py: 'ˈræbɪt' },
  { id: 'ew019', word: 'sun', cn: '太阳', ico: '☀️', py: 'sʌn' },
  { id: 'ew020', word: 'tree', cn: '树', ico: '🌳', py: 'triː' },
  { id: 'ew021', word: 'umbrella', cn: '雨伞', ico: '☂️', py: 'ʌmˈbrelə' },
  { id: 'ew022', word: 'water', cn: '水', ico: '💧', py: 'ˈwɔːtə' },
  { id: 'ew023', word: 'box', cn: '盒子', ico: '📦', py: 'bɒks' },
  { id: 'ew024', word: 'cake', cn: '蛋糕', ico: '🎂', py: 'keɪk' },
  { id: 'ew025', word: 'duck', cn: '鸭子', ico: '🦆', py: 'dʌk' },
  { id: 'ew026', word: 'ear', cn: '耳朵', ico: '👂', py: 'ɪə' },
  { id: 'ew027', word: 'frog', cn: '青蛙', ico: '🐸', py: 'frɒɡ' },
  { id: 'ew028', word: 'goat', cn: '山羊', ico: '🐐', py: 'ɡəʊt' },
  { id: 'ew029', word: 'house', cn: '房子', ico: '🏠', py: 'haʊs' },
  { id: 'ew030', word: 'moon', cn: '月亮', ico: '🌙', py: 'muːn' },
];

export const ENGLISH_BOOKS = [
  {
    id: 'eb001',
    title: 'My Cat',
    ico: '🐱',
    pages: [
      { en: 'This is my cat.', cn: '这是我的猫。', ico: '🐱' },
      { en: 'My cat is white.', cn: '我的猫是白色的。', ico: '🐱' },
      { en: 'My cat likes milk.', cn: '我的猫喜欢牛奶。', ico: '🥛' },
      { en: 'I love my cat.', cn: '我爱我的猫。', ico: '❤️' },
    ],
  },
  {
    id: 'eb002',
    title: 'The Sun',
    ico: '☀️',
    pages: [
      { en: 'The sun is up.', cn: '太阳升起来了。', ico: '🌅' },
      { en: 'The sun is yellow.', cn: '太阳是黄色的。', ico: '☀️' },
      { en: 'The sun is warm.', cn: '太阳暖暖的。', ico: '🌞' },
    ],
  },
  {
    id: 'eb003',
    title: 'I Like Fruit',
    ico: '🍎',
    pages: [
      { en: 'I like apples.', cn: '我喜欢苹果。', ico: '🍎' },
      { en: 'I like bananas.', cn: '我喜欢香蕉。', ico: '🍌' },
      { en: 'I like grapes.', cn: '我喜欢葡萄。', ico: '🍇' },
      { en: 'Fruit is yummy!', cn: '水果真好吃！', ico: '😋' },
    ],
  },
  {
    id: 'eb004',
    title: 'Little Duck',
    ico: '🦆',
    pages: [
      { en: 'A little duck.', cn: '一只小鸭子。', ico: '🦆' },
      { en: 'The duck can swim.', cn: '小鸭子会游泳。', ico: '🏊' },
      { en: 'The duck says quack.', cn: '小鸭子嘎嘎叫。', ico: '🦆' },
      { en: 'Goodbye, duck!', cn: '再见，小鸭子！', ico: '👋' },
    ],
  },
];
