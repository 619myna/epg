// categories.js
const categoryRules = [
  // 基础示例规则
  { name: '央视', regex: /^CCTV\d{1,2}$/i, isUniversal: true, priority: 1 },
  { name: '卫视', regex: /卫视/i, isUniversal: true, priority: 2 },
  { name: '北京', regex: /北京|BTV/i, isUniversal: false, priority: 3 },
  { name: '广东', regex: /广东|广州|深圳/i, isUniversal: false, priority: 4 }
];

const provincePinyinMap = {
  '北京': 'bj',
  '上海': 'sh',
  '广东': 'guangdong',
  '浙江': 'zhejiang',
  '江苏': 'jiangsu',
  '湖南': 'hunan',
  '四川': 'sichuan',
  '天津': 'tianjin',
  '重庆': 'chongqing'
};

const universalPinyinMap = {
  '央视': 'cctv',
  '卫视': 'ws',
  '数字付费': 'sz',
  '高清': 'hq',
  '购物': 'gw',
  '教育': 'jy'
};

module.exports = {
  categoryRules,
  provincePinyinMap,
  universalPinyinMap
};