#!/usr/bin/env node

const EPGDownloader = require('./downloader.js');
const EPGProcessor = require('./processor.js');
const EPGSplitter = require('./splitter.js');

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 EPG处理器 - 启动');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // 1. 下载EPG数据
    const downloader = new EPGDownloader();
    console.log('📥 下载EPG数据...');
    const xmlData = await downloader.downloadEPG();
    
    // 2. 处理EPG数据
    const processor = new EPGProcessor();
    console.log('⚙️ 处理EPG数据...');
    const epgData = processor.process(xmlData);
    
    // 3. 拆分EPG数据（移除await）
    const splitter = new EPGSplitter('output');
    console.log('🗂️ 拆分EPG数据...');
    const result = splitter.split(epgData); // 移除await
    
    // 4. 输出统计信息
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 处理完成！');
    console.log('='.repeat(60));
    
    console.log('\n📊 统计信息:');
    console.log(`   总耗时: ${duration} 秒`);
    console.log(`   总文件: ${result.provinceFiles.length + result.universalFiles.length + 2} 个`);
    console.log(`   省份文件: ${result.provinceFiles.length} 个`);
    console.log(`   通用文件: ${result.universalFiles.length} 个`);
    console.log(`   完整数据: 1 个 (${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目)`);
    console.log(`   输出目录: output/`);
    
    // 文件大小统计
    let totalFileSizeKB = 0;
    
    // 统计省份文件总大小
    result.provinceFiles.forEach(file => {
      const size = parseFloat(file.fileSize);
      if (!isNaN(size)) totalFileSizeKB += size;
    });
    
    // 统计通用文件总大小
    result.universalFiles.forEach(file => {
      const size = parseFloat(file.fileSize);
      if (!isNaN(size)) totalFileSizeKB += size;
    });
    
    console.log(`   总大小: ${(totalFileSizeKB / 1024).toFixed(2)} MB`);
    
    console.log('\n📁 生成的文件列表:');
    console.log('   省份文件:');
    
    // 按省份名称排序显示
    const sortedProvinceFiles = [...result.provinceFiles].sort((a, b) => 
      a.province.localeCompare(b.province)
    );
    
    sortedProvinceFiles.slice(0, 8).forEach(file => {
      console.log(`     - ${file.fileName}: ${file.province} (${file.localChannelCount}本地+${file.universalChannelCount}通用+${file.otherChannelCount}其他)`);
    });
    
    if (sortedProvinceFiles.length > 8) {
      console.log(`     ... 还有 ${sortedProvinceFiles.length - 8} 个省份文件`);
    }
    
    console.log('\n   通用文件:');
    result.universalFiles.forEach(file => {
      console.log(`     - ${file.fileName}: ${file.category} (${file.channelCount}个频道)`);
    });
    
    console.log('\n   特殊文件:');
    console.log(`     - all.xml: ${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目 (${result.completeFile.fileSize})`);
    console.log('     - index.json: 索引文件');
    
    // 生成报告文件
    generateReportFile(result, duration);
    
    console.log('\n💡 使用说明:');
    console.log('   1. 每个省份文件已包含本地频道 + 全国通用频道 + 其他频道');
    console.log('   2. 普通用户只需下载对应省份文件即可');
    console.log('   3. 完整数据在 all.xml 中');
    console.log('   4. 查看 index.json 获取详细信息');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 处理失败:', error.message);
    console.error('错误堆栈:');
    console.error(error.stack);
    process.exit(1);
  }
}

// 生成报告文件
function generateReportFile(result, duration) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      statistics: {
        totalProvinces: result.provinceFiles.length,
        totalCategories: result.universalFiles.length,
        totalChannels: result.completeFile.channelCount,
        totalProgrammes: result.completeFile.programmeCount,
        otherChannels: result.provinceFiles[0]?.otherChannelCount || 0
      },
      provinces: result.provinceFiles.map(file => ({
        province: file.province,
        file: file.fileName,
        local: file.localChannelCount,
        universal: file.universalChannelCount,
        other: file.otherChannelCount,
        total: file.totalChannelCount,
        size: file.fileSize
      })),
      categories: result.universalFiles.map(file => ({
        category: file.category,
        file: file.fileName,
        channels: file.channelCount,
        size: file.fileSize
      }))
    };
    
    const reportPath = path.join('output', 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    
    console.log(`    ✅ report.json: 详细报告文件已生成`);
  } catch (error) {
    console.warn('    ⚠️  无法生成报告文件:', error.message);
  }
}

// 直接运行
if (require.main === module) {
  main().catch(error => {
    console.error('致命错误:', error);
    process.exit(1);
  });
}

module.exports = { main };    
    console.log('\n📊 统计信息:');
    console.log(`   总耗时: ${duration} 秒`);
    console.log(`   总文件: ${result.provinceFiles.length + result.universalFiles.length + 2} 个`);
    console.log(`   省份文件: ${result.provinceFiles.length} 个`);
    console.log(`   通用文件: ${result.universalFiles.length} 个`);
    console.log(`   完整数据: 1 个 (${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目)`);
    console.log(`   输出目录: output/`);
    
    // 文件大小统计
    let totalFileSizeKB = 0;
    
    // 统计省份文件总大小
    result.provinceFiles.forEach(file => {
      const size = parseFloat(file.fileSize);
      if (!isNaN(size)) totalFileSizeKB += size;
    });
    
    // 统计通用文件总大小
    result.universalFiles.forEach(file => {
      const size = parseFloat(file.fileSize);
      if (!isNaN(size)) totalFileSizeKB += size;
    });
    
    console.log(`   总大小: ${(totalFileSizeKB / 1024).toFixed(2)} MB`);
    
    console.log('\n📁 生成的文件列表:');
    console.log('   省份文件:');
    
    // 按省份名称排序显示
    const sortedProvinceFiles = [...result.provinceFiles].sort((a, b) => 
      a.province.localeCompare(b.province)
    );
    
    sortedProvinceFiles.slice(0, 8).forEach(file => {
      console.log(`     - ${file.fileName}: ${file.province} (${file.localChannelCount}本地+${file.universalChannelCount}通用+${file.otherChannelCount}其他)`);
    });
    
    if (sortedProvinceFiles.length > 8) {
      console.log(`     ... 还有 ${sortedProvinceFiles.length - 8} 个省份文件`);
    }
    
    console.log('\n   通用文件:');
    result.universalFiles.forEach(file => {
      console.log(`     - ${file.fileName}: ${file.category} (${file.channelCount}个频道)`);
    });
    
    console.log('\n   特殊文件:');
    console.log(`     - all.xml: ${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目 (${result.completeFile.fileSize})`);
    console.log('     - index.json: 索引文件');
    
    // 生成报告文件
    this.generateReportFile(result, duration);
    
    console.log('\n💡 使用说明:');
    console.log('   1. 每个省份文件已包含本地频道 + 全国通用频道 + 其他频道');
    console.log('   2. 普通用户只需下载对应省份文件即可');
    console.log('   3. 完整数据在 all.xml 中');
    console.log('   4. 查看 index.json 获取详细信息');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 处理失败:', error.message);
    console.error('错误堆栈:');
    console.error(error.stack);
    process.exit(1);
  }
}

// 生成报告文件
function generateReportFile(result, duration) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      statistics: {
        totalProvinces: result.provinceFiles.length,
        totalCategories: result.universalFiles.length,
        totalChannels: result.completeFile.channelCount,
        totalProgrammes: result.completeFile.programmeCount,
        otherChannels: result.provinceFiles[0]?.otherChannelCount || 0
      },
      provinces: result.provinceFiles.map(file => ({
        province: file.province,
        file: file.fileName,
        local: file.localChannelCount,
        universal: file.universalChannelCount,
        other: file.otherChannelCount,
        total: file.totalChannelCount,
        size: file.fileSize
      })),
      categories: result.universalFiles.map(file => ({
        category: file.category,
        file: file.fileName,
        channels: file.channelCount,
        size: file.fileSize
      }))
    };
    
    const reportPath = path.join('output', 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    
    console.log(`    ✅ report.json: 详细报告文件已生成`);
  } catch (error) {
    console.warn('    ⚠️  无法生成报告文件:', error.message);
  }
}

// 直接运行
if (require.main === module) {
  main().catch(error => {
    console.error('致命错误:', error);
    process.exit(1);
  });
}

module.exports = { main };    
    console.log('\n📊 统计信息:');
    console.log(`   总耗时: ${duration} 秒`);
    console.log(`   总文件: ${result.provinceFiles.length + result.universalFiles.length + 2} 个`);
    console.log(`   省份文件: ${result.provinceFiles.length} 个`);
    console.log(`   通用文件: ${result.universalFiles.length} 个`);
    console.log(`   完整数据: 1 个 (${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目)`);
    console.log(`   输出目录: output/`);
    
    // 文件大小统计
    let totalFileSizeKB = 0;
    
    // 统计省份文件总大小
    result.provinceFiles.forEach(file => {
      const size = parseFloat(file.fileSize);
      if (!isNaN(size)) totalFileSizeKB += size;
    });
    
    // 统计通用文件总大小
    result.universalFiles.forEach(file => {
      const size = parseFloat(file.fileSize);
      if (!isNaN(size)) totalFileSizeKB += size;
    });
    
    console.log(`   总大小: ${(totalFileSizeKB / 1024).toFixed(2)} MB`);
    
    console.log('\n📁 生成的文件列表:');
    console.log('   省份文件:');
    
    // 按省份名称排序显示
    const sortedProvinceFiles = [...result.provinceFiles].sort((a, b) => 
      a.province.localeCompare(b.province)
    );
    
    sortedProvinceFiles.slice(0, 8).forEach(file => {
      console.log(`     - ${file.fileName}: ${file.province} (${file.localChannelCount}本地+${file.universalChannelCount}通用+${file.otherChannelCount}其他)`);
    });
    
    if (sortedProvinceFiles.length > 8) {
      console.log(`     ... 还有 ${sortedProvinceFiles.length - 8} 个省份文件`);
    }
    
    console.log('\n   通用文件:');
    result.universalFiles.forEach(file => {
      console.log(`     - ${file.fileName}: ${file.category} (${file.channelCount}个频道)`);
    });
    
    console.log('\n   特殊文件:');
    console.log(`     - all.xml: ${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目 (${result.completeFile.fileSize})`);
    console.log('     - index.json: 索引文件');
    
    // 生成报告文件
    this.generateReportFile(result, duration);
    
    console.log('\n💡 使用说明:');
    console.log('   1. 每个省份文件已包含本地频道 + 全国通用频道 + 其他频道');
    console.log('   2. 普通用户只需下载对应省份文件即可');
    console.log('   3. 完整数据在 all.xml 中');
    console.log('   4. 查看 index.json 获取详细信息');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 处理失败:', error.message);
    console.error('错误堆栈:');
    console.error(error.stack);
    process.exit(1);
  }
}

// 生成报告文件
function generateReportFile(result, duration) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      statistics: {
        totalProvinces: result.provinceFiles.length,
        totalCategories: result.universalFiles.length,
        totalChannels: result.completeFile.channelCount,
        totalProgrammes: result.completeFile.programmeCount,
        otherChannels: result.provinceFiles[0]?.otherChannelCount || 0
      },
      provinces: result.provinceFiles.map(file => ({
        province: file.province,
        file: file.fileName,
        local: file.localChannelCount,
        universal: file.universalChannelCount,
        other: file.otherChannelCount,
        total: file.totalChannelCount,
        size: file.fileSize
      })),
      categories: result.universalFiles.map(file => ({
        category: file.category,
        file: file.fileName,
        channels: file.channelCount,
        size: file.fileSize
      }))
    };
    
    const reportPath = path.join('output', 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    
    console.log(`    ✅ report.json: 详细报告文件已生成`);
  } catch (error) {
    console.warn('    ⚠️  无法生成报告文件:', error.message);
  }
}

// 直接运行
if (require.main === module) {
  main().catch(error => {
    console.error('致命错误:', error);
    process.exit(1);
  });
}

module.exports = { main };    
    console.log('\n📊 统计信息:');
    console.log(`   总耗时: ${duration} 秒`);
    console.log(`   总文件: ${result.provinceFiles.length + result.universalFiles.length + 2} 个`);
    console.log(`   省份文件: ${result.provinceFiles.length} 个`);
    console.log(`   通用文件: ${result.universalFiles.length} 个`);
    console.log(`   完整数据: 1 个 (${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目)`);
    console.log(`   输出目录: output/`);
    
    console.log('\n📁 生成的文件列表:');
    console.log('   省份文件:');
    result.provinceFiles.slice(0, 5).forEach(file => {
      console.log(`     - ${file.fileName}: ${file.province}`);
    });
    if (result.provinceFiles.length > 5) {
      console.log(`     ... 还有 ${result.provinceFiles.length - 5} 个省份文件`);
    }
    
    console.log('\n   通用文件:');
    result.universalFiles.forEach(file => {
      console.log(`     - ${file.fileName}: ${file.category}`);
    });
    
    console.log('\n   特殊文件:');
    console.log(`     - all.xml: ${result.completeFile.channelCount}频道 ${result.completeFile.programmeCount}节目`);
    console.log('     - index.json: 索引文件');
    
    console.log('\n💡 使用说明:');
    console.log('   1. 每个省份文件已包含本地频道 + 全国通用频道');
    console.log('   2. 普通用户只需下载对应省份文件即可');
    console.log('   3. 完整数据在 all.xml 中');
    console.log('   4. 查看 index.json 获取详细信息');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 处理失败:', error.message);
    if (error.stack) {
      console.error('错误详情:', error.stack.split('\n')[0]);
    }
    process.exit(1);
  }
}

// 直接运行
if (require.main === module) {
  main().catch(error => {
    console.error('致命错误:', error);
    process.exit(1);
  });
}

module.exports = { main };
