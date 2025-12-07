const fs = require('fs');
const path = require('path');
const { provincePinyinMap, universalPinyinMap } = require('./categories.js');

class EPGSplitter {
  constructor(outputDir = 'output') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
    
    // ========== 移植的频道清洗代码 ==========
    // 频道名称缓存
    this.nameCache = new Map();
    
    // 移植的频道正则表达式
    this.channelRegex = /<channel\b[^>]*?\bid="([^"]+)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]+)<\/display-name>[\s\S]*?<\/channel>/gi;
    
    // 移植的频道名称清洗函数
    this.cleanChannelName = function(name) {
      if (this.nameCache.has(name)) return this.nameCache.get(name);
      
      const cleaned = name  
        .replace(/\s+|[()（）－_—·•-]|频道|超清|HD|高清(?![^()（）]*[电影])/gi, '')
        .replace(/(CCTV)(\d+)(\+?)[\u4e00-\u9fa5]+(?!欧洲|美洲)/gi, '$1$2$3')
        .trim();
        
      const result = { original: name, cleaned: cleaned, upper: cleaned.toUpperCase() };
      this.nameCache.set(name, result);
      return result;
    }.bind(this);
  }
  
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
  
  getChineseTime() {
    return new Date(Date.now() + 8 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  }
  
  // 新增：格式化文件大小方法（统一使用MB）
  formatFileSizeMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
  }
  
  // 新增：格式化 XML 片段的方法
  formatXmlFragment(fragment, indent = 2) {
    // 移除片段两端的空白字符
    let cleanFragment = fragment.trim();
    
    // 修复可能缺少的闭合标签
    if (cleanFragment.startsWith('<programme') && !cleanFragment.endsWith('</programme>')) {
      // 尝试修复不完整的 programme 标签
      if (!cleanFragment.endsWith('>')) {
        cleanFragment += '>';
      }
    }
    
    // 添加缩进
    const indentStr = ' '.repeat(indent);
    const lines = cleanFragment.split('\n');
    
    // 对每一行进行缩进
    return lines.map(line => {
      const trimmed = line.trim();
      return trimmed ? indentStr + trimmed : '';
    }).filter(line => line !== '').join('\n');
  }
  
  // 新增：提取频道片段的方法（使用移植的清洗逻辑）
  extractChannelFragments(data) {
    console.log('  🔧 提取并清洗频道数据...');
    
    const channelFragments = [];
    const channelMap = new Map(); // 用于去重
    let match;
    
    // 重置正则表达式的lastIndex
    this.channelRegex.lastIndex = 0;
    
    while ((match = this.channelRegex.exec(data)) !== null) {
      const channelId = match[1];
      const channelName = match[2].trim();
      const fullMatch = match[0];
      
      // 清洗频道名称
      const nameResult = this.cleanChannelName(channelName);
      const cleanedName = nameResult.cleaned;
      
      // 去重：检查是否已经处理过相同的清洗后名称
      if (!channelMap.has(cleanedName)) {
        // 创建清洗后的频道XML片段
        const cleanedXml = fullMatch.replace(
          /<display-name[^>]*>([^<]+)<\/display-name>/i,
          `<display-name lang="CN">${cleanedName}</display-name>`
        );
        
        channelFragments.push(cleanedXml);
        channelMap.set(cleanedName, {
          id: channelId,
          name: cleanedName,
          originalName: channelName,
          xml: cleanedXml
        });
      }
    }
    
    console.log(`    原始提取: ${channelMap.size} 个唯一频道`);
    
    return {
      fragments: channelFragments,
      map: channelMap
    };
  }
  
  // 新增：提取节目片段的方法
  extractProgrammeFragments(data) {
    console.log('  📺 提取节目数据...');
    
    const programmeFragments = [];
    const programmeRegex = /<programme[^>]*>[\s\S]*?<\/programme>/gi;
    let match;
    
    programmeRegex.lastIndex = 0;
    
    while ((match = programmeRegex.exec(data)) !== null) {
      programmeFragments.push(match[0]);
    }
    
    console.log(`    提取到: ${programmeFragments.length} 个节目片段`);
    return programmeFragments;
  }
  
  // 修改：主拆分方法，添加数据处理步骤
  split(data) {
    console.log('🗂️ 开始处理EPG数据...');
    
    // 第一步：提取并清洗频道数据
    const { fragments: channelFragments, map: channelMap } = this.extractChannelFragments(data);
    
    // 第二步：提取节目数据
    const programmeFragments = this.extractProgrammeFragments(data);
    
    console.log('  📊 拆分EPG数据...');
    
    // 提取频道信息（现在使用清洗后的数据）
    const channels = this.extractChannelInfo(channelFragments);
    
    // 分离频道：通过计算确定其他频道
    const { universalChannels, provinceChannels, otherChannels } = this.separateChannels(channels);
    
    // 获取所有通用频道（包括其他频道）
    const allUniversalChannels = this.getAllUniversalChannels(universalChannels, otherChannels);
    
    // 生成各省份文件（现在传递节目数据）
    const provinceFiles = this.generateProvinceFiles(
      provinceChannels, 
      allUniversalChannels, 
      channelFragments,
      programmeFragments  // 新增：传递节目数据
    );
    
    // 生成通用分类文件（现在传递节目数据）
    const universalFiles = this.generateUniversalFiles(
      universalChannels, 
      channelFragments,
      programmeFragments  // 新增：传递节目数据
    );
    
    // 生成完整数据文件
    const completeFile = this.generateCompleteFile(channelFragments, programmeFragments);
    
    // 生成索引文件
    const indexData = this.generateIndexFile(
      provinceChannels, 
      universalChannels, 
      otherChannels,
      provinceFiles, 
      universalFiles, 
      completeFile
    );
    
    console.log('🎉 处理完成！');
    
    return {
      provinceFiles,
      universalFiles,
      completeFile,
      indexData,
      channelStats: {
        originalCount: channelMap.size,
        cleanedCount: channelFragments.length,
        duplicateRemoved: channelMap.size - channelFragments.length
      }
    };
  }
  
  extractChannelInfo(channelFragments) {
    return channelFragments.map(fragment => {
      const idMatch = fragment.match(/id="([^"]+)"/);
      const nameMatch = fragment.match(/<display-name[^>]*>([^<]+)<\/display-name>/);
      
      return {
        xml: fragment,
        id: idMatch ? idMatch[1] : '',
        name: nameMatch ? nameMatch[1] : '未知频道'
      };
    });
  }
  
  separateChannels(channels) {
    console.log('  📊 分离频道数据...');
    
    const universalChannels = {};
    const provinceChannels = {};
    const otherChannels = [];
    
    // 获取分类规则（已删除"其他"规则）
    const { categoryRules } = require('./categories.js');
    
    // 已匹配的频道ID集合
    const matchedChannelIds = new Set();
    
    // 第一轮：用主要规则匹配
    channels.forEach(channel => {
      const { name, id } = channel;
      let matched = false;
      
      // 按优先级排序
      const sortedRules = [...categoryRules].sort((a, b) => a.priority - b.priority);
      
      for (const rule of sortedRules) {
        // 创建新的正则对象，避免 g 标志的状态问题
        let flags = rule.regex.flags;
        
        // 1. 移除 g 标志
        flags = flags.replace('g', '');
        
        // 2. 确保有 i 标志（不区分大小写）
        if (!flags.includes('i')) {
          flags += 'i';
        }
        
        const regex = new RegExp(rule.regex.source, flags);
        
        if (regex.test(name)) {
          channel.category = rule.name;
          channel.isUniversal = rule.isUniversal;
          matchedChannelIds.add(id);
          
          if (rule.isUniversal) {
            if (!universalChannels[rule.name]) {
              universalChannels[rule.name] = [];
            }
            universalChannels[rule.name].push(channel);
          } else {
            if (!provinceChannels[rule.name]) {
              provinceChannels[rule.name] = [];
            }
            provinceChannels[rule.name].push(channel);
          }
          
          matched = true;
          break;
        }
      }
    });
    
    // 第二轮：找出未匹配的频道作为"其他"
    channels.forEach(channel => {
      if (!matchedChannelIds.has(channel.id)) {
        channel.category = '其他';
        channel.isUniversal = true;
        otherChannels.push(channel);
      }
    });
    
    // 如果需要，把"其他"作为一个分类显示
    if (otherChannels.length > 0) {
      universalChannels['其他'] = otherChannels;
    }
    
    console.log(`    通用频道: ${Object.keys(universalChannels).length} 类`);
    console.log(`    省份频道: ${Object.keys(provinceChannels).length} 个省份`);
    console.log(`    其他频道: ${otherChannels.length} 个（通过计算得出）`);
    
    return { universalChannels, provinceChannels, otherChannels };
  }
  
  getAllUniversalChannels(universalChannels, otherChannels) {
    const allChannels = [];
    
    for (const [category, channels] of Object.entries(universalChannels)) {
      allChannels.push(...channels);
    }
    
    console.log(`  📦 通用频道池: ${allChannels.length} 个频道（含${otherChannels.length}个其他频道）`);
    
    return allChannels;
  }
  
  // 新增：过滤节目数据的方法
  filterProgrammesByChannels(programmeFragments, channelIds) {
    if (!programmeFragments || programmeFragments.length === 0) {
      return [];
    }
    
    const channelIdSet = new Set(channelIds);
    return programmeFragments.filter(fragment => {
      const channelMatch = fragment.match(/channel="([^"]+)"/);
      return channelMatch && channelIdSet.has(channelMatch[1]);
    });
  }
  
  generateProvinceFiles(provinceChannels, allUniversalChannels, channelFragments, programmeFragments) {
    console.log('  🌏 生成省份文件...');
    
    const generatedFiles = [];
    const channelMap = new Map();
    
    // 创建频道ID到片段的映射
    channelFragments.forEach(fragment => {
      const idMatch = fragment.match(/id="([^"]+)"/);
      if (idMatch) {
        channelMap.set(idMatch[1], fragment);
      }
    });
    
    for (const [provinceName, channels] of Object.entries(provinceChannels)) {
      const pinyin = provincePinyinMap[provinceName];
      if (!pinyin) {
        console.warn(`    ⚠️ 未找到省份 ${provinceName} 的拼音映射`);
        continue;
      }
      
      // 统计其他频道数量
      const otherChannels = allUniversalChannels.filter(c => c.category === '其他');
      const realUniversalChannels = allUniversalChannels.filter(c => c.category !== '其他');
      
      const xmlContent = this.generateProvinceXml(
        provinceName, 
        pinyin, 
        channels, 
        realUniversalChannels, 
        otherChannels, 
        channelMap,
        programmeFragments  // 新增：传递节目数据
      );
      
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      fs.writeFileSync(filePath, xmlContent, 'utf-8');
      
      // 统计节目数量
      const allChannelIds = [
        ...channels.map(c => c.id),
        ...realUniversalChannels.map(c => c.id),
        ...otherChannels.map(c => c.id)
      ];
      const relevantProgrammes = this.filterProgrammesByChannels(programmeFragments, allChannelIds);
      
      // 统一使用 MB 单位
      const fileSizeMB = this.formatFileSizeMB(Buffer.byteLength(xmlContent, 'utf-8'));
      
      generatedFiles.push({
        province: provinceName,
        pinyin: pinyin,
        fileName: fileName,
        localChannelCount: channels.length,
        universalChannelCount: realUniversalChannels.length,
        otherChannelCount: otherChannels.length,
        programmeCount: relevantProgrammes.length,
        totalChannelCount: channels.length + realUniversalChannels.length + otherChannels.length,
        fileSize: fileSizeMB  // 使用 MB 单位
      });
      
      console.log(`    ✅ ${fileName} - ${provinceName} (${channels.length}本地+${realUniversalChannels.length}通用+${otherChannels.length}其他, ${relevantProgrammes.length}节目, ${fileSizeMB})`);
    }
    
    return generatedFiles;
  }
  
  generateProvinceXml(provinceName, pinyin, provinceChannels, universalChannels, otherChannels, channelMap, programmeFragments) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- ${provinceName}电视频道 (${pinyin}.xml) -->\n`;
    xml += `  <!-- 生成时间：${this.getChineseTime()} -->\n`;
    xml += `  <!-- 包含：${provinceName}本地频道 + 全国通用频道（含未分类频道） -->\n`;
    
    // 计算频道总数
    const totalChannelCount = provinceChannels.length + universalChannels.length + otherChannels.length;
    xml += `  <!-- 共 ${totalChannelCount} 个频道 -->\n\n`;
    
    // 1. 本省频道
    if (provinceChannels.length > 0) {
      xml += `  <!-- ${provinceName}本地频道 (${provinceChannels.length}个) -->\n`;
      provinceChannels.forEach(channel => {
        const fragment = channelMap.get(channel.id);
        if (fragment) {
          xml += this.formatXmlFragment(fragment) + '\n';
        }
      });
      xml += '\n';
    }
    
    // 2. 通用频道
    if (universalChannels.length > 0) {
      xml += `  <!-- 全国通用频道 (${universalChannels.length}个) -->\n`;
      
      // 按类别分组
      const grouped = {};
      universalChannels.forEach(channel => {
        const category = channel.category || '其他';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(channel);
      });
      
      // 输出分组
      Object.entries(grouped).forEach(([category, channels]) => {
        xml += `  <!-- ${category} (${channels.length}个) -->\n`;
        channels.forEach(channel => {
          const fragment = channelMap.get(channel.id);
          if (fragment) {
            xml += this.formatXmlFragment(fragment) + '\n';
          }
        });
        xml += '\n';
      });
    }
    
    // 3. 其他频道
    if (otherChannels.length > 0) {
      xml += `  <!-- 其他频道 (${otherChannels.length}个) -->\n`;
      xml += `  <!-- 注：以下频道未能自动分类到具体类别 -->\n`;
      otherChannels.forEach(channel => {
        const fragment = channelMap.get(channel.id);
        if (fragment) {
          xml += this.formatXmlFragment(fragment) + '\n';
        }
      });
      xml += '\n';
    }
    
    // 4. 新增：节目信息
    const allChannelIds = [
      ...provinceChannels.map(c => c.id),
      ...universalChannels.map(c => c.id),
      ...otherChannels.map(c => c.id)
    ];
    
    const relevantProgrammes = this.filterProgrammesByChannels(programmeFragments, allChannelIds);
    
    if (relevantProgrammes.length > 0) {
      xml += `  <!-- 节目列表 -->\n`;
      xml += `  <!-- 共 ${relevantProgrammes.length} 个节目 -->\n`;
      relevantProgrammes.forEach(fragment => {
        xml += this.formatXmlFragment(fragment) + '\n';
      });
    } else {
      xml += `  <!-- 节目列表 -->\n`;
      xml += `  <!-- 未找到相关节目信息 -->\n`;
    }
    
    xml += '</tv>';
    return xml;
  }
  
  generateUniversalFiles(universalChannels, channelFragments, programmeFragments) {
    console.log('  🌐 生成通用频道文件...');
    
    const generatedFiles = [];
    const channelMap = new Map();
    
    // 创建频道映射
    channelFragments.forEach(fragment => {
      const idMatch = fragment.match(/id="([^"]+)"/);
      if (idMatch) {
        channelMap.set(idMatch[1], fragment);
      }
    });
    
    for (const [category, channels] of Object.entries(universalChannels)) {
      if (channels.length === 0) continue;
      
      const pinyin = universalPinyinMap[category];
      if (!pinyin) {
        console.warn(`    ⚠️ 未找到通用分类 ${category} 的拼音映射`);
        continue;
      }
      
      // 筛选相关节目
      const channelIds = channels.map(c => c.id);
      const relevantProgrammes = this.filterProgrammesByChannels(programmeFragments, channelIds);
      
      // 生成XML内容
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
      xml += `  <!-- ${category}频道 (${pinyin}.xml) -->\n`;
      xml += `  <!-- 共 ${channels.length} 个频道 -->\n`;
      xml += `  <!-- 共 ${relevantProgrammes.length} 个节目 -->\n`;
      xml += `  <!-- 生成时间：${this.getChineseTime()} -->\n\n`;
      
      // 添加频道片段（使用格式化方法）
      channels.forEach(channel => {
        const fragment = channelMap.get(channel.id);
        if (fragment) {
          xml += this.formatXmlFragment(fragment) + '\n';
        }
      });
      
      // 添加节目片段（使用格式化方法）
      if (relevantProgrammes.length > 0) {
        xml += `\n  <!-- 节目列表 -->\n`;
        relevantProgrammes.forEach(fragment => {
          xml += this.formatXmlFragment(fragment) + '\n';
        });
      }
      
      xml += '</tv>';
      
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      fs.writeFileSync(filePath, xml, 'utf-8');
      
      // 统一使用 MB 单位
      const fileSizeMB = this.formatFileSizeMB(Buffer.byteLength(xml, 'utf-8'));
      
      generatedFiles.push({
        category: category,
        pinyin: pinyin,
        fileName: fileName,
        channelCount: channels.length,
        programmeCount: relevantProgrammes.length,
        fileSize: fileSizeMB  // 使用 MB 单位
      });
      
      console.log(`    ✅ ${fileName} - ${category} (${channels.length}频道, ${relevantProgrammes.length}节目, ${fileSizeMB})`);
    }
    
    return generatedFiles;
  }
  
  generateCompleteFile(channelFragments, programmeFragments) {
    console.log('  📦 生成完整EPG文件...');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- 完整EPG数据 (all.xml) -->\n`;
    xml += `  <!-- 生成时间：${this.getChineseTime()} -->\n`;
    xml += `  <!-- 包含 ${channelFragments.length} 个频道，${programmeFragments.length} 个节目 -->\n\n`;
    
    // 添加频道片段（使用格式化方法）
    xml += `  <!-- 频道列表 -->\n`;
    channelFragments.forEach(fragment => {
      xml += this.formatXmlFragment(fragment) + '\n';
    });
    
    // 添加节目片段（使用格式化方法）
    if (programmeFragments.length > 0) {
      xml += `\n  <!-- 节目列表 -->\n`;
      programmeFragments.forEach(fragment => {
        xml += this.formatXmlFragment(fragment) + '\n';
      });
    }
    
    xml += '</tv>';
    
    const filePath = path.join(this.outputDir, 'all.xml');
    fs.writeFileSync(filePath, xml, 'utf-8');
    
    // 统一使用 MB 单位
    const fileSizeMB = this.formatFileSizeMB(Buffer.byteLength(xml, 'utf-8'));
    
    console.log(`    ✅ all.xml - ${channelFragments.length}频道 ${programmeFragments.length}节目 (${fileSizeMB})`);
    
    return {
      fileName: 'all.xml',
      channelCount: channelFragments.length,
      programmeCount: programmeFragments.length,
      fileSize: fileSizeMB  // 使用 MB 单位
    };
  }
  
  generateIndexFile(provinceChannels, universalChannels, otherChannels, provinceFiles, universalFiles, completeFile) {
    console.log('  📋 生成索引文件...');
    
    const indexData = {
      updateTime: new Date().toISOString(),
      files: {
        provinces: {},
        universal: {},
        complete: {}
      },
      summary: {
        totalProvinces: Object.keys(provinceChannels).length,
        totalUniversalCategories: Object.keys(universalChannels).length,
        provinceChannelCount: Object.values(provinceChannels)
          .reduce((sum, channels) => sum + channels.length, 0),
        universalChannelCount: Object.values(universalChannels)
          .reduce((sum, channels) => sum + channels.length, 0),
        otherChannelCount: otherChannels.length,
        totalChannels: completeFile.channelCount,
        totalProgrammes: completeFile.programmeCount,
        generatedFiles: provinceFiles.length + universalFiles.length + 2
      }
    };
    
    // 填充省份文件信息
    provinceFiles.forEach(file => {
      indexData.files.provinces[file.pinyin] = {
        name: file.province,
        file: file.fileName,
        localChannelCount: file.localChannelCount,
        universalChannelCount: file.universalChannelCount,
        otherChannelCount: file.otherChannelCount,
        programmeCount: file.programmeCount || 0,
        totalChannelCount: file.totalChannelCount,
        fileSize: file.fileSize  // 已经是 MB 单位
      };
    });
    
    // 填充通用文件信息
    universalFiles.forEach(file => {
      indexData.files.universal[file.pinyin] = {
        name: file.category,
        file: file.fileName,
        channelCount: file.channelCount,
        programmeCount: file.programmeCount || 0,
        fileSize: file.fileSize  // 已经是 MB 单位
      };
    });
    
    // 填充完整文件信息
    indexData.files.complete = {
      all: {
        file: 'all.xml',
        channelCount: completeFile.channelCount,
        programmeCount: completeFile.programmeCount,
        fileSize: completeFile.fileSize  // 已经是 MB 单位
      }
    };
    
    const indexPath = path.join(this.outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    
    console.log('    ✅ index.json - 索引文件');
    
    return indexData;
  }
}

module.exports = EPGSplitter;
