// categories.js - 使用拼音简写

// 频道分类规则（保持不变）
const categoryRules = [
  // 通用频道（全国通用） - 优先级高
  { 
    name: '央视', 
    regex: /CCTV|CGTN|CNC|新华社|中国教育|CETV/gi, 
    isUniversal: true, 
    priority: 1 
  },
  { 
    name: '卫视', 
    regex: /卫视/gi, 
    isUniversal: true, 
    priority: 2 
  },
  { 
    name: '付费', 
    regex: /^4K.*$|CHC|睛彩|卫生健康|风云足球|高尔夫网球|央视文化精品|风云音乐|第一剧场|怀旧剧场|风云剧场|世界地理|电视指南|兵器科技|女性时尚|央视台球|老故事|中学生|发现之旅|每日健身|体育赛事|重温经典|早期教育|环球奇观|中国交通|中国天气|书画|百姓健康|优优宝贝|生态环境|中医药|足球|四海钓鱼|快乐垂钓|劲爆体育|天元围棋|武术世界|新动漫|动漫秀场|游戏风云|都市剧场|欢笑剧场|生活时尚|新视觉|求索|精彩影视|家庭理财|东方财经|乐游|法治天地|金色学堂|财富天下|陶瓷|梨园|文物宝库|国学|茶|汽摩|证券服务/gi, 
    isUniversal: true, 
    priority: 3 
  },
  { 
    name: 'NewTV', 
    regex: /超级电视剧|超级电影|超级体育|超级综艺|潮妈辣婆|东北热剧|古装剧场|欢乐剧场|家庭剧场|金牌综艺|精品大剧|精品萌宠|精品体育|精品剧场|军旅剧场|军事评论|明星大片|农业致富|炫舞未来|怡伴健康|中国功夫/gi, 
    isUniversal: true, 
    priority: 4 
  },
  { 
    name: '港澳台', 
    regex: /香港|港|RTHK|TVB|HOY|HBO|CINEMAX|CMC|POPC|NHK|NOW|ELTA|SBN| Star|有线|无线|凤凰|翡翠|美亚|明珠|澳门|澳|台湾|台视|纬来|民视|东森|天映|中视|中天|华视|三立|八大|靖天|壹电视|原住民族|亚洲/gi, 
    isUniversal: true, 
    priority: 5 
  },
  { 
    name: '通用', 
    regex: /IPTV|咪咕|哒啵|黑莓|卡酷|卡通|动漫|纪实|先锋乒羽|时代|现代/gi, 
    isUniversal: true, 
    priority: 6 
  },
  
  // 地方频道（按省份分类）
  // 直辖市
  { name: '北京', regex: /北京|BTV|BRTV|京视|北广|京/gi, isUniversal: false, priority: 101 },
  { name: '上海', regex: /上海|东方|上视|沪/gi, isUniversal: false, priority: 102 },
  { name: '天津', regex: /天津|津/gi, isUniversal: false, priority: 103 },
  { name: '重庆', regex: /重庆|渝/gi, isUniversal: false, priority: 104 },
  
  // 省份
  { name: '河北', regex: /河北|冀/gi, isUniversal: false, priority: 105 },
  { name: '山西', regex: /山西|晋/gi, isUniversal: false, priority: 106 },
  { name: '内蒙古', regex: /内蒙古|蒙/gi, isUniversal: false, priority: 107 },
  { name: '辽宁', regex: /辽宁|辽/gi, isUniversal: false, priority: 108 },
  { name: '吉林', regex: /吉林|吉/gi, isUniversal: false, priority: 109 },
  { name: '黑龙江', regex: /黑龙江|黑/gi, isUniversal: false, priority: 110 },
  { name: '江苏', regex: /江苏|苏/gi, isUniversal: false, priority: 111 },
  { name: '浙江', regex: /浙江|浙/gi, isUniversal: false, priority: 112 },
  { name: '安徽', regex: /安徽|皖/gi, isUniversal: false, priority: 113 },
  { name: '福建', regex: /福建|闽/gi, isUniversal: false, priority: 114 },
  { name: '江西', regex: /江西|赣/gi, isUniversal: false, priority: 115 },
  { name: '山东', regex: /山东|鲁/gi, isUniversal: false, priority: 116 },
  { name: '河南', regex: /河南|豫/gi, isUniversal: false, priority: 117 },
  { name: '湖北', regex: /湖北|鄂/gi, isUniversal: false, priority: 118 },
  { name: '湖南', regex: /湖南|湘/gi, isUniversal: false, priority: 119 },
  { name: '广东', regex: /广东|粤/gi, isUniversal: false, priority: 120 },
  { name: '广西', regex: /广西|桂/gi, isUniversal: false, priority: 121 },
  { name: '海南', regex: /海南|琼/gi, isUniversal: false, priority: 122 },
  { name: '四川', regex: /四川|川/gi, isUniversal: false, priority: 123 },
  { name: '贵州', regex: /贵州|黔/gi, isUniversal: false, priority: 124 },
  { name: '云南', regex: /云南|滇/gi, isUniversal: false, priority: 125 },
  { name: '西藏', regex: /西藏|藏/gi, isUniversal: false, priority: 126 },
  { name: '陕西', regex: /陕西|陕/gi, isUniversal: false, priority: 127 },
  { name: '甘肃', regex: /甘肃|甘|陇/gi, isUniversal: false, priority: 128 },
  { name: '青海', regex: /青海|青/gi, isUniversal: false, priority: 129 },
  { name: '宁夏', regex: /宁夏|宁/gi, isUniversal: false, priority: 130 },
  { name: '新疆', regex: /新疆|新/gi, isUniversal: false, priority: 131 },
  
  // 默认分类
  { name: '其他', regex: /.*/, isUniversal: true, priority: 999 }
];

// 省份拼音简写映射（主要使用拼音首字母或常见简写）
const provincePinyinMap = {
  // 直辖市 - 传统简写
  '北京': 'bj',
  '上海': 'sh',
  '天津': 'tj',
  '重庆': 'cq',
  
  // 省份 - 拼音首字母或常见简写
  '河北': 'heb',    // he bei
  '山西': 'sx',     // shan xi
  '内蒙古': 'nmg',   // nei meng gu
  '辽宁': 'ln',     // liao ning
  '吉林': 'jl',     // ji lin
  '黑龙江': 'hlj',   // hei long jiang
  '江苏': 'js',     // jiang su
  '浙江': 'zj',     // zhe jiang
  '安徽': 'ah',     // an hui
  '福建': 'fj',     // fu jian
  '江西': 'jx',     // jiang xi
  '山东': 'sd',     // shan dong
  '河南': 'hen',    // he nan
  '湖北': 'hub',    // hu bei
  '湖南': 'hun',    // hu nan
  '广东': 'gd',     // guang dong
  '广西': 'gx',     // guang xi
  '海南': 'han',    // hai nan
  '四川': 'sc',     // si chuan
  '贵州': 'gz',     // gui zhou
  '云南': 'yn',     // yun nan
  '西藏': 'xz',     // xi zang
  '陕西': 'snx',    // shan xi（与山西区分）
  '甘肃': 'gs',     // gan su
  '青海': 'qh',     // qing hai
  '宁夏': 'nx',     // ning xia
  '新疆': 'xj'      // xin jiang
};

// 通用分类拼音简写
const universalPinyinMap = {
  '央视': 'cctv',     // 传统保持
  '卫视': 'ws',       // wei shi
  '付费': 'ff',       // fu fei
  'NewTV': 'ntv',     // new tv
  '港澳台': 'gat',     // gang ao tai
  '通用': 'ty',       // tong yong
  '其他': 'other'     // 保持英文
};

module.exports = {
  categoryRules,
  provincePinyinMap,
  universalPinyinMap
};
