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
  
  split(epgData) {
    const { channels, programmes } = epgData;
    
    console.log('🗂️ 拆分EPG数据...');
    
    const { universalChannels, provinceChannels } = this.separateChannels(channels);
    const allUniversalChannels = this.getAllUniversalChannels(universalChannels);
    
    const provinceFiles = this.generateProvinceFiles(provinceChannels, allUniversalChannels);
    const universalFiles = this.generateUniversalFiles(universalChannels);
    const completeFile = this.generateCompleteFile(channels, programmes);
    const indexData = this.generateIndexFile(provinceChannels, universalChannels, provinceFiles, universalFiles, completeFile);
    
    console.log('🎉 拆分完成！');
    
    return {
      provinceFiles,
      universalFiles,
      completeFile,
      indexData
    };
  }
  
  separateChannels(channels) {
    console.log('  📊 分离通用频道和地方频道...');
    
    const universalChannels = {};
    const provinceChannels = {};
    
    channels.forEach(channel => {
      const { category, isUniversal } = channel;
      
      if (isUniversal) {
        if (!universalChannels[category]) {
          universalChannels[category] = [];
        }
        universalChannels[category].push(channel);
      } else {
        if (!provinceChannels[category]) {
          provinceChannels[category] = [];
        }
        provinceChannels[category].push(channel);
      }
    });
    
    console.log(`    通用频道: ${Object.keys(universalChannels).length} 类`);
    console.log(`    地方频道: ${Object.keys(provinceChannels).length} 个省份`);
    
    return { universalChannels, provinceChannels };
  }
  
  getAllUniversalChannels(universalChannels) {
    return Object.values(universalChannels).flat();
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
      
      const allChannels = [...channels, ...allUniversalChannels];
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      
      const xmlContent = this.generateProvinceXml(provinceName, pinyin, allChannels);
      fs.writeFileSync(filePath, xmlContent, 'utf-8');
      
      generatedFiles.push({
        province: provinceName,
        pinyin: pinyin,
        fileName: fileName,
        localChannelCount: channels.length,
        universalChannelCount: allUniversalChannels.length,
        totalChannelCount: allChannels.length,
        fileSize: (Buffer.byteLength(xmlContent, 'utf-8') / 1024).toFixed(2) + 'KB'
      });
      
      console.log(`    ✅ ${fileName} - ${provinceName} (${channels.length}本地+${allUniversalChannels.length}通用)`);
    }
    
    return generatedFiles;
  }
  
  generateProvinceXml(provinceName, pinyin, channels) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- ${provinceName}电视频道 (${pinyin}.xml) -->\n`;
    xml += `  <!-- 包含：${provinceName}本地频道 + 全国通用频道 -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
    xml += `  <!-- 共 ${channels.length} 个频道 -->\n\n`;
    
    const localChannels = channels.filter(c => !c.isUniversal);
    const universalChannels = channels.filter(c => c.isUniversal);
    
    if (localChannels.length > 0) {
      xml += `  <!-- ${provinceName}本地频道 (${localChannels.length}个) -->\n`;
      localChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
      xml += '\n';
    }
    
    if (universalChannels.length > 0) {
      const groupedChannels = this.groupChannelsByCategory(universalChannels);
      
      xml += `  <!-- 全国通用频道 (${universalChannels.length}个) -->\n`;
      
      for (const [category, catChannels] of Object.entries(groupedChannels)) {
        xml += `  <!-- ${category} (${catChannels.length}个) -->\n`;
        catChannels.forEach(channel => {
          xml += this.buildChannelXml(channel);
        });
        xml += '\n';
      }
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
    
    const sortedChannels = [...channels].sort((a, b) => {
      if (a.isUniversal !== b.isUniversal) {
        return a.isUniversal ? -1 : 1;
      }
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return (a.name || '').localeCompare(b.name || '');
    });
    
    const sortedProgrammes = [...programmes].sort((a, b) => {
      return (a.start || '').localeCompare(b.start || '');
    });
    
    console.log(`    准备生成: ${sortedChannels.length}个频道, ${sortedProgrammes.length}个节目`);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- 完整EPG数据 (all.xml) -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
    xml += `  <!-- 包含 ${sortedChannels.length} 个频道，${sortedProgrammes.length} 个节目 -->\n`;
    xml += `  <!-- 按分类排序：通用频道 → 地方频道 -->\n\n`;
    
    xml += `  <!-- 频道列表 -->\n`;
    
    const groupedChannels = this.groupCompleteChannels(sortedChannels);
    
    for (const [groupName, groupChannels] of Object.entries(groupedChannels)) {
      xml += `\n  <!-- ${groupName} (${groupChannels.length}个) -->\n`;
      groupChannels.forEach(channel => {
        xml += this.buildChannelXml(channel);
      });
    }
    
    if (sortedProgrammes.length > 0) {
      xml += `\n  <!-- 节目列表 (共${sortedProgrammes.length}个节目) -->\n`;
      
      const firstTime = this.formatTime(sortedProgrammes[0]?.start);
      const lastTime = this.formatTime(sortedProgrammes[sortedProgrammes.length - 1]?.start);
      xml += `  <!-- 时间范围: ${firstTime} 到 ${lastTime} -->\n\n`;
      
      let programmeCount = 0;
      sortedProgrammes.forEach(programme => {
        xml += this.buildProgrammeXml(programme);
        programmeCount++;
        
        if (programmeCount % 1000 === 0) {
          console.log(`    已写入 ${programmeCount}/${sortedProgrammes.length} 个节目`);
        }
      });
      
      console.log(`    已写入所有 ${programmeCount} 个节目`);
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
    
    groups['全国通用频道'] = [];
    groups['地方频道'] = [];
    
    const provinceNames = Object.keys(provincePinyinMap);
    
    channels.forEach(channel => {
      if (channel.isUniversal) {
        groups['全国通用频道'].push(channel);
      } else {
        groups['地方频道'].push(channel);
      }
    });
    
    if (groups['地方频道'].length > 0) {
      const provinceChannels = {};
      const otherChannels = [];
      
      groups['地方频道'].forEach(channel => {
        const provinceName = this.getProvinceByChannel(channel, provinceNames);
        if (provinceName) {
          if (!provinceChannels[provinceName]) {
            provinceChannels[provinceName] = [];
          }
          provinceChannels[provinceName].push(channel);
        } else {
          otherChannels.push(channel);
        }
      });
      
      delete groups['地方频道'];
      
      Object.keys(provinceChannels).sort().forEach(provinceName => {
        groups[`${provinceName}频道`] = provinceChannels[provinceName];
      });
      
      if (otherChannels.length > 0) {
        groups['其他地方频道'] = otherChannels;
      }
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
  
  formatTime(timestamp) {
    if (!timestamp) return '未知';
    try {
      const year = timestamp.substring(0, 4);
      const month = timestamp.substring(4, 6);
      const day = timestamp.substring(6, 8);
      const hour = timestamp.substring(8, 10);
      const minute = timestamp.substring(10, 12);
      return `${year}-${month}-${day} ${hour}:${minute}`;
    } catch (e) {
      return timestamp;
    }
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
  
  generateIndexFile(provinceChannels, universalChannels, provinceFiles, universalFiles, completeFile) {
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
        totalChannels: completeFile.channelCount,
        totalProgrammes: completeFile.programmeCount,
        generatedFiles: provinceFiles.length + universalFiles.length + 2
      },
      mappings: {
        provinces: provincePinyinMap,
        universal: universalPinyinMap
      },
      usage: {
        examples: [
          "北京用户: bj.xml (包含本地+通用频道)",
          "广东用户: guangdong.xml (包含本地+通用频道)", 
          "纯央视频道: cctv.xml",
          "纯卫视频道: ws.xml",
          "完整数据: all.xml"
        ]
      }
    };
    
    provinceFiles.forEach(file => {
      indexData.files.provinces[file.pinyin] = {
        name: file.province,
        file: file.fileName,
        description: `${file.province}本地频道 + 全国通用频道`,
        localChannelCount: file.localChannelCount,
        universalChannelCount: file.universalChannelCount,
        totalChannelCount: file.totalChannelCount,
        fileSize: file.fileSize
      };
    });
    
    universalFiles.forEach(file => {
      indexData.files.universal[file.pinyin] = {
        name: file.category,
        file: file.fileName,
        description: `纯${file.category}频道`,
        channelCount: file.channelCount,
        fileSize: file.fileSize
      };
    });
    
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