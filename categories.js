const categoryRules = [
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
    regex: /^4K|CHC|央视|睛彩|卫生健康|风云足球|高尔夫网球|央视文化精品|风云音乐|第一剧场|怀旧剧场|风云剧场|世界地理|电视指南|兵器科技|女性时尚|央视台球|老故事|中学生|发现之旅|每日健身|体育赛事|重温经典|早期教育|环球奇观|中国交通|中国天气|书画|百姓健康|优优宝贝|生态环境|中医药|足球|四海钓鱼|快乐垂钓|劲爆体育|天元围棋|武术世界|新动漫|动漫秀场|游戏风云|都市剧场|欢笑剧场|生活时尚|新视觉|求索|精彩影视|家庭理财|东方财经|乐游|法治天地|金色学堂|财富天下|陶瓷|梨园|文物宝库|国学|茶|汽摩|证券服务/gi, 
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
    regex: /香港|RTHK|TVB|HOY|HBO|CINEMAX|CMC|POPC|NHK|NOW|ELTA|SBN|Star|有线|无线|凤凰|翡翠|美亚|明珠|澳门|澳|台湾|台视|纬来|民视|东森|天映|中视|中天|华视|三立|八大|靖天|壹电视|原住民族|亚洲/gi, 
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
  { name: '北京', regex: /北京|BTV|BRTV|京视|北广/gi, isUniversal: false, priority: 101 },
  { name: '上海', regex: /上海|东方|上视|东方财经|新闻综合|第一财经|五星体育|东方影视|上海都市|金色学堂|都市剧场|动漫秀场|生活时尚|欢笑剧场|法治天地|游戏风云|哈哈炫动/gi, isUniversal: false, priority: 102 },
  { name: '天津', regex: /天津/gi, isUniversal: false, priority: 103 },
  { name: '重庆', regex: /重庆/gi, isUniversal: false, priority: 104 },
  { name: '河北', regex: /河北|石家庄|唐山|秦皇岛|邯郸|邢台|保定|张家口|承德|沧州|廊坊|衡水/gi, isUniversal: false, priority: 105 },
  { name: '山西', regex: /山西|太原|大同|阳泉|长治|晋城|朔州|晋中|运城|忻州|临汾|吕梁|黄河/gi, isUniversal: false, priority: 106 },
  { name: '内蒙古', regex: /内蒙古|呼和浩特|包头|乌海|赤峰|通辽|鄂尔多斯|呼伦贝尔|乌兰察布/gi, isUniversal: false, priority: 107 },
  { name: '辽宁', regex: /辽宁|沈阳|大连|鞍山|抚顺|本溪|丹东|锦州|营口|阜新|辽阳|盘锦|铁岭|朝阳|葫芦岛|辽河/gi, isUniversal: false, priority: 108 },
  { name: '吉林', regex: /吉林|长春|吉林市|四平|辽源|通化|松原|白城|吉视|延边/gi, isUniversal: false, priority: 109 },
  { name: '黑龙江', regex: /黑龙江|哈尔滨|齐齐哈尔|鸡西|鹤岗|双鸭山|大庆|伊春|佳木斯|七台河|牡丹江|黑河|绥化|北大荒/gi, isUniversal: false, priority: 110 },
  { name: '江苏', regex: /江苏|南京|无锡|徐州|常州|苏州|南通|连云港|淮安|盐城|扬州|镇江|泰州|宿迁|吴江|武进|常熟|CCTV/gi, isUniversal: false, priority: 111 },
  { name: '浙江', regex: /浙江|杭州|宁波|温州|嘉兴|湖州|绍兴|金华|衢州|舟山|台州|丽水|之江|义乌|瑞安|苍南|长兴|永嘉|普陀|诸暨|镇海|钱江|华数|淘/gi, isUniversal: false, priority: 112 },
  { name: '安徽', regex: /安徽|合肥|芜湖|蚌埠|淮南|马鞍山|淮北|铜陵|安庆|黄山|滁州|毫州|阜阳|宿州|六安|巢湖|天长/gi, isUniversal: false, priority: 113 },
  { name: '福建', regex: /福建|福州|厦门|莆田|三明|泉州|漳州|南平|龙岩|宁德|晋江|仙游/gi, isUniversal: false, priority: 114 },
  { name: '江西', regex: /江西|南昌|景德镇|萍乡|九江|新余|鹰潭|赣州|吉安|宜春|抚州|上饶|吉州/gi, isUniversal: false, priority: 115 },
  { name: '山东', regex: /山东|济南|青岛|淄博|枣庄|东营|烟台|潍坊|济宁|泰安|威海|日照|临沂|德州|聊城|滨州|菏泽|莱芜|泰山|胜利油田/gi, isUniversal: false, priority: 116 },
  { name: '河南', regex: /河南|郑州|开封|洛阳|平顶山|安阳|鹤壁|新乡|焦作|濮阳|许昌|漯河|三门峡|南阳|商丘|信阳|周口|驻马店|济源/gi, isUniversal: false, priority: 117 },
  { name: '湖北', regex: /湖北|武汉|黄石|十堰|宜昌|襄阳|鄂州|荆门|孝感|荆州|黄冈|咸宁|随州/gi, isUniversal: false, priority: 118 },
  { name: '湖南', regex: /湖南|长沙|株洲|湘潭|衡阳|邵阳|岳阳|常德|张家界|益阳|郴州|永州|怀化|娄底|鼎城|桃源|湘|津市/gi, isUniversal: false, priority: 119 },
  { name: '广东', regex: /广东|广州|韶关|深圳|珠海|汕头|佛山|江门|湛江|茂名|肇庆|惠州|梅州|汕尾|河源|阳江|清远|东莞|中山|潮州|揭阳|云浮|潮安|岭南|蛇口|南方|珠江|深视|客家/gi, isUniversal: false, priority: 120 },
  { name: '广西', regex: /广西|南宁|柳州|桂林|梧州|北海|防城港|钦州|贵港|玉林|百色|贺州|河池|来宾|崇左/gi, isUniversal: false, priority: 121 },
  { name: '海南', regex: /海南|海口|三亚/gi, isUniversal: false, priority: 122 },
  { name: '四川', regex: /四川|成都|自贡|攀枝花|泸州|德阳|绵阳|广元|遂宁|内江|乐山|南充|眉山|宜宾|广安|达州|雅安|巴中|资阳|凉山|峨/gi, isUniversal: false, priority: 123 },
  { name: '贵州', regex: /贵州|贵阳|六盘水|遵义|安顺|毕节|铜仁/gi, isUniversal: false, priority: 124 },
  { name: '云南', regex: /云南|昆明|曲靖|玉溪|保山|昭通|丽江|普洱|临沧|西双版纳|德宏|迪庆|红河/gi, isUniversal: false, priority: 125 },
  { name: '西藏', regex: /西藏|拉萨|日喀则|昌都|林芝|山南|那曲|阿里/gi, isUniversal: false, priority: 126 },
  { name: '陕西', regex: /陕西|西安|铜川|宝鸡|咸阳|渭南|延安|汉中|榆林|安康|商洛/gi, isUniversal: false, priority: 127 },
  { name: '甘肃', regex: /甘肃|兰州|嘉峪关|金昌|白银|天水|武威|张掖|平凉|酒泉|庆阳|定西|陇南|临夏/gi, isUniversal: false, priority: 128 },
  { name: '青海', regex: /青海|西宁|海东/gi, isUniversal: false, priority: 129 },
  { name: '宁夏', regex: /宁夏|银川|石嘴山|吴忠|固原|中卫/gi, isUniversal: false, priority: 130 },
  { name: '新疆', regex: /新疆|乌鲁木齐|维吾尔|哈萨克|塔城|昌吉/gi, isUniversal: false, priority: 131 }
  
  // 注意：删除了"其他"规则
];

const provincePinyinMap = {
  '北京': 'bj',
  '上海': 'sh',
  '天津': 'tj',
  '重庆': 'cq',
  '河北': 'heb',
  '山西': 'sx',
  '内蒙古': 'nmg',
  '辽宁': 'ln',
  '吉林': 'jl',
  '黑龙江': 'hlj',
  '江苏': 'js',
  '浙江': 'zj',
  '安徽': 'ah',
  '福建': 'fj',
  '江西': 'jx',
  '山东': 'sd',
  '河南': 'hen',
  '湖北': 'hub',
  '湖南': 'hun',
  '广东': 'gd',
  '广西': 'gx',
  '海南': 'han',
  '四川': 'sc',
  '贵州': 'gz',
  '云南': 'yn',
  '西藏': 'xz',
  '陕西': 'snx',
  '甘肃': 'gs',
  '青海': 'qh',
  '宁夏': 'nx',
  '新疆': 'xj'
};

const universalPinyinMap = {
  '央视': 'cctv',
  '卫视': 'ws',
  '付费': 'ff',
  'NewTV': 'ntv',
  '港澳台': 'gat',
  '通用': 'ty',
  '其他': 'other'  // 保留映射，用于显示
};

module.exports = {
  categoryRules,
  provincePinyinMap,
  universalPinyinMap
};
