const fs = require('fs');
const path = require('path');

class EPGProcessor {
  process(xmlData) {
    console.log('⚙️ 处理EPG数据...');
    
    // 1. 提取频道片段
    const channelFragments = [];
    let pos = 0;
    
    while ((pos = xmlData.indexOf('<channel', pos)) !== -1) {
      const end = xmlData.indexOf('</channel>', pos);
      if (end === -1) break;
      
      channelFragments.push(xmlData.substring(pos, end + 10));
      pos = end + 10;
    }
    
    // 2. 提取节目片段  
    const programmeFragments = [];
    pos = 0;
    
    while ((pos = xmlData.indexOf('<programme', pos)) !== -1) {
      const end = xmlData.indexOf('</programme>', pos);
      if (end === -1) break;
      
      programmeFragments.push(xmlData.substring(pos, end + 11));
      pos = end + 11;
    }
    
    console.log(`  ✅ 找到 ${channelFragments.length} 个频道`);
    console.log(`  ✅ 找到 ${programmeFragments.length} 个节目`);
    
    return { channelFragments, programmeFragments };
  }
}

module.exports = EPGProcessor;
