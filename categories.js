// test-minimal.js
const categoryRules = [
  { 
    name: '测试', 
    regex: /test/gi, 
    isUniversal: true, 
    priority: 1 
  }
];

console.log('✅ 极简版本加载成功');
module.exports = { categoryRules };
