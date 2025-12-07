async downloadEPG() {
  try {
    console.log('  🔍 开始下载EPG数据...');
    
    const url = 'https://epg.pw/xmltv/epg_CN.xml.gz';
    console.log(`    尝试：${url}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    console.log('  ✅ 下载成功');
    console.log('  📦 解压GZ文件...');
    
    let xmlData = zlib.gunzipSync(response.data).toString('utf-8');
    
    console.log('  ✅ 解压完成');
    
    // 只替换，不添加
    console.log('  🔧 统一数据格式...');
    
    // 1. 统一语言属性为 lang="zh"
    xmlData = xmlData.replace(/lang="[^"]*"/gi, 'lang="zh"');
    
    // 2. 统一时区为 +0800
    xmlData = xmlData.replace(/(start|stop)="([^"]*?)\s*[+-]\d{4}"/g, '$1="$2 +0800"');
    
    const sizeMB = (xmlData.length / 1024 / 1024).toFixed(2);
    console.log(`  📊 数据大小: ${sizeMB} MB`);
    console.log('  ✅ 格式统一完成');
    
    return xmlData;
    
  } catch (error) {
    console.error('  ❌ 下载失败:', error.message);
    throw error;
  }
}
