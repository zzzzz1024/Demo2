/**
 * PNG角色卡解析测试工具 - 基于SillyTavern官方实现
 * 专注于角色卡解析，解决乱码问题
 */

const fs = require('fs');

/**
 * 从PNG数据中提取角色卡信息 - 使用SillyTavern的官方算法
 */
function extractDataFromPng(data, identifier = 'chara') {
  console.log('使用SillyTavern官方算法解析PNG角色卡...');

  const uint8 = new Uint8Array(4);
  const uint32 = new Uint32Array(uint8.buffer);

  // 检查PNG文件头是否有效
  if (
    !data ||
    data[0] !== 0x89 ||
    data[1] !== 0x50 ||
    data[2] !== 0x4e ||
    data[3] !== 0x47 ||
    data[4] !== 0x0d ||
    data[5] !== 0x0a ||
    data[6] !== 0x1a ||
    data[7] !== 0x0a
  ) {
    console.log('❌ PNG文件头无效');
    return null;
  }
  console.log('✅ PNG文件头有效');

  let idx = 8;
  console.log('开始解析PNG chunks...');

  while (idx < data.length) {
    // 读取当前chunk的长度 (big-endian)
    uint8[3] = data[idx++];
    uint8[2] = data[idx++];
    uint8[1] = data[idx++];
    uint8[0] = data[idx++];

    const length = uint32[0];

    // 读取chunk类型
    const chunkType = new Uint8Array(4);
    chunkType[0] = data[idx++];
    chunkType[1] = data[idx++];
    chunkType[2] = data[idx++];
    chunkType[3] = data[idx++];

    // 获取chunk名称
    const name =
      String.fromCharCode(chunkType[0]) +
      String.fromCharCode(chunkType[1]) +
      String.fromCharCode(chunkType[2]) +
      String.fromCharCode(chunkType[3]);

    console.log(`发现chunk: ${name}, 长度: ${length}`);

    // IEND头标记文件结束
    if (name === 'IEND') {
      console.log('到达IEND chunk，停止解析');
      break;
    }

    // 读取chunk的内容
    const chunkData = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      chunkData[i] = data[idx++];
    }

    // 跳过CRC值
    idx += 4;

    // 如果是tEXt chunk，处理文本数据
    if (name === 'tEXt') {
      console.log(`  处理tEXt chunk，数据长度: ${chunkData.length}`);

      // 查找null分隔符
      let nullIndex = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIndex = i;
          break;
        }
      }

      if (nullIndex !== -1) {
        // 提取关键字
        const keywordBytes = chunkData.slice(0, nullIndex);
        const textBytes = chunkData.slice(nullIndex + 1);

        // 使用正确的编码解析关键字
        const keyword = Buffer.from(keywordBytes).toString('utf8');
        console.log(`  关键字: "${keyword}"`);
        console.log(`  文本数据长度: ${textBytes.length}`);

        // 检查是否是角色卡数据
        if (
          keyword === identifier ||
          keyword.toLowerCase().includes('chara') ||
          keyword.toLowerCase().includes('character')
        ) {
          console.log(`🎯 找到角色卡数据! 关键字: "${keyword}"`);

          try {
            // 方法1: 尝试UTF-8解码
            let textString = '';
            try {
              textString = Buffer.from(textBytes).toString('utf8');
              console.log('✅ 使用UTF-8解码');
            } catch (e) {
              // 方法2: 尝试Latin1解码
              textString = Buffer.from(textBytes).toString('latin1');
              console.log('✅ 使用Latin1解码');
            }

            console.log(`解码后的字符串长度: ${textString.length}`);

            // 检查前几个字符，判断编码是否正确
            const firstChars = textString.substring(0, 20);
            console.log(`字符串开头: "${firstChars}"`);

            // 如果包含乱码字符，说明编码有问题
            if (firstChars.includes('�') || (/[^\x00-\x7F]/.test(firstChars) && !firstChars.includes('{'))) {
              console.log('⚠️  检测到可能的编码问题，尝试其他解码方式...');

              // 尝试直接转换字节
              textString = '';
              for (let i = 0; i < textBytes.length; i++) {
                textString += String.fromCharCode(textBytes[i]);
              }
              console.log('使用字节直接转换');
              console.log(`转换后开头: "${textString.substring(0, 20)}"`);
            }

            // 尝试Base64解码
            let decodedData = textString;
            try {
              // 检查是否是Base64格式
              if (/^[A-Za-z0-9+/]+=*$/.test(textString.trim())) {
                decodedData = Buffer.from(textString, 'base64').toString('utf8');
                console.log('✅ Base64解码成功');
                console.log(`Base64解码后长度: ${decodedData.length}`);
              } else {
                console.log('ℹ️  不是Base64格式，直接使用原始文本');
              }
            } catch (e) {
              console.log('⚠️  Base64解码失败，使用原始文本');
            }

            console.log(`最终数据前100字符: "${decodedData.substring(0, 100)}"`);

            // 尝试解析JSON
            try {
              const parsed = JSON.parse(decodedData);
              console.log('✅ JSON解析成功!');
              console.log('\n=== 角色卡信息 ===');

              if (parsed.name) {
                console.log(`姓名: ${parsed.name}`);
                // 检查名字是否有乱码
                if (/[^\x00-\x7F]/.test(parsed.name) && !/[\u4e00-\u9fff]/.test(parsed.name)) {
                  console.log('⚠️  姓名可能存在编码问题');
                }
              }

              if (parsed.description) {
                const desc = parsed.description.substring(0, 200);
                console.log(`描述: ${desc}${parsed.description.length > 200 ? '...' : ''}`);
              }

              if (parsed.personality) {
                const pers = parsed.personality.substring(0, 100);
                console.log(`性格: ${pers}${parsed.personality.length > 100 ? '...' : ''}`);
              }

              if (parsed.scenario) {
                const scen = parsed.scenario.substring(0, 100);
                console.log(`场景: ${scen}${parsed.scenario.length > 100 ? '...' : ''}`);
              }

              if (parsed.first_mes) {
                const first = parsed.first_mes.substring(0, 100);
                console.log(`开场白: ${first}${parsed.first_mes.length > 100 ? '...' : ''}`);
              }

              // 检查扩展信息
              if (parsed.extensions) {
                console.log(`扩展数量: ${Object.keys(parsed.extensions).length}`);
              }

              return parsed;
            } catch (e) {
              console.log('❌ JSON解析失败:', e.message);
              console.log(`数据样本: "${decodedData.substring(0, 200)}"`);

              // 尝试修复常见的JSON问题
              try {
                // 移除可能的BOM或隐藏字符
                const cleanedData = decodedData.replace(/^\uFEFF/, '').trim();
                const parsed = JSON.parse(cleanedData);
                console.log('✅ 清理后JSON解析成功!');
                return parsed;
              } catch (e2) {
                console.log('❌ 清理后仍然无法解析JSON');
                return null;
              }
            }
          } catch (e) {
            console.log('❌ 数据处理失败:', e.message);
            return null;
          }
        } else {
          console.log(`  跳过非角色卡chunk: "${keyword}"`);
        }
      } else {
        console.log('  未找到null分隔符');
      }
    }
  }

  console.log('❌ 未找到角色卡数据');
  return null;
}

// 简化的备用解析方法
function simpleExtractTextChunks(data) {
  console.log('\n=== 使用简化方法解析PNG ===');
  const chunks = {};

  if (data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4e || data[3] !== 0x47) {
    throw new Error('不是有效的PNG文件');
  }

  let offset = 8;

  while (offset < data.length - 8) {
    const length = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    offset += 4;

    const type = String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    offset += 4;

    console.log(`发现 ${type} chunk，长度: ${length}`);

    if (type === 'tEXt') {
      const chunkData = data.slice(offset, offset + length);
      const nullIndex = chunkData.indexOf(0);

      if (nullIndex !== -1) {
        const keyword = Buffer.from(chunkData.slice(0, nullIndex)).toString('utf8');
        const text = Buffer.from(chunkData.slice(nullIndex + 1)).toString('latin1');
        chunks[keyword] = text;
        console.log(`  键名: "${keyword}"`);
        console.log(`  数据长度: ${text.length}`);
      }
    }

    offset += length + 4;

    if (type === 'IEND') {
      break;
    }
  }

  return chunks;
}

// 主测试函数
function testPNGFile(filePath) {
  console.log(`\n开始分析PNG文件: ${filePath}`);
  console.log('='.repeat(60));

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return;
    }

    const data = fs.readFileSync(filePath);
    console.log(`文件大小: ${data.length} 字节`);

    // 方法1: 使用SillyTavern官方方法
    console.log('\n🔍 尝试SillyTavern官方解析方法...');
    const result1 = extractDataFromPng(data, 'chara');

    if (result1) {
      console.log('✅ SillyTavern方法解析成功!');
    } else {
      console.log('❌ SillyTavern方法解析失败');

      // 方法2: 使用简化方法作为备用
      console.log('\n🔍 尝试简化解析方法...');
      const chunks = simpleExtractTextChunks(data);

      console.log(`找到 ${Object.keys(chunks).length} 个文本chunk:`);

      for (const [key, value] of Object.entries(chunks)) {
        console.log(`\n键名: "${key}"`);
        console.log(`数据长度: ${value.length}`);

        if (key.toLowerCase().includes('chara') || key.toLowerCase().includes('character')) {
          console.log('🎯 这可能是角色卡数据!');

          try {
            const decoded = Buffer.from(value, 'base64').toString('utf8');
            const parsed = JSON.parse(decoded);
            console.log('✅ 简化方法解析成功!');
            if (parsed.name) console.log(`  姓名: ${parsed.name}`);
          } catch (e) {
            try {
              const parsed = JSON.parse(value);
              console.log('✅ 直接JSON解析成功!');
              if (parsed.name) console.log(`  姓名: ${parsed.name}`);
            } catch (e2) {
              console.log('❌ 简化方法也无法解析');
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ 处理过程中发生错误:', error.message);
  }
}

// 执行测试
const testFile = '/Users/zq/Downloads/示例.png';
testPNGFile(testFile);
