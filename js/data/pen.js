/* =========================================================
   控笔板块 - 描红数据（数字 / 汉字分级）
   level 1 = 数字，level 3 = 汉字（level 2 偏旁留待 ticket 12 扩充）
   首期内置 22 个跑通描红闭环
   ========================================================= */

export const PEN_CHARS = [
  { id: 'pn01', char: '1', level: 1 },
  { id: 'pn02', char: '2', level: 1 },
  { id: 'pn03', char: '3', level: 1 },
  { id: 'pn04', char: '4', level: 1 },
  { id: 'pn05', char: '5', level: 1 },
  { id: 'pn06', char: '6', level: 1 },
  { id: 'pn07', char: '7', level: 1 },
  { id: 'pn08', char: '8', level: 1 },
  { id: 'pn09', char: '9', level: 1 },
  { id: 'pn10', char: '10', level: 1 },
  { id: 'pn11', char: '人', level: 3 },
  { id: 'pn12', char: '口', level: 3 },
  { id: 'pn13', char: '手', level: 3 },
  { id: 'pn14', char: '山', level: 3 },
  { id: 'pn15', char: '水', level: 3 },
  { id: 'pn16', char: '日', level: 3 },
  { id: 'pn17', char: '月', level: 3 },
  { id: 'pn18', char: '大', level: 3 },
  { id: 'pn19', char: '小', level: 3 },
  { id: 'pn20', char: '上', level: 3 },
  { id: 'pn21', char: '下', level: 3 },
  { id: 'pn22', char: '天', level: 3 },
];
