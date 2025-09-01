/**
 * PNG角色卡解析测试工具 - 基于SillyTavern官方实现
 * 用于测试PNG文件中的角色卡数据提取
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

  let ended = false;
  const chunks = [];
  let idx = 8;

  console.log('开始解析PNG chunks...');

  while (idx < data.length) {
    // 读取当前chunk的长度
    uint8[3] = data[idx++];
    uint8[2] = data[idx++];
    uint8[1] = data[idx++];
    uint8[0] = data[idx++];

    const length = uint32[0];
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
      ended = true;
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

    chunks.push({
      name: name,
      data: chunkData,
    });

    // 如果是tEXt chunk，处理文本数据
    if (name === 'tEXt') {
      console.log(`  tEXt chunk数据长度: ${chunkData.length}`);

      // 查找null分隔符
      let nullIndex = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIndex = i;
          break;
        }
      }

      if (nullIndex !== -1) {
        const keyword = Buffer.from(chunkData.slice(0, nullIndex)).toString('utf8');
        const textData = chunkData.slice(nullIndex + 1);
        
        console.log(`  关键字: ${keyword}`);
        console.log(`  文本数据长度: ${textData.length}`);

        // 检查是否是我们要找的identifier
        if (keyword === identifier || keyword.toLowerCase().includes('chara')) {
          console.log(`🎯 找到角色卡数据! 关键字: ${keyword}`);
          
          try {
            // 尝试将文本数据转换为字符串
            let textString = '';
            
            // 方法1: 使用Buffer并指定UTF-8编码
            try {
              textString = Buffer.from(textData).toString('utf8');
              console.log('✅ 使用UTF-8解码成功');
            } catch (e) {
              // 方法2: 使用Latin1编码
              try {
                textString = Buffer.from(textData).toString('latin1');
                console.log('✅ 使用Latin1解码成功');
              } catch (e2) {
                console.log('❌ 字符串解码失败');
                return null;
              }
            }
            
            console.log(`解码后的字符串长度: ${textString.length}`);
            console.log(`字符串前100字符: ${textString.substring(0, 100)}`);
            
            // 尝试Base64解码
            let decodedData = null;
            try {
              decodedData = Buffer.from(textString, 'base64').toString('utf8');
              console.log('✅ Base64解码成功');
              console.log(`Base64解码后长度: ${decodedData.length}`);
              console.log(`解码数据前100字符: ${decodedData.substring(0, 100)}`);
            } catch (e) {
              console.log('ℹ️  不是Base64编码，尝试直接解析JSON');
              decodedData = textString;
            }
            
            // 尝试解析JSON
            try {
              const parsed = JSON.parse(decodedData);
              console.log('✅ JSON解析成功!');
              console.log('角色卡信息:');
              if (parsed.name) console.log(`  姓名: ${parsed.name}`);
              if (parsed.description) console.log(`  描述: ${parsed.description.substring(0, 100)}...`);
              if (parsed.personality) console.log(`  性格: ${parsed.personality.substring(0, 100)}...`);
              if (parsed.scenario) console.log(`  场景: ${parsed.scenario.substring(0, 100)}...`);
              if (parsed.first_mes) console.log(`  开场白: ${parsed.first_mes.substring(0, 100)}...`);
              
              return parsed;
            } catch (e) {
              console.log('❌ JSON解析失败:', e.message);
              console.log('数据内容:', decodedData.substring(0, 500));
              return null;
            }
            
          } catch (e) {
            console.log('❌ 数据处理失败:', e.message);
            return null;
          }
        }
      }
    }
  }

  console.log('❌ 未找到角色卡数据');
  return null;
}

        const fs = require('fs');
        const path = require('path');

        function extractTextChunks(data) {
          const chunks = {};

          // PNG文件头: 89 50 4E 47 0D 0A 1A 0A
          if (data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4e || data[3] !== 0x47) {
            throw new Error('不是有效的PNG文件');
          }

          let offset = 8; // 跳过PNG文件头

          while (offset < data.length - 8) {
            // 读取chunk长度 (big-endian)
            const length = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
            offset += 4;

            // 读取chunk类型
            const type = String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
            offset += 4;

            console.log(`发现 ${type} chunk，长度: ${length}`);

            // 如果是文本chunk
            if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
              const chunkData = data.slice(offset, offset + length);

              if (type === 'tEXt') {
                // tEXt chunk: keyword\0text
                const nullIndex = chunkData.indexOf(0);
                if (nullIndex !== -1) {
                  const keyword = chunkData.slice(0, nullIndex).toString('latin1');
                  const text = chunkData.slice(nullIndex + 1).toString('latin1');
                  chunks[keyword] = text;
                  console.log(`  键名: ${keyword}`);
                  console.log(`  数据长度: ${text.length}`);
                  if (text.length < 200) {
                    console.log(`  内容预览: ${text.substring(0, 100)}...`);
                  }
                }
              } else if (type === 'iTXt') {
                // iTXt chunk: keyword\0compression\0language\0translated_keyword\0text
                const nullIndices = [];

                for (let i = 0; i < chunkData.length; i++) {
                  if (chunkData[i] === 0) {
                    nullIndices.push(i);
                    if (nullIndices.length === 4) break;
                  }
                }

                if (nullIndices.length >= 4) {
                  const keyword = chunkData.slice(0, nullIndices[0]).toString('utf8');
                  const text = chunkData.slice(nullIndices[3] + 1).toString('utf8');
                  chunks[keyword] = text;
                  console.log(`  键名: ${keyword}`);
                  console.log(`  数据长度: ${text.length}`);
                  if (text.length < 200) {
                    console.log(`  内容预览: ${text.substring(0, 100)}...`);
                  }
                }
              }
            }

            // 移动到下一个chunk (data + CRC)
            offset += length + 4;

            // 如果遇到IEND chunk，停止处理
            if (type === 'IEND') {
              console.log('到达IEND chunk，停止解析');
              break;
            }
          }

          return chunks;
        }

        function testPNGFile(filePath) {
          console.log(`\n分析PNG文件: ${filePath}`);
          console.log('='.repeat(50));

          try {
            const data = fs.readFileSync(filePath);
            console.log(`文件大小: ${data.length} 字节`);

            const chunks = extractTextChunks(data);

            console.log(`\n找到 ${Object.keys(chunks).length} 个文本chunk:`);

            for (const [key, value] of Object.entries(chunks)) {
              console.log(`\n键名: ${key}`);
              console.log(`数据长度: ${value.length}`);

              // 尝试检测是否为角色卡数据
              if (key.toLowerCase().includes('chara') || key.toLowerCase().includes('character')) {
                console.log('🎯 这可能是角色卡数据!');

                // 尝试base64解码
                try {
                  const decoded = Buffer.from(value, 'base64').toString('utf8');
                  const parsed = JSON.parse(decoded);
                  console.log('✅ 成功解析为JSON!');
                  console.log('角色信息预览:');
                  if (parsed.name) console.log(`  姓名: ${parsed.name}`);
                  if (parsed.description) console.log(`  描述: ${parsed.description.substring(0, 100)}...`);
                  if (parsed.personality) console.log(`  性格: ${parsed.personality.substring(0, 100)}...`);
                } catch (e) {
                  // 尝试直接解析JSON
                  try {
                    const parsed = JSON.parse(value);
                    console.log('✅ 直接解析为JSON成功!');
                    console.log('角色信息预览:');
                    if (parsed.name) console.log(`  姓名: ${parsed.name}`);
                    if (parsed.description) console.log(`  描述: ${parsed.description.substring(0, 100)}...`);
                  } catch (e2) {
                    console.log('❌ JSON解析失败');
                    console.log(`内容预览: ${value.substring(0, 200)}...`);
                  }
                }
              } else {
                console.log(`内容预览: ${value.substring(0, 100)}...`);
              }
            }
          } catch (error) {
            console.error('错误:', error.message);
          }
        }

        // 测试指定的PNG文件
        const testFile = '/Users/zq/Downloads/示例.png';

        if (fs.existsSync(testFile)) {
          // 调用两种解析方法进行对比
          console.log('\n=== 使用简单解析方法 ===');
          testPNGFile(testFile);
          
          console.log('\n=== 使用SillyTavern官方解析方法 ===');
          const fileData = fs.readFileSync(testFile);
          const result = extractDataFromPng(fileData, 'chara');
          
          if (result) {
            console.log('✅ SillyTavern解析成功!');
            console.log('解析结果:', result);
          } else {
            console.log('❌ SillyTavern解析失败');
          }
        } else {
          console.log(`文件不存在: ${testFile}`);
          console.log('请确保PNG文件路径正确');
        }
      }
    }
  }
}
