/**
 * PNG角色卡解析器 - 基于SillyTavern官方实现
 * 从test_png_fixed.js改写为TypeScript模块
 */

export interface CharacterData {
  name?: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  character_book?: any;
  tags?: string[];
  creator?: string;
  character_version?: string;
  extensions?: Record<string, any>;
  [key: string]: any;
}

export interface ParseResult {
  success: boolean;
  data?: CharacterData;
  error?: string;
  timestamp: number;
  filename?: string;
}

/**
 * 从PNG数据中提取角色卡信息 - 使用SillyTavern的官方算法
 */
export function extractDataFromPng(data: Uint8Array, identifier = 'chara'): CharacterData | null {
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
        const keyword = new TextDecoder('utf-8').decode(keywordBytes);
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
            // 尝试多种编码方式解码文本数据
            let textString = '';
            let decodingMethod = '';
            
            // 方法1: 尝试UTF-8解码（最常见）
            try {
              textString = new TextDecoder('utf-8', { fatal: true }).decode(textBytes);
              decodingMethod = 'UTF-8';
              console.log('✅ 使用UTF-8解码成功');
            } catch (e) {
              console.log('⚠️  UTF-8解码失败，尝试其他方式...');
              
              // 方法2: 尝试UTF-8解码（非严格模式）
              try {
                textString = new TextDecoder('utf-8', { fatal: false }).decode(textBytes);
                // 检查是否有替换字符，如果没有则认为成功
                if (!textString.includes('�')) {
                  decodingMethod = 'UTF-8 (non-strict)';
                  console.log('✅ 使用UTF-8非严格模式解码成功');
                } else {
                  throw new Error('包含替换字符');
                }
              } catch (e2) {
                console.log('⚠️  UTF-8非严格模式解码失败，尝试其他编码...');
                
                // 方法3: 尝试其他常见编码
                try {
                  // 先尝试ISO-8859-1（兼容性更好）
                  textString = new TextDecoder('iso-8859-1').decode(textBytes);
                  decodingMethod = 'ISO-8859-1';
                  console.log('✅ 使用ISO-8859-1解码成功');
                } catch (e3) {
                  console.log('⚠️  ISO-8859-1解码失败，尝试Latin1...');
                  
                  // 方法4: 使用Latin1解码（保持字节值）
                  try {
                    textString = new TextDecoder('latin1').decode(textBytes);
                    decodingMethod = 'Latin1';
                    console.log('✅ 使用Latin1解码');
                  } catch (e4) {
                    console.log('⚠️  Latin1解码失败，使用字节直接转换...');
                    
                    // 方法5: 字节直接转换（最后的选择）
                    textString = '';
                    for (let i = 0; i < textBytes.length; i++) {
                      textString += String.fromCharCode(textBytes[i]);
                    }
                    decodingMethod = 'Byte-to-Char';
                    console.log('使用字节直接转换');
                  }
                }
              }
            }

            console.log(`解码方法: ${decodingMethod}`);
            console.log(`解码后的字符串长度: ${textString.length}`);

            // 检查前几个字符，判断解码是否合理
            const firstChars = textString.substring(0, 50);
            console.log(`字符串开头: "${firstChars}"`);
            
            // 如果仍然包含大量乱码字符，尝试重新解码
            if (textString.includes('�') && decodingMethod !== 'Byte-to-Char') {
              console.log('⚠️  检测到替换字符，尝试字节直接转换...');
              textString = '';
              for (let i = 0; i < textBytes.length; i++) {
                textString += String.fromCharCode(textBytes[i]);
              }
              decodingMethod = 'Byte-to-Char (fallback)';
              console.log(`重新解码后开头: "${textString.substring(0, 50)}"`);
            }

            // 尝试Base64解码
            let decodedData = textString;
            try {
              // 检查是否是Base64格式
              if (/^[A-Za-z0-9+/]+=*$/.test(textString.trim())) {
                const base64Decoded = atob(textString);
                console.log('✅ Base64解码成功');
                console.log(`Base64解码后长度: ${base64Decoded.length}`);
                
                // Base64解码后的数据可能仍需要UTF-8解码
                try {
                  // 将Base64解码的字符串转换为字节数组
                  const bytes = new Uint8Array(base64Decoded.length);
                  for (let i = 0; i < base64Decoded.length; i++) {
                    bytes[i] = base64Decoded.charCodeAt(i);
                  }
                  
                  // 尝试UTF-8解码字节数组
                  const utf8Decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
                  
                  // 检查UTF-8解码结果是否更好（更少的替换字符）
                  const originalReplacementCount = base64Decoded.split('�').length - 1;
                  const utf8ReplacementCount = utf8Decoded.split('�').length - 1;
                  
                  if (utf8ReplacementCount < originalReplacementCount || 
                      (utf8ReplacementCount === 0 && utf8Decoded.includes('{'))) {
                    decodedData = utf8Decoded;
                    console.log('✅ Base64后UTF-8解码成功，使用UTF-8解码结果');
                  } else {
                    decodedData = base64Decoded;
                    console.log('ℹ️  Base64后UTF-8解码效果不佳，使用原始Base64解码结果');
                  }
                } catch (e) {
                  console.log('⚠️  Base64后UTF-8解码失败，使用原始Base64解码结果');
                  decodedData = base64Decoded;
                }
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
              return parsed as CharacterData;
            } catch (e) {
              console.log('❌ JSON解析失败:', (e as Error).message);

              // 尝试修复常见的JSON问题
              try {
                // 移除可能的BOM或隐藏字符
                const cleanedData = decodedData.replace(/^\uFEFF/, '').trim();
                const parsed = JSON.parse(cleanedData);
                console.log('✅ 清理后JSON解析成功!');
                return parsed as CharacterData;
              } catch (e2) {
                console.log('❌ 清理后仍然无法解析JSON');
                return null;
              }
            }
          } catch (e) {
            console.log('❌ 数据处理失败:', (e as Error).message);
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

/**
 * 解析PNG文件
 */
export async function parsePngFile(file: File): Promise<ParseResult> {
  try {
    console.log(`开始解析PNG文件: ${file.name}`);
    
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    console.log(`文件大小: ${data.length} 字节`);
    
    const characterData = extractDataFromPng(data, 'chara');
    
    if (characterData) {
      return {
        success: true,
        data: characterData,
        timestamp: Date.now(),
        filename: file.name
      };
    } else {
      return {
        success: false,
        error: '未找到角色卡数据',
        timestamp: Date.now(),
        filename: file.name
      };
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      timestamp: Date.now(),
      filename: file.name
    };
  }
}
