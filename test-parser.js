const fs = require('fs');
const path = require('path');

// 模拟main.js中的解析逻辑
try {
  const languageFilePath = path.join(__dirname, 'language.js');
  const languageContent = fs.readFileSync(languageFilePath, 'utf8');
  
  console.log('File read successfully');
  
  // 测试我们改进的正则表达式
  const match = languageContent.match(/globalTranslations\s*=\s*(\{[\s\S]*?\s*\}\s*\});/);
  console.log('Match found:', !!match);
  
  if (match && match[1]) {
    console.log('Match length:', match[1].length);
    console.log('First 100 characters of match:', match[1].substring(0, 100));
    
    try {
      // 测试Function构造函数解析
      console.log('Trying to parse with Function constructor...');
      const parsedObj = new Function('return ' + match[1])();
      console.log('Success! Parsed with Function constructor');
      console.log('Keys in parsed object:', Object.keys(parsedObj));
      console.log('First few zh-CN keys:', Object.keys(parsedObj['zh-CN'] || {}).slice(0, 5));
    } catch (jsError) {
      console.error('Error with Function constructor:', jsError.message);
      
      try {
        // 测试JSON解析
        console.log('Trying to parse with JSON.parse after conversion...');
        const jsonStr = match[1]
          .replace(/'/g, '"')
          .replace(/([^\\])"/g, '$1\\"')
          .replace(/,\s*\}/g, '}');
        console.log('Converted to JSON string (first 100 chars):', jsonStr.substring(0, 100));
        const parsedObj = JSON.parse(jsonStr);
        console.log('Success! Parsed with JSON.parse');
        console.log('Keys in parsed object:', Object.keys(parsedObj));
      } catch (jsonError) {
        console.error('Error with JSON.parse:', jsonError.message);
      }
    }
  }
} catch (error) {
  console.error('Overall error:', error);
}