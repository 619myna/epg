# EPG处理器

自动下载、处理并分类EPG数据，生成按省份拼音命名的XML文件。

## 功能特点
- ✅ 自动下载最新EPG数据（支持.gz压缩）
- ✅ 按省份拼音生成独立文件
- ✅ 每个省份文件包含：本地频道 + 全国通用频道
- ✅ 生成完整EPG数据文件
- ✅ 支持GitHub Actions自动更新

## 文件结构

## XML文件直链下载

### 完整数据
- **all.xml** - [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/all.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/all.xml)

### 通用频道分类
| 分类 | 文件名 | 直链地址 |
|------|--------|----------|
| 央视 | cctv.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/cctv.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/cctv.xml) |
| 卫视 | ws.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ws.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ws.xml) |
| 付费 | ff.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ff.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ff.xml) |
| NewTV | ntv.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ntv.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ntv.xml) |
| 港澳台 | gat.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gat.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gat.xml) |
| 通用 | ty.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ty.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ty.xml) |
| 其他 | other.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/other.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/other.xml) |

### 各省份EPG数据
| 省份 | 文件名 | 直链地址 |
|------|--------|----------|
| 北京 | bj.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/bj.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/bj.xml) |
| 上海 | sh.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sh.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sh.xml) |
| 天津 | tj.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/tj.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/tj.xml) |
| 重庆 | cq.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/cq.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/cq.xml) |
| 河北 | heb.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/heb.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/heb.xml) |
| 山西 | sx.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sx.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sx.xml) |
| 内蒙古 | nmg.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/nmg.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/nmg.xml) |
| 辽宁 | ln.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ln.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ln.xml) |
| 吉林 | jl.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/jl.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/jl.xml) |
| 黑龙江 | hlj.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hlj.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hlj.xml) |
| 江苏 | js.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/js.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/js.xml) |
| 浙江 | zj.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/zj.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/zj.xml) |
| 安徽 | ah.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ah.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/ah.xml) |
| 福建 | fj.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/fj.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/fj.xml) |
| 江西 | jx.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/jx.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/jx.xml) |
| 山东 | sd.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sd.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sd.xml) |
| 河南 | hen.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hen.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hen.xml) |
| 湖北 | hub.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hub.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hub.xml) |
| 湖南 | hun.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hun.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/hun.xml) |
| 广东 | gd.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gd.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gd.xml) |
| 广西 | gx.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gx.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gx.xml) |
| 海南 | han.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/han.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/han.xml) |
| 四川 | sc.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sc.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/sc.xml) |
| 贵州 | gz.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gz.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gz.xml) |
| 云南 | yn.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/yn.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/yn.xml) |
| 西藏 | xz.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/xz.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/xz.xml) |
| 陕西 | snx.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/snx.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/snx.xml) |
| 甘肃 | gs.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gs.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/gs.xml) |
| 青海 | qh.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/qh.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/qh.xml) |
| 宁夏 | nx.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/nx.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/nx.xml) |
| 新疆 | xj.xml | [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/xj.xml](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/xj.xml) |

### 索引文件
- **index.json** - [https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/index.json](https://raw.githubusercontent.com/619myna/epg/refs/heads/gh-pages/index.json)

## 使用方法
1. 将上述链接添加到支持XMLTV格式的电视软件中
2. 选择对应省份的XML文件
3. 软件将自动加载EPG数据

## 更新频率
- 数据每日自动更新（通过GitHub Actions）
- 每次更新覆盖原有文件
- 建议客户端设置24小时更新一次
