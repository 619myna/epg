const fs = require('fs');
const path = require('path');
const { provincePinyinMap, universalPinyinMap } = require('./categories.js');

class EPGSplitter {
  constructor(outputDir = 'output') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }
  
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
  
  async split(epgData) {
    const { channels, programmes } = epgData;
    
    console.log('🗂️ 拆分EPG数据...');
    
    // 分离频道：通用频道、省份频道、其他频道
    const { universalChannels, provinceChannels, otherChannels } = this.separateChannels(channels);
    
    // 获取所有通用频道（包括"其他"频道）
    const allUniversalChannels = this.getAllUniversalChannels(universalChannels, otherChannels);
    
    // 生成各省份文件（包含：本省频道 + 所有通用频道）
    const provinceFiles = await this.generateProvinceFiles(provinceChannels, allUniversalChannels);
    
    // 生成通用分类文件
    const universalFiles = await this.generateUniversalFiles(universalChannels);
    
    // 生成完整数据文件
    const completeFile = this.generateCompleteFile(channels, programmes);
    
    // 生成索引文件
    const indexData = this.generateIndexFile(
      provinceChannels, 
      universalChannels, 
      otherChannels,
      provinceFiles, 
      universalFiles, 
      completeFile
    );
    
    console.log('🎉 拆分完成！');
    
    return {
      provinceFiles,
      universalFiles,
      completeFile,
      indexData
    };
  }
  
  separateChannels(channels) {
    console.log('  📊 分离频道数据...');
    
    const universalChannels = {};
    const provinceChannels = {};
    const otherChannels = [];
    
    channels.forEach(channel => {
      const { category, isUniversal } = channel;
      
      if (category === '其他') {
        // "其他"频道单独存放
        otherChannels.push(channel);
      } else if (isUniversal) {
        // 通用频道（央视、卫视等）
        if (!universalChannels[category]) {
          universalChannels[category] = [];
        }
        universalChannels[category].push(channel);
      } else {
        // 省份频道
        if (!provinceChannels[category]) {
          provinceChannels[category] = [];
        }
        provinceChannels[category].push(channel);
      }
    });
    
    console.log(`    通用频道: ${Object.keys(universalChannels).length} 类`);
    console.log(`    省份频道: ${Object.keys(provinceChannels).length} 个省份`);
    console.log(`    其他频道: ${otherChannels.length} 个（将添加到所有省份文件）`);
    
    // 显示"其他"频道示例
    if (otherChannels.length > 0) {
      console.log('    📋 其他频道示例：');
      otherChannels.slice(0, 5).forEach((ch, i) => {
        console.log(`      ${i+1}. ${ch.name} (${ch.id})`);
      });
      if (otherChannels.length > 5) {
        console.log(`      ... 还有 ${otherChannels.length - 5} 个`);
      }
    }
    
    return { universalChannels, provinceChannels, otherChannels };
  }
  
  getAllUniversalChannels(universalChannels, otherChannels) {
    // 合并所有通用频道和"其他"频道
    const allChannels = [];
    
    // 添加通用频道（央视、卫视等）
    for (const [category, channels] of Object.entries(universalChannels)) {
      allChannels.push(...channels);
    }
    
    // 添加"其他"频道
    allChannels.push(...otherChannels);
    
    console.log(`  📦 通用频道池: ${allChannels.length} 个频道（含${otherChannels.length}个"其他"频道）`);
    
    return allChannels;
  }
  
  async generateProvinceFiles(provinceChannels, allUniversalChannels) {
    console.log('  🌏 生成省份文件（分批处理，间隔150ms）...');
    
    const generatedFiles = [];
    const provinces = Object.entries(provinceChannels);
    const batchSize = 5;     // 每批5个文件
    const delayMs = 150;     // 批次间隔150ms
    
    // 计算批次信息
    const totalBatches = Math.ceil(provinces.length / batchSize);
    console.log(`    总共 ${provinces.length} 个省份，分 ${totalBatches} 批处理，每批间隔 ${delayMs}ms`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, provinces.length);
      const batch = provinces.slice(batchStart, batchEnd);
      
      console.log(`    📦 批次 ${batchIndex + 1}/${totalBatches}：处理 ${batch.length} 个省份`);
      
      // 生成当前批次的所有文件
      batch.forEach(([provinceName, channels], indexInBatch) => {
        const pinyin = provincePinyinMap[provinceName];
        if (!pinyin) {
          console.warn(`      ⚠️ 跳过 ${provinceName}（无拼音映射）`);
          return;
        }
        
        // 合并频道：本省频道 + 所有通用频道
        const allChannels = [...channels, ...allUniversalChannels];
        const fileName = `${pinyin}.xml`;
        const filePath = path.join(this.outputDir, fileName);
        
        // 生成XML内容
        const xmlContent = this.generateProvinceXml(provinceName, pinyin, allChannels);
        
        try {
          // 写入文件
          fs.writeFileSync(filePath, xmlContent, 'utf-8');
          const fileSize = Buffer.byteLength(xmlContent, 'utf-8');
          const fileSizeKB = (fileSize / 1024).toFixed(2);
          
          // 统计"其他"频道数量
          const otherCount = allUniversalChannels.filter(c => c.category === '其他').length;
          const realUniversalCount = allUniversalChannels.length - otherCount;
          
          generatedFiles.push({
            province: provinceName,
            pinyin: pinyin,
            fileName: fileName,
            localChannelCount: channels.length,
            universalChannelCount: realUniversalCount,
            otherChannelCount: otherCount,
            totalChannelCount: allChannels.length,
            fileSize: `${fileSizeKB}KB`
          });
          
          console.log(`      ✅ ${fileName} - ${provinceName} (${channels.length}本地+${realUniversalCount}通用+${otherCount}其他，${fileSizeKB}KB)`);
        } catch (error) {
          console.error(`      ❌ ${fileName} - 写入失败: ${error.message}`);
        }
      });
      
      // 批次间延迟（除了最后一批）
      if (batchIndex < totalBatches - 1) {
        console.log(`      ⏸️  等待 ${delayMs}ms 继续下一批...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // 生成完成统计
    const successCount = generatedFiles.length;
    console.log(`    🎯 完成：${successCount}/${provinces.length} 个省份文件生成成功`);
    
    if (successCount < provinces.length) {
      console.log(`    ⚠️  有 ${provinces.length - successCount} 个省份文件生成失败或被跳过`);
    }
    
    return generatedFiles;
  }
  
  generateProvinceXml(provinceName, pinyin, channels) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- ${provinceName}电视频道 (${pinyin}.xml) -->\n`;
    xml += `  <!-- 包含：${provinceName}本地频道 + 全国通用频道（含未分类频道） -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
    xml += `  <!-- 共 ${channels.length} 个频道 -->\n\n`;
    
    // 分离三类频道
    const localChannels = channels.filter(c => !c.isUniversal && c.category !== '其他');
    const realUniversalChannels = channels.filter(c => c.isUniversal && c.category !== '其他');
    const otherChannels = channels.filter(c => c.category === '其他');
    
    // 1. 本省频道
    if (localChannels.length > 0) {
      xml += `  <!-- ${provinceName}本地频道 (${localChannels.length}个) -->\n`;
      localChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
      xml += '\n';
    }
    
    // 2. 通用频道（央视、卫视等）
    if (realUniversalChannels.length > 0) {
      const groupedChannels = this.groupChannelsByCategory(realUniversalChannels);
      
      xml += `  <!-- 全国通用频道 (${realUniversalChannels.length}个) -->\n`;
      
      for (const [category, catChannels] of Object.entries(groupedChannels)) {
        xml += `  <!-- ${category} (${catChannels.length}个) -->\n`;
        catChannels.forEach(channel => {
          xml += this.buildChannelXml(channel);
        });
        xml += '\n';
      }
    }
    
    // 3. 其他频道
    if (otherChannels.length > 0) {
      xml += `  <!-- 其他频道 (${otherChannels.length}个) -->\n`;
      xml += `  <!-- 注：以下频道未能自动分类到具体类别 -->\n`;
      otherChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
      xml += '\n';
    }
    
    xml += '</tv>';
    return xml;
  }
  
  async generateUniversalFiles(universalChannels) {
    console.log('  🌐 生成通用频道文件（间隔150ms）...');
    
    const generatedFiles = [];
    const categories = Object.entries(universalChannels);
    
    for (let i = 0; i < categories.length; i++) {
      const [category, channels] = categories[i];
      
      if (channels.length === 0) continue;
      
      const pinyin = universalPinyinMap[category];
      if (!pinyin) {
        console.warn(`    ⚠️ 跳过 ${category}（无拼音映射）`);
        continue;
      }
      
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      
      const xmlContent = this.generateUniversalXml(category, pinyin, channels);
      
      try {
        fs.writeFileSync(filePath, xmlContent, 'utf-8');
        const fileSize = Buffer.byteLength(xmlContent, 'utf-8');
        const fileSizeKB = (fileSize / 1024).toFixed(2);
        
        generatedFiles.push({
          category: category,
          pinyin: pinyin,
          fileName: fileName,
          channelCount: channels.length,
          fileSize: `${fileSizeKB}KB`
        });
        
        console.log(`    ✅ ${fileName} - ${category} (${channels.length}个频道，${fileSizeKB}KB)`);
      } catch (error) {
        console.error(`    ❌ ${fileName} - 写入失败: ${error.message}`);
      }
      
      // 每个文件间隔150ms
      if (i < categories.length - 1) {
        console.log(`    ⏸️  等待150ms继续下一个...`);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    console.log(`    🎯 完成：${generatedFiles.length}/${categories.length} 个通用文件生成成功`);
    
    return generatedFiles;
  }
  
  generateUniversalXml(category, pinyin, channels) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- ${category}频道 (${pinyin}.xml) -->\n`;
    xml += `  <!-- 共 ${channels.length} 个频道 -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n\n`;
    
    channels.forEach(channel => {
      xml += this.buildChannelXml(channel);
    });
    
    xml += '</tv>';
    return xml;
  }
  
  groupChannelsByCategory(channels) {
    const grouped = {};
    channels.forEach(channel => {
      const category = channel.category || '其他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(channel);
    });
    return grouped;
  }
  
  generateCompleteFile(channels, programmes) {
    console.log('  📦 生成完整EPG文件...');
    
    // 排序：先按是否通用，再按分类，最后按名称
    const sortedChannels = [...channels].sort((a, b) => {
      // 通用频道在前
      if (a.isUniversal !== b.isUniversal) {
        return a.isUniversal ? -1 : 1;
      }
      // "其他"频道在通用频道最后
      if (a.category === '其他' && b.category !== '其他') return 1;
      if (b.category === '其他' && a.category !== '其他') return -1;
      // 按分类排序
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      // 按名称排序
      return (a.name || '').localeCompare(b.name || '');
    });
    
    const sortedProgrammes = [...programmes].sort((a, b) => {
      return (a.start || '').localeCompare(b.start || '');
    });
    
    console.log(`    准备生成: ${sortedChannels.length}个频道, ${sortedProgrammes.length}个节目`);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- 完整EPG数据 (all.xml) -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
    xml += `  <!-- 包含 ${sortedChannels.length} 个频道，${sortedProgrammes.length} 个节目 -->\n\n`;
    
    xml += `  <!-- 频道列表 -->\n`;
    
    // 分组显示频道
    const groupedChannels = this.groupCompleteChannels(sortedChannels);
    
    for (const [groupName, groupChannels] of Object.entries(groupedChannels)) {
      xml += `\n  <!-- ${groupName} (${groupChannels.length}个) -->\n`;
      groupChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
    }
    
    // 添加节目信息
    if (sortedProgrammes.length > 0) {
      xml += `\n  <!-- 节目列表 (共${sortedProgrammes.length}个节目) -->\n`;
      
      sortedProgrammes.forEach(programme => {
        xml += this.buildProgrammeXml(programme);
      });
    }
    
    xml += '</tv>';
    
    const filePath = path.join(this.outputDir, 'all.xml');
    fs.writeFileSync(filePath, xml, 'utf-8');
    
    const fileSize = (Buffer.byteLength(xml, 'utf-8') / 1024 / 1024).toFixed(2);
    console.log(`    ✅ all.xml - ${sortedChannels.length}频道 ${sortedProgrammes.length}节目 (${fileSize}MB)`);
    
    return {
      fileName: 'all.xml',
      channelCount: sortedChannels.length,
      programmeCount: sortedProgrammes.length,
      fileSize: fileSize + 'MB'
    };
  }
  
  groupCompleteChannels(channels) {
    const groups = {};
    
    // 初始化分组
    groups['全国通用频道'] = [];
    groups['其他频道'] = [];
    
    channels.forEach(channel => {
      if (channel.category === '其他') {
        groups['其他频道'].push(channel);
      } else if (channel.isUniversal) {
        groups['全国通用频道'].push(channel);
      }
    });
    
    // 处理地方频道
    const localChannels = channels.filter(c => !c.isUniversal && c.category !== '其他');
    if (localChannels.length > 0) {
      const provinceNames = Object.keys(provincePinyinMap);
      const provinceChannels = {};
      
      localChannels.forEach(channel => {
        const provinceName = this.getProvinceByChannel(channel, provinceNames);
        if (provinceName) {
          if (!provinceChannels[provinceName]) {
            provinceChannels[provinceName] = [];
          }
          provinceChannels[provinceName].push(channel);
        } else {
          // 未识别到省份的地方频道
          if (!groups['其他地方频道']) {
            groups['其他地方频道'] = [];
          }
          groups['其他地方频道'].push(channel);
        }
      });
      
      // 按省份名称排序后添加到分组
      Object.keys(provinceChannels).sort().forEach(provinceName => {
        groups[`${provinceName}频道`] = provinceChannels[provinceName];
      });
    }
    
    return groups;
  }
  
  getProvinceByChannel(channel, provinceNames) {
    const channelName = channel.name || '';
    for (const provinceName of provinceNames) {
      if (channelName.includes(provinceName)) {
        return provinceName;
      }
    }
    return null;
  }
  
  buildChannelXml(channel) {
    return `  <channel id="${channel.id}">\n    <display-name lang="CN">${channel.name}</display-name>\n  </channel>\n`;
  }
  
  buildProgrammeXml(programme) {
    let xml = `  <programme start="${programme.start}" stop="${programme.stop}" channel="${programme.channel}">\n`;
    xml += `    <title lang="zh">${programme.title}</title>\n`;
    if (programme.desc) xml += `    <desc lang="zh">${programme.desc}</desc>\n`;
    if (programme.category) xml += `    <category lang="zh">${programme.category}</category>\n`;
    if (programme.episode) xml += `    <episode-num system="xmltv_ns">${programme.episode}</episode-num>\n`;
    xml += `  </programme>\n`;
    return xml;
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
      },
      usage: {
        examples: [
          "北京用户: bj.xml (包含本地+通用+其他频道)",
          "广东用户: gd.xml (包含本地+通用+其他频道)", 
          "纯央视频道: cctv.xml",
          "纯卫视频道: ws.xml",
          "完整数据: all.xml"
        ],
        note: "各省份文件中的'其他频道'包含未能自动分类的频道，如CDTV、SCTV等"
      }
    };
    
    // 填充省份文件信息
    provinceFiles.forEach(file => {
      indexData.files.provinces[file.pinyin] = {
        name: file.province,
        file: file.fileName,
        description: `${file.province}本地频道 + 全国通用频道 + 其他频道`,
        localChannelCount: file.localChannelCount,
        universalChannelCount: file.universalChannelCount,
        otherChannelCount: file.otherChannelCount,
        totalChannelCount: file.totalChannelCount,
        fileSize: file.fileSize
      };
    });
    
    // 填充通用文件信息
    universalFiles.forEach(file => {
      indexData.files.universal[file.pinyin] = {
        name: file.category,
        file: file.fileName,
        description: `纯${file.category}频道`,
        channelCount: file.channelCount,
        fileSize: file.fileSize
      };
    });
    
    // 填充完整文件信息
    indexData.files.complete = {
      all: {
        file: 'all.xml',
        description: '完整EPG数据（包含所有频道和节目）',
        channelCount: completeFile.channelCount,
        programmeCount: completeFile.programmeCount,
        fileSize: completeFile.fileSize
      },
      index: {
        file: 'index.json',
        description: '索引文件'
      }
    };
    
    const indexPath = path.join(this.outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    
    console.log('    ✅ index.json - 索引文件');
    
    return indexData;
  }
}

module.exports = EPGSplitter;    // 生成索引文件
    const indexData = this.generateIndexFile(
      provinceChannels, 
      universalChannels, 
      otherChannels,
      provinceFiles, 
      universalFiles, 
      completeFile
    );
    
    console.log('🎉 拆分完成！');
    
    return {
      provinceFiles,
      universalFiles,
      completeFile,
      indexData
    };
  }
  
  separateChannels(channels) {
    console.log('  📊 分离频道数据...');
    
    const universalChannels = {};
    const provinceChannels = {};
    const otherChannels = [];
    
    channels.forEach(channel => {
      const { category, isUniversal } = channel;
      
      if (category === '其他') {
        // "其他"频道单独存放
        otherChannels.push(channel);
      } else if (isUniversal) {
        // 通用频道（央视、卫视等）
        if (!universalChannels[category]) {
          universalChannels[category] = [];
        }
        universalChannels[category].push(channel);
      } else {
        // 省份频道
        if (!provinceChannels[category]) {
          provinceChannels[category] = [];
        }
        provinceChannels[category].push(channel);
      }
    });
    
    console.log(`    通用频道: ${Object.keys(universalChannels).length} 类`);
    console.log(`    省份频道: ${Object.keys(provinceChannels).length} 个省份`);
    console.log(`    其他频道: ${otherChannels.length} 个（将添加到所有省份文件）`);
    
    // 显示"其他"频道示例
    if (otherChannels.length > 0) {
      console.log('    📋 其他频道示例：');
      otherChannels.slice(0, 5).forEach((ch, i) => {
        console.log(`      ${i+1}. ${ch.name} (${ch.id})`);
      });
      if (otherChannels.length > 5) {
        console.log(`      ... 还有 ${otherChannels.length - 5} 个`);
      }
    }
    
    return { universalChannels, provinceChannels, otherChannels };
  }
  
  getAllUniversalChannels(universalChannels, otherChannels) {
    // 合并所有通用频道和"其他"频道
    const allChannels = [];
    
    // 添加通用频道（央视、卫视等）
    for (const [category, channels] of Object.entries(universalChannels)) {
      allChannels.push(...channels);
    }
    
    // 添加"其他"频道
    allChannels.push(...otherChannels);
    
    console.log(`  📦 通用频道池: ${allChannels.length} 个频道（含${otherChannels.length}个"其他"频道）`);
    
    return allChannels;
  }
  
  generateProvinceFiles(provinceChannels, allUniversalChannels) {
    console.log('  🌏 生成省份文件...');
    
    const generatedFiles = [];
    
    for (const [provinceName, channels] of Object.entries(provinceChannels)) {
      const pinyin = provincePinyinMap[provinceName];
      if (!pinyin) {
        console.warn(`    ⚠️ 未找到省份 ${provinceName} 的拼音映射`);
        continue;
      }
      
      // 合并：本省频道 + 所有通用频道（包括"其他"）
      const allChannels = [...channels, ...allUniversalChannels];
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      
      const xmlContent = this.generateProvinceXml(provinceName, pinyin, allChannels);
      fs.writeFileSync(filePath, xmlContent, 'utf-8');
      
      // 统计通用频道中的"其他"频道数量
      const otherCountInUniversal = allUniversalChannels.filter(c => c.category === '其他').length;
      const realUniversalCount = allUniversalChannels.length - otherCountInUniversal;
      
      generatedFiles.push({
        province: provinceName,
        pinyin: pinyin,
        fileName: fileName,
        localChannelCount: channels.length,
        universalChannelCount: realUniversalCount,
        otherChannelCount: otherCountInUniversal,
        totalChannelCount: allChannels.length,
        fileSize: (Buffer.byteLength(xmlContent, 'utf-8') / 1024).toFixed(2) + 'KB'
      });
      
      console.log(`    ✅ ${fileName} - ${provinceName} (${channels.length}本地+${realUniversalCount}通用+${otherCountInUniversal}其他)`);
    }
    
    return generatedFiles;
  }
  
  generateProvinceXml(provinceName, pinyin, channels) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- ${provinceName}电视频道 (${pinyin}.xml) -->\n`;
    xml += `  <!-- 包含：${provinceName}本地频道 + 全国通用频道（含未分类频道） -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
    xml += `  <!-- 共 ${channels.length} 个频道 -->\n\n`;
    
    // 分离三类频道
    const localChannels = channels.filter(c => !c.isUniversal && c.category !== '其他');
    const realUniversalChannels = channels.filter(c => c.isUniversal && c.category !== '其他');
    const otherChannels = channels.filter(c => c.category === '其他');
    
    // 1. 本省频道
    if (localChannels.length > 0) {
      xml += `  <!-- ${provinceName}本地频道 (${localChannels.length}个) -->\n`;
      localChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
      xml += '\n';
    }
    
    // 2. 通用频道（央视、卫视等）
    if (realUniversalChannels.length > 0) {
      const groupedChannels = this.groupChannelsByCategory(realUniversalChannels);
      
      xml += `  <!-- 全国通用频道 (${realUniversalChannels.length}个) -->\n`;
      
      for (const [category, catChannels] of Object.entries(groupedChannels)) {
        xml += `  <!-- ${category} (${catChannels.length}个) -->\n`;
        catChannels.forEach(channel => {
          xml += this.buildChannelXml(channel);
        });
        xml += '\n';
      }
    }
    
    // 3. 其他频道
    if (otherChannels.length > 0) {
      xml += `  <!-- 其他频道 (${otherChannels.length}个) -->\n`;
      xml += `  <!-- 注：以下频道未能自动分类到具体类别 -->\n`;
      otherChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
      xml += '\n';
    }
    
    xml += '</tv>';
    return xml;
  }
  
  groupChannelsByCategory(channels) {
    const grouped = {};
    channels.forEach(channel => {
      const category = channel.category || '其他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(channel);
    });
    return grouped;
  }
  
  generateUniversalFiles(universalChannels) {
    console.log('  🌐 生成通用频道文件...');
    
    const generatedFiles = [];
    
    for (const [category, channels] of Object.entries(universalChannels)) {
      if (channels.length === 0) continue;
      
      const pinyin = universalPinyinMap[category];
      if (!pinyin) {
        console.warn(`    ⚠️ 未找到通用分类 ${category} 的拼音映射`);
        continue;
      }
      
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      
      const xmlContent = this.generateUniversalXml(category, pinyin, channels);
      fs.writeFileSync(filePath, xmlContent, 'utf-8');
      
      generatedFiles.push({
        category: category,
        pinyin: pinyin,
        fileName: fileName,
        channelCount: channels.length,
        fileSize: (Buffer.byteLength(xmlContent, 'utf-8') / 1024).toFixed(2) + 'KB'
      });
      
      console.log(`    ✅ ${fileName} - ${category} (${channels.length}个频道)`);
    }
    
    return generatedFiles;
  }
  
  generateUniversalXml(category, pinyin, channels) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- ${category}频道 (${pinyin}.xml) -->\n`;
    xml += `  <!-- 共 ${channels.length} 个频道 -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n\n`;
    
    channels.forEach(channel => {
      xml += this.buildChannelXml(channel);
    });
    
    xml += '</tv>';
    return xml;
  }
  
  generateCompleteFile(channels, programmes) {
    console.log('  📦 生成完整EPG文件...');
    
    // 排序：先按是否通用，再按分类，最后按名称
    const sortedChannels = [...channels].sort((a, b) => {
      // 通用频道在前
      if (a.isUniversal !== b.isUniversal) {
        return a.isUniversal ? -1 : 1;
      }
      // "其他"频道在通用频道最后
      if (a.category === '其他' && b.category !== '其他') return 1;
      if (b.category === '其他' && a.category !== '其他') return -1;
      // 按分类排序
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      // 按名称排序
      return (a.name || '').localeCompare(b.name || '');
    });
    
    const sortedProgrammes = [...programmes].sort((a, b) => {
      return (a.start || '').localeCompare(b.start || '');
    });
    
    console.log(`    准备生成: ${sortedChannels.length}个频道, ${sortedProgrammes.length}个节目`);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- 完整EPG数据 (all.xml) -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
    xml += `  <!-- 包含 ${sortedChannels.length} 个频道，${sortedProgrammes.length} 个节目 -->\n\n`;
    
    xml += `  <!-- 频道列表 -->\n`;
    
    // 分组显示频道
    const groupedChannels = this.groupCompleteChannels(sortedChannels);
    
    for (const [groupName, groupChannels] of Object.entries(groupedChannels)) {
      xml += `\n  <!-- ${groupName} (${groupChannels.length}个) -->\n`;
      groupChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
    }
    
    // 添加节目信息
    if (sortedProgrammes.length > 0) {
      xml += `\n  <!-- 节目列表 (共${sortedProgrammes.length}个节目) -->\n`;
      
      sortedProgrammes.forEach(programme => {
        xml += this.buildProgrammeXml(programme);
      });
    }
    
    xml += '</tv>';
    
    const filePath = path.join(this.outputDir, 'all.xml');
    fs.writeFileSync(filePath, xml, 'utf-8');
    
    const fileSize = (Buffer.byteLength(xml, 'utf-8') / 1024 / 1024).toFixed(2);
    console.log(`    ✅ all.xml - ${sortedChannels.length}频道 ${sortedProgrammes.length}节目 (${fileSize}MB)`);
    
    return {
      fileName: 'all.xml',
      channelCount: sortedChannels.length,
      programmeCount: sortedProgrammes.length,
      fileSize: fileSize + 'MB'
    };
  }
  
  groupCompleteChannels(channels) {
    const groups = {};
    
    // 初始化分组
    groups['全国通用频道'] = [];
    groups['其他频道'] = [];
    
    channels.forEach(channel => {
      if (channel.category === '其他') {
        groups['其他频道'].push(channel);
      } else if (channel.isUniversal) {
        groups['全国通用频道'].push(channel);
      }
    });
    
    // 处理地方频道
    const localChannels = channels.filter(c => !c.isUniversal && c.category !== '其他');
    if (localChannels.length > 0) {
      const provinceNames = Object.keys(provincePinyinMap);
      const provinceChannels = {};
      
      localChannels.forEach(channel => {
        const provinceName = this.getProvinceByChannel(channel, provinceNames);
        if (provinceName) {
          if (!provinceChannels[provinceName]) {
            provinceChannels[provinceName] = [];
          }
          provinceChannels[provinceName].push(channel);
        } else {
          // 未识别到省份的地方频道
          if (!groups['其他地方频道']) {
            groups['其他地方频道'] = [];
          }
          groups['其他地方频道'].push(channel);
        }
      });
      
      // 按省份名称排序后添加到分组
      Object.keys(provinceChannels).sort().forEach(provinceName => {
        groups[`${provinceName}频道`] = provinceChannels[provinceName];
      });
    }
    
    return groups;
  }
  
  getProvinceByChannel(channel, provinceNames) {
    const channelName = channel.name || '';
    for (const provinceName of provinceNames) {
      if (channelName.includes(provinceName)) {
        return provinceName;
      }
    }
    return null;
  }
  
  buildChannelXml(channel) {
    return `  <channel id="${channel.id}">\n    <display-name lang="CN">${channel.name}</display-name>\n  </channel>\n`;
  }
  
  buildProgrammeXml(programme) {
    let xml = `  <programme start="${programme.start}" stop="${programme.stop}" channel="${programme.channel}">\n`;
    xml += `    <title lang="zh">${programme.title}</title>\n`;
    if (programme.desc) xml += `    <desc lang="zh">${programme.desc}</desc>\n`;
    if (programme.category) xml += `    <category lang="zh">${programme.category}</category>\n`;
    if (programme.episode) xml += `    <episode-num system="xmltv_ns">${programme.episode}</episode-num>\n`;
    xml += `  </programme>\n`;
    return xml;
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
      },
      usage: {
        examples: [
          "北京用户: bj.xml (包含本地+通用+其他频道)",
          "广东用户: gd.xml (包含本地+通用+其他频道)", 
          "纯央视频道: cctv.xml",
          "纯卫视频道: ws.xml",
          "完整数据: all.xml"
        ],
        note: "各省份文件中的'其他频道'包含未能自动分类的频道，如CDTV、SCTV等"
      }
    };
    
    // 填充省份文件信息
    provinceFiles.forEach(file => {
      indexData.files.provinces[file.pinyin] = {
        name: file.province,
        file: file.fileName,
        description: `${file.province}本地频道 + 全国通用频道 + 其他频道`,
        localChannelCount: file.localChannelCount,
        universalChannelCount: file.universalChannelCount,
        otherChannelCount: file.otherChannelCount,
        totalChannelCount: file.totalChannelCount,
        fileSize: file.fileSize
      };
    });
    
    // 填充通用文件信息
    universalFiles.forEach(file => {
      indexData.files.universal[file.pinyin] = {
        name: file.category,
        file: file.fileName,
        description: `纯${file.category}频道`,
        channelCount: file.channelCount,
        fileSize: file.fileSize
      };
    });
    
    // 填充完整文件信息
    indexData.files.complete = {
      all: {
        file: 'all.xml',
        description: '完整EPG数据（包含所有频道和节目）',
        channelCount: completeFile.channelCount,
        programmeCount: completeFile.programmeCount,
        fileSize: completeFile.fileSize
      },
      index: {
        file: 'index.json',
        description: '索引文件'
      }
    };
    
    const indexPath = path.join(this.outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    
    console.log('    ✅ index.json - 索引文件');
    
    return indexData;
  }
}

module.exports = EPGSplitter;
