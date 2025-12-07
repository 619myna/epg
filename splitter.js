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
  
  split(data) {
    const { channelFragments, programmeFragments } = data;
    
    console.log('🗂️ 拆分EPG数据...');
    
    // 简单提取频道信息用于分类
    const channels = this.extractChannelInfo(channelFragments);
    
    // 分离频道：通用频道、省份频道、其他频道
    const { universalChannels, provinceChannels, otherChannels } = this.separateChannels(channels);
    
    // 获取所有通用频道（包括"其他"频道）
    const allUniversalChannels = this.getAllUniversalChannels(universalChannels, otherChannels);
    
    // 生成各省份文件（包含：本省频道 + 所有通用频道）
    const provinceFiles = this.generateProvinceFiles(provinceChannels, allUniversalChannels, channelFragments);
    
    // 生成通用分类文件
    const universalFiles = this.generateUniversalFiles(universalChannels, channelFragments);
    
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
    
    console.log('🎉 拆分完成！');
    
    return {
      provinceFiles,
      universalFiles,
      completeFile,
      indexData
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
    
    // 加载分类规则
    const { categoryRules } = require('./categories.js');
    
    channels.forEach(channel => {
      const { name } = channel;
      let matched = false;
      
      // 按优先级排序的规则进行匹配
      const sortedRules = [...categoryRules].sort((a, b) => a.priority - b.priority);
      
      for (const rule of sortedRules) {
        if (rule.regex.test(name)) {
          channel.category = rule.name;
          channel.isUniversal = rule.isUniversal;
          
          if (channel.category === '其他') {
            otherChannels.push(channel);
          } else if (rule.isUniversal) {
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
      
      // 如果没有匹配到任何规则，归为其他
      if (!matched) {
        channel.category = '其他';
        channel.isUniversal = true;
        otherChannels.push(channel);
      }
    });
    
    console.log(`    通用频道: ${Object.keys(universalChannels).length} 类`);
    console.log(`    省份频道: ${Object.keys(provinceChannels).length} 个省份`);
    console.log(`    其他频道: ${otherChannels.length} 个`);
    
    return { universalChannels, provinceChannels, otherChannels };
  }
  
  getAllUniversalChannels(universalChannels, otherChannels) {
    const allChannels = [];
    
    for (const [category, channels] of Object.entries(universalChannels)) {
      allChannels.push(...channels);
    }
    
    allChannels.push(...otherChannels);
    
    console.log(`  📦 通用频道池: ${allChannels.length} 个频道`);
    
    return allChannels;
  }
  
  generateProvinceFiles(provinceChannels, allUniversalChannels, channelFragments) {
    console.log('  🌏 生成省份文件...');
    
    const generatedFiles = [];
    const channelMap = new Map();
    
    // 创建频道映射以便快速查找
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
      
      // 收集所有需要包含的频道ID
      const allChannelIds = [
        ...channels.map(c => c.id),
        ...allUniversalChannels.map(c => c.id)
      ];
      
      // 去重
      const uniqueChannelIds = [...new Set(allChannelIds)];
      
      // 生成XML内容
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
      xml += `  <!-- ${provinceName}电视频道 (${pinyin}.xml) -->\n`;
      xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
      xml += `  <!-- 共 ${uniqueChannelIds.length} 个频道 -->\n\n`;
      
      // 添加频道片段
      uniqueChannelIds.forEach(channelId => {
        const fragment = channelMap.get(channelId);
        if (fragment) {
          xml += '  ' + fragment + '\n';
        }
      });
      
      xml += '</tv>';
      
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      fs.writeFileSync(filePath, xml, 'utf-8');
      
      generatedFiles.push({
        province: provinceName,
        pinyin: pinyin,
        fileName: fileName,
        localChannelCount: channels.length,
        universalChannelCount: allUniversalChannels.length,
        totalChannelCount: uniqueChannelIds.length,
        fileSize: (Buffer.byteLength(xml, 'utf-8') / 1024).toFixed(2) + 'KB'
      });
      
      console.log(`    ✅ ${fileName} - ${provinceName} (${channels.length}本地+${allUniversalChannels.length}通用)`);
    }
    
    return generatedFiles;
  }
  
  generateUniversalFiles(universalChannels, channelFragments) {
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
      
      // 生成XML内容
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
      xml += `  <!-- ${category}频道 (${pinyin}.xml) -->\n`;
      xml += `  <!-- 共 ${channels.length} 个频道 -->\n`;
      xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n\n`;
      
      // 添加频道片段
      channels.forEach(channel => {
        const fragment = channelMap.get(channel.id);
        if (fragment) {
          xml += '  ' + fragment + '\n';
        }
      });
      
      xml += '</tv>';
      
      const fileName = `${pinyin}.xml`;
      const filePath = path.join(this.outputDir, fileName);
      fs.writeFileSync(filePath, xml, 'utf-8');
      
      generatedFiles.push({
        category: category,
        pinyin: pinyin,
        fileName: fileName,
        channelCount: channels.length,
        fileSize: (Buffer.byteLength(xml, 'utf-8') / 1024).toFixed(2) + 'KB'
      });
      
      console.log(`    ✅ ${fileName} - ${category} (${channels.length}个频道)`);
    }
    
    return generatedFiles;
  }
  
  generateCompleteFile(channelFragments, programmeFragments) {
    console.log('  📦 生成完整EPG文件...');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n`;
    xml += `  <!-- 完整EPG数据 (all.xml) -->\n`;
    xml += `  <!-- 生成时间：${new Date().toISOString()} -->\n`;
    xml += `  <!-- 包含 ${channelFragments.length} 个频道，${programmeFragments.length} 个节目 -->\n\n`;
    
    // 添加频道片段
    xml += `  <!-- 频道列表 -->\n`;
    channelFragments.forEach(fragment => {
      xml += '  ' + fragment + '\n';
    });
    
    // 添加节目片段
    if (programmeFragments.length > 0) {
      xml += `\n  <!-- 节目列表 -->\n`;
      programmeFragments.forEach(fragment => {
        xml += '  ' + fragment + '\n';
      });
    }
    
    xml += '</tv>';
    
    const filePath = path.join(this.outputDir, 'all.xml');
    fs.writeFileSync(filePath, xml, 'utf-8');
    
    const fileSize = (Buffer.byteLength(xml, 'utf-8') / 1024 / 1024).toFixed(2);
    console.log(`    ✅ all.xml - ${channelFragments.length}频道 ${programmeFragments.length}节目 (${fileSize}MB)`);
    
    return {
      fileName: 'all.xml',
      channelCount: channelFragments.length,
      programmeCount: programmeFragments.length,
      fileSize: fileSize + 'MB'
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
        totalChannelCount: file.totalChannelCount,
        fileSize: file.fileSize
      };
    });
    
    // 填充通用文件信息
    universalFiles.forEach(file => {
      indexData.files.universal[file.pinyin] = {
        name: file.category,
        file: file.fileName,
        channelCount: file.channelCount,
        fileSize: file.fileSize
      };
    });
    
    // 填充完整文件信息
    indexData.files.complete = {
      all: {
        file: 'all.xml',
        channelCount: completeFile.channelCount,
        programmeCount: completeFile.programmeCount,
        fileSize: completeFile.fileSize
      }
    };
    
    const indexPath = path.join(this.outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    
    console.log('    ✅ index.json - 索引文件');
    
    return indexData;
  }
}

module.exports = EPGSplitter;
