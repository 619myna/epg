const { categoryRules } = require('./categories.js');

class EPGProcessor {
  constructor() {
    this.channelRegex = /<channel\b[^>]*?\bid="([^"]+)"[^>]*>[\s\S]*?<display-name[^>]*>([^<]+)<\/display-name>[\s\S]*?<\/channel>/gi;
    this.programmeRegex = /<programme\b[^>]*?\bstart="([^"]+)"[^>]*?\bstop="([^"]+)"[^>]*?\bchannel="([^"]+)"[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>([\s\S]*?)<\/programme>/gi;
    
    this.nameCache = new Map();
    this.optimizedRules = this.prepareOptimizedRules();
    this.allKeywordsUpper = new Set();
    this.optimizedRules.forEach(rule => rule.keywordSet.forEach(kw => this.allKeywordsUpper.add(kw)));
  }
  
  prepareOptimizedRules() {
    return categoryRules.map(rule => {
      const keywords = rule.regex.source
        .toUpperCase()
        .split('|')
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '').trim())
        .filter(k => k.length >= 2);
      
      return {
        name: rule.name,
        isUniversal: rule.isUniversal,
        priority: rule.priority,
        regex: rule.regex,
        keywordSet: new Set(keywords)
      };
    }).sort((a, b) => a.priority - b.priority);
  }
  
  cleanChannelName(name) {
    if (this.nameCache.has(name)) return this.nameCache.get(name);
    
    const cleaned = name  
      .replace(/\s+|[()（）－_—·•-]|频道|超清|HD|高清(?![^()（）]*[电影])/gi, '')
      .replace(/(CCTV)(\d+)(\+?)[\u4e00-\u9fa5]+(?!欧洲|美洲)/gi, '$1$2$3')
      .trim();
    
    const result = { 
      original: name, 
      cleaned: cleaned, 
      upper: cleaned.toUpperCase() 
    };
    this.nameCache.set(name, result);
    return result;
  }
  
  extractChannels(xmlData) {
    console.log('🔍 提取频道信息...');
    const channels = [];
    let match;
    
    while ((match = this.channelRegex.exec(xmlData)) !== null) {
      const channelId = match[1];
      const channelName = match[2].trim();
      
      channels.push({
        id: channelId,
        name: channelName
      });
    }
    
    console.log(`  📊 找到 ${channels.length} 个频道`);
    return channels;
  }
  
  extractProgrammes(xmlData) {
    console.log('🔍 提取节目信息...');
    const programmes = [];
    let match;
    
    while ((match = this.programmeRegex.exec(xmlData)) !== null) {
      const start = match[1];
      const stop = match[2];
      const channel = match[3];
      const title = match[4].trim();
      const rest = match[5];
      
      const descMatch = rest.match(/<desc[^>]*>([^<]+)<\/desc>/);
      const categoryMatch = rest.match(/<category[^>]*>([^<]+)<\/category>/);
      const episodeMatch = rest.match(/<episode-num[^>]*>([^<]+)<\/episode-num>/);
      
      programmes.push({
        start,
        stop,
        channel,
        title,
        desc: descMatch ? descMatch[1] : '',
        category: categoryMatch ? categoryMatch[1] : '',
        episode: episodeMatch ? episodeMatch[1] : ''
      });
    }
    
    console.log(`  📊 找到 ${programmes.length} 个节目`);
    return programmes;
  }
  
  classifyChannel(channel) {
    const nameResult = this.cleanChannelName(channel.name);
    const cleanedName = nameResult.cleaned;
    const upperName = nameResult.upper;
    
    // 优化算法：关键词索引
    const candidateRules = new Set();
    
    for (let i = 0; i < upperName.length - 1; i++) {
      const maxLen = Math.min(6, upperName.length - i);
      for (let len = 2; len <= maxLen; len++) {
        const substring = upperName.substr(i, len);
        
        if (this.allKeywordsUpper.has(substring)) {
          this.optimizedRules.forEach(rule => {
            if (rule.keywordSet.has(substring)) {
              candidateRules.add(rule);
            }
          });
          i += len - 1;
          break;
        }
      }
    }
    
    // 精确匹配候选规则
    for (const rule of Array.from(candidateRules)) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(cleanedName)) {
        return {
          name: rule.name,
          isUniversal: rule.isUniversal,
          priority: rule.priority
        };
      }
    }
    
    // 回退到完整规则扫描
    for (const rule of this.optimizedRules) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(cleanedName)) {
        return {
          name: rule.name,
          isUniversal: rule.isUniversal,
          priority: rule.priority
        };
      }
    }
    
    // 默认分类
    return {
      name: '其他',
      isUniversal: true,
      priority: 999
    };
  }
  
  process(xmlData) {
    console.log('⚙️ 处理EPG数据...');
    
    const channels = this.extractChannels(xmlData);
    const programmes = this.extractProgrammes(xmlData);
    
    console.log('🏷️ 对频道进行分类...');
    const classifiedChannels = channels.map(channel => {
      const classification = this.classifyChannel(channel);
      return {
        ...channel,
        cleanedName: this.cleanChannelName(channel.name).cleaned,
        category: classification.name,
        isUniversal: classification.isUniversal,
        priority: classification.priority
      };
    });
    
    // 去重（基于cleanedName）
    const uniqueChannels = [];
    const seenNames = new Set();
    
    classifiedChannels.forEach(channel => {
      if (!seenNames.has(channel.cleanedName)) {
        seenNames.add(channel.cleanedName);
        uniqueChannels.push(channel);
      }
    });
    
    console.log(`  📊 去重后: ${uniqueChannels.length} 个频道`);
    
    // 统计分类信息
    const categoryStats = {};
    uniqueChannels.forEach(channel => {
      const category = channel.category;
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    console.log('  📈 分类统计:');
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([category, count]) => {
        console.log(`    ${category}: ${count}个频道`);
      });
    
    return {
      channels: uniqueChannels,
      programmes: programmes
    };
  }
}

module.exports = EPGProcessor;