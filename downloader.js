const axios = require('axios');
const fs = require('fs');
const zlib = require('zlib');
const { promisify } = require('util');

const gunzip = promisify(zlib.gunzip);

class EPGDownloader {
  constructor() {
    this.epgSources = [
      'https://epg.pw/xmltv/epg_CN.xml.gz', // 优先.gz
      'https://epg.pw/xmltv/epg_CN.xml'     // 备选.xml
    ];
    this.timeout = 30000; // 30秒超时
  }
  
  async downloadEPG() {
    console.log('📥 开始下载EPG数据...');
    
    for (const url of this.epgSources) {
      try {
        console.log(`  尝试: ${url}`);
        
        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'arraybuffer',
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 EPG-Processor/1.0'
          }
        });
        
        if (response.status === 200) {
          console.log(`  ✅ 下载成功`);
          
          let xmlData;
          if (url.endsWith('.gz')) {
            console.log('  解压GZ文件...');
            const decompressed = await gunzip(response.data);
            xmlData = decompressed.toString('utf-8');
            console.log('  ✅ 解压完成');
          } else {
            xmlData = response.data.toString('utf-8');
          }
          
          // 只替换，不添加
          console.log('  🔧 统一数据格式...');
          
          // 1. 统一语言属性为 lang="zh"
          xmlData = xmlData.replace(/lang="[^"]*"/gi, 'lang="zh"');
          
          // 2. 统一时区为 +0800
          xmlData = xmlData.replace(/(start|stop)="([^"]*?)\s*[+-]\d{4}"/g, '$1="$2 +0800"');
          
          // 3. 删除icon标签
          xmlData = xmlData.replace(/<icon src="" \/>/g, '');
          
          // 4. 统一audio标签
          xmlData = xmlData.replace(/<audio>\s*<stereo>stereo<\/stereo>\s*<\/audio>/g, '<audio><stereo>stereo</stereo></audio>');
          
          const sizeMB = (Buffer.byteLength(xmlData, 'utf-8') / 1024 / 1024).toFixed(2);
          console.log(`  📊 数据大小: ${sizeMB} MB`);
          console.log('  ✅ 格式统一完成');
          
          return xmlData;
        }
      } catch (error) {
        console.warn(`  ❌ 下载失败: ${error.message}`);
        continue;
      }
    }
    
    throw new Error('所有EPG源都不可用，请检查网络或稍后重试');
  }
  
  async downloadToFile(filePath = 'temp-epg.xml') {
    try {
      const xmlData = await this.downloadEPG();
      
      // 确保目录存在
      const dir = require('path').dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 保存到文件
      fs.writeFileSync(filePath, xmlData, 'utf-8');
      console.log(`  💾 数据已保存到: ${filePath}`);
      
      return xmlData;
    } catch (error) {
      console.error('下载EPG失败:', error);
      throw error;
    }
  }
}

module.exports = EPGDownloader;
