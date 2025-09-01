<template>
  <div class="character-display">
    <!-- 操作按钮栏 -->
    <div class="action-bar">
      <button @click="startEdit" class="action-btn edit-btn">
        ✏️ 编辑数据
      </button>
      <button @click="exportAsImage" class="action-btn export-btn">
        🖼️ 导出为图片
      </button>
      <button @click="replaceImage" class="action-btn replace-btn">
        🔄 替换图片
      </button>
    </div>

    <!-- 数据概览和导航 -->
    <div class="data-overview">
      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-label">总字段数</span>
          <span class="stat-value">{{ totalFields }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">数据大小</span>
          <span class="stat-value">{{ dataSize }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">展开状态</span>
          <span class="stat-value">{{ expandedSections.length }}/{{ totalSections }}</span>
        </div>
      </div>
      
      <div class="overview-actions">
        <button @click="expandAll" class="overview-btn">📖 全部展开</button>
        <button @click="collapseAll" class="overview-btn">📚 全部折叠</button>
        <button @click="toggleSearch" class="overview-btn">🔍 搜索</button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div v-if="showSearch" class="search-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索角色卡内容..."
        class="search-input"
      />
      <div class="search-options">
        <label class="search-option">
          <input type="checkbox" v-model="searchOptions.caseSensitive" />
          区分大小写
        </label>
        <label class="search-option">
          <input type="checkbox" v-model="searchOptions.searchInCollapsed" />
          搜索折叠内容
        </label>
      </div>
      <div v-if="searchResults.length > 0" class="search-results">
        找到 {{ searchResults.length }} 个匹配项
        <button @click="clearSearch" class="clear-search-btn">清除搜索</button>
      </div>
    </div>

    <!-- 编辑器模态框 -->
    <div v-if="showEditor" class="editor-modal">
      <div class="modal-backdrop" @click="closeEditor"></div>
      <div class="modal-content">
        <CharacterEditor 
          :character="editableCharacter" 
          @close="closeEditor"
          @save="onSaveEdit"
        />
      </div>
    </div>
    <!-- 基础信息 -->
    <div class="info-section" :class="{ 'collapsed': !expandedSections.includes('basic') }">
      <div class="section-header" @click="toggleSection('basic')">
        <h3 class="section-title">📝 基础信息</h3>
        <div class="section-controls">
          <span class="section-count">{{ getBasicInfoCount() }} 项</span>
          <span class="expand-icon">{{ expandedSections.includes('basic') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('basic')" class="section-content">
        <div class="info-grid">
          <div class="info-item" v-if="character.name">
            <label>姓名</label>
            <div class="info-value" v-html="highlightSearch(character.name)"></div>
          </div>
          <div class="info-item" v-if="character.creator">
            <label>创作者</label>
            <div class="info-value" v-html="highlightSearch(character.creator)"></div>
          </div>
          <div class="info-item" v-if="character.character_version">
            <label>版本</label>
            <div class="info-value" v-html="highlightSearch(character.character_version)"></div>
          </div>
          <div class="info-item" v-if="character.tags && character.tags.length > 0">
            <label>标签</label>
            <div class="info-value">
              <span v-for="tag in character.tags" :key="tag" class="tag" v-html="highlightSearch(tag)"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色描述 -->
    <div class="info-section" v-if="character.description" :class="{ 'collapsed': !expandedSections.includes('description') }">
      <div class="section-header" @click="toggleSection('description')">
        <h3 class="section-title">👤 角色描述</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.description) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('description') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('description')" class="section-content">
        <div class="text-content" v-html="highlightSearch(character.description)"></div>
      </div>
    </div>

    <!-- 性格特征 -->
    <div class="info-section" v-if="character.personality" :class="{ 'collapsed': !expandedSections.includes('personality') }">
      <div class="section-header" @click="toggleSection('personality')">
        <h3 class="section-title">🎭 性格特征</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.personality) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('personality') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('personality')" class="section-content">
        <div class="text-content" v-html="highlightSearch(character.personality)"></div>
      </div>
    </div>

    <!-- 场景设定 -->
    <div class="info-section" v-if="character.scenario" :class="{ 'collapsed': !expandedSections.includes('scenario') }">
      <div class="section-header" @click="toggleSection('scenario')">
        <h3 class="section-title">🌍 场景设定</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.scenario) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('scenario') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('scenario')" class="section-content">
        <div class="text-content" v-html="highlightSearch(character.scenario)"></div>
      </div>
    </div>

    <!-- 开场白 -->
    <div class="info-section" v-if="character.first_mes" :class="{ 'collapsed': !expandedSections.includes('first_mes') }">
      <div class="section-header" @click="toggleSection('first_mes')">
        <h3 class="section-title">💬 开场白</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.first_mes) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('first_mes') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('first_mes')" class="section-content">
        <div class="text-content dialogue" v-html="highlightSearch(character.first_mes)"></div>
      </div>
    </div>

    <!-- 对话示例 -->
    <div class="info-section" v-if="character.mes_example" :class="{ 'collapsed': !expandedSections.includes('mes_example') }">
      <div class="section-header" @click="toggleSection('mes_example')">
        <h3 class="section-title">📖 对话示例</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.mes_example) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('mes_example') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('mes_example')" class="section-content">
        <div class="text-content dialogue" v-html="highlightSearch(character.mes_example)"></div>
      </div>
    </div>

    <!-- 备用问候语 -->
    <div class="info-section" v-if="character.alternate_greetings && character.alternate_greetings.length > 0" :class="{ 'collapsed': !expandedSections.includes('alternate_greetings') }">
      <div class="section-header" @click="toggleSection('alternate_greetings')">
        <h3 class="section-title">🔄 备用问候语</h3>
        <div class="section-controls">
          <span class="section-count">{{ character.alternate_greetings.length }} 条</span>
          <span class="expand-icon">{{ expandedSections.includes('alternate_greetings') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('alternate_greetings')" class="section-content">
        <div class="alternate-greetings">
          <div 
            v-for="(greeting, index) in character.alternate_greetings" 
            :key="index"
            class="alternate-greeting"
          >
            <div class="greeting-index">{{ index + 1 }}</div>
            <div class="greeting-text" v-html="highlightSearch(greeting)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统提示 -->
    <div class="info-section" v-if="character.system_prompt" :class="{ 'collapsed': !expandedSections.includes('system_prompt') }">
      <div class="section-header" @click="toggleSection('system_prompt')">
        <h3 class="section-title">⚙️ 系统提示</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.system_prompt) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('system_prompt') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('system_prompt')" class="section-content">
        <div class="text-content code" v-html="highlightSearch(character.system_prompt)"></div>
      </div>
    </div>

    <!-- 历史后指令 -->
    <div class="info-section" v-if="character.post_history_instructions" :class="{ 'collapsed': !expandedSections.includes('post_history_instructions') }">
      <div class="section-header" @click="toggleSection('post_history_instructions')">
        <h3 class="section-title">📜 历史后指令</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.post_history_instructions) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('post_history_instructions') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('post_history_instructions')" class="section-content">
        <div class="text-content code" v-html="highlightSearch(character.post_history_instructions)"></div>
      </div>
    </div>

    <!-- 创作者注释 -->
    <div class="info-section" v-if="character.creator_notes" :class="{ 'collapsed': !expandedSections.includes('creator_notes') }">
      <div class="section-header" @click="toggleSection('creator_notes')">
        <h3 class="section-title">📝 创作者注释</h3>
        <div class="section-controls">
          <span class="section-count">{{ getTextLength(character.creator_notes) }} 字符</span>
          <span class="expand-icon">{{ expandedSections.includes('creator_notes') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('creator_notes')" class="section-content">
        <div class="text-content" v-html="highlightSearch(character.creator_notes)"></div>
      </div>
    </div>

    <!-- 角色书 -->
    <div class="info-section" v-if="character.character_book && character.character_book.entries" :class="{ 'collapsed': !expandedSections.includes('character_book') }">
      <div class="section-header" @click="toggleSection('character_book')">
        <h3 class="section-title">📚 角色书</h3>
        <div class="section-controls">
          <span class="section-count">{{ character.character_book.entries.length }} 条目</span>
          <span class="expand-icon">{{ expandedSections.includes('character_book') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('character_book')" class="section-content">
        <div class="character-book">
          <div class="book-stats">
            <span class="stat">条目数量: {{ character.character_book.entries.length }}</span>
            <span class="stat" v-if="character.character_book.name">名称: {{ character.character_book.name }}</span>
          </div>
          <div class="book-entries">
            <div 
              v-for="(entry, index) in character.character_book.entries" 
              :key="index"
              class="book-entry"
            >
              <div class="entry-header">
                <span class="entry-keys" v-if="entry.keys && entry.keys.length > 0">
                  关键词: {{ entry.keys.join(', ') }}
                </span>
                <span class="entry-order" v-if="entry.insertion_order !== undefined">
                  顺序: {{ entry.insertion_order }}
                </span>
              </div>
              <div class="entry-content" v-html="highlightSearch(entry.content)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 扩展信息 -->
    <div class="info-section" v-if="character.extensions && Object.keys(character.extensions).length > 0" :class="{ 'collapsed': !expandedSections.includes('extensions') }">
      <div class="section-header" @click="toggleSection('extensions')">
        <h3 class="section-title">🔧 扩展信息</h3>
        <div class="section-controls">
          <span class="section-count">{{ Object.keys(character.extensions).length }} 项</span>
          <span class="expand-icon">{{ expandedSections.includes('extensions') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('extensions')" class="section-content">
        <div class="extensions">
          <div 
            v-for="[key, value] in Object.entries(character.extensions)" 
            :key="key"
            class="extension-item"
          >
            <div class="extension-key">{{ key }}</div>
            <div class="extension-value">
              <pre v-if="typeof value === 'object'">{{ JSON.stringify(value, null, 2) }}</pre>
              <span v-else v-html="highlightSearch(String(value))"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 其他字段 -->
    <div class="info-section" v-if="otherFields.length > 0" :class="{ 'collapsed': !expandedSections.includes('other_fields') }">
      <div class="section-header" @click="toggleSection('other_fields')">
        <h3 class="section-title">📋 其他字段</h3>
        <div class="section-controls">
          <span class="section-count">{{ otherFields.length }} 项</span>
          <span class="expand-icon">{{ expandedSections.includes('other_fields') ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-show="expandedSections.includes('other_fields')" class="section-content">
        <div class="other-fields">
          <div 
            v-for="field in otherFields" 
            :key="field.key"
            class="other-field"
          >
            <label>{{ field.key }}</label>
            <div class="field-value">
              <pre v-if="typeof field.value === 'object'">{{ JSON.stringify(field.value, null, 2) }}</pre>
              <span v-else v-html="highlightSearch(String(field.value))"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CharacterData } from './png解析器';
import CharacterEditor from './角色卡编辑器.vue';

const props = defineProps<{
  character: CharacterData;
  originalFile?: File;
}>();

const emit = defineEmits<{
  update: [data: CharacterData];
}>();

// 编辑器状态
const showEditor = ref(false);
const editableCharacter = ref<CharacterData>({ ...props.character });

// 折叠和搜索状态
const expandedSections = ref<string[]>(['basic']); // 默认展开基础信息
const showSearch = ref(false);
const searchQuery = ref('');
const searchResults = ref<Array<{section: string, field: string, content: string, index: number}>>([]);
const searchOptions = ref({
  caseSensitive: false,
  searchInCollapsed: false
});

// 操作函数
function startEdit() {
  editableCharacter.value = { ...props.character };
  showEditor.value = true;
}

function closeEditor() {
  showEditor.value = false;
}

function onSaveEdit(updatedData: CharacterData) {
  emit('update', updatedData);
  showEditor.value = false;
}

async function exportAsImage() {
  try {
    toastr.info('正在生成图片...', '导出中');
    
    // 创建PNG文件
    const pngData = await createPngWithCharacterData(props.character, props.originalFile);
    
    // 下载文件
    const blob = new Blob([pngData], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.character.name || 'character'}_edited.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toastr.success('图片已导出', '成功');
  } catch (error) {
    console.error('导出失败:', error);
    toastr.error('导出失败: ' + (error as Error).message, '错误');
  }
}

async function replaceImage() {
  try {
    // 创建文件输入
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        toastr.info('正在替换图片数据...', '处理中');
        
        // 用当前数据替换图片中的角色卡数据
        const newPngData = await replacePngCharacterData(file, props.character);
        
        // 下载新文件
        const blob = new Blob([newPngData], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${props.character.name || 'character'}_replaced.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toastr.success('图片数据已替换并下载', '成功');
      } catch (error) {
        console.error('替换失败:', error);
        toastr.error('替换失败: ' + (error as Error).message, '错误');
      }
    };
    
    input.click();
  } catch (error) {
    console.error('替换图片失败:', error);
    toastr.error('操作失败: ' + (error as Error).message, '错误');
  }
}

// 创建包含角色卡数据的PNG文件
async function createPngWithCharacterData(characterData: CharacterData, originalFile?: File): Promise<Uint8Array> {
  // 如果有原始文件，使用原始图片；否则创建默认图片
  if (originalFile) {
    return await replacePngCharacterData(originalFile, characterData);
  } else {
    // 创建一个默认的PNG图片并嵌入角色卡数据
    return await createDefaultPngWithData(characterData);
  }
}

// 替换PNG文件中的角色卡数据
async function replacePngCharacterData(pngFile: File, characterData: CharacterData): Promise<Uint8Array> {
  const arrayBuffer = await pngFile.arrayBuffer();
  const originalData = new Uint8Array(arrayBuffer);
  
  // 移除现有的角色卡数据
  const cleanedData = removePngTextChunks(originalData);
  
  // 添加新的角色卡数据
  const characterJson = JSON.stringify(characterData);
  const base64Data = btoa(unescape(encodeURIComponent(characterJson)));
  
  return addPngTextChunk(cleanedData, 'chara', base64Data);
}

// 创建默认PNG图片并嵌入数据
async function createDefaultPngWithData(characterData: CharacterData): Promise<Uint8Array> {
  // 创建一个简单的PNG图片 (1x1像素的透明图片)
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }
  
  // 绘制一个简单的背景
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // 添加角色名称
  if (characterData.name) {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(characterData.name, 256, 256);
  }
  
  // 转换为PNG数据
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
  
  const arrayBuffer = await blob.arrayBuffer();
  const pngData = new Uint8Array(arrayBuffer);
  
  // 添加角色卡数据
  const characterJson = JSON.stringify(characterData);
  const base64Data = btoa(unescape(encodeURIComponent(characterJson)));
  
  return addPngTextChunk(pngData, 'chara', base64Data);
}

// 移除PNG文件中的tEXt chunks
function removePngTextChunks(data: Uint8Array): Uint8Array {
  const result: number[] = [];
  const uint8 = new Uint8Array(4);
  const uint32 = new Uint32Array(uint8.buffer);
  
  // 复制PNG头部
  for (let i = 0; i < 8; i++) {
    result.push(data[i]);
  }
  
  let idx = 8;
  
  while (idx < data.length) {
    // 读取chunk长度
    uint8[3] = data[idx++];
    uint8[2] = data[idx++];
    uint8[1] = data[idx++];
    uint8[0] = data[idx++];
    const length = uint32[0];
    
    // 读取chunk类型
    const chunkType = [data[idx++], data[idx++], data[idx++], data[idx++]];
    const name = String.fromCharCode(...chunkType);
    
    // 如果不是tEXt chunk，则保留
    if (name !== 'tEXt') {
      // 写入长度
      result.push(uint8[3], uint8[2], uint8[1], uint8[0]);
      // 写入类型
      result.push(...chunkType);
      // 写入数据和CRC
      for (let i = 0; i < length + 4; i++) {
        result.push(data[idx++]);
      }
    } else {
      // 跳过tEXt chunk
      idx += length + 4;
    }
    
    // 检查是否到达IEND
    if (name === 'IEND') {
      break;
    }
  }
  
  return new Uint8Array(result);
}

// 向PNG文件添加tEXt chunk
function addPngTextChunk(data: Uint8Array, keyword: string, text: string): Uint8Array {
  const result: number[] = [];
  
  // 找到IEND chunk的位置
  let iendPos = -1;
  const uint8 = new Uint8Array(4);
  const uint32 = new Uint32Array(uint8.buffer);
  let idx = 8;
  
  while (idx < data.length) {
    uint8[3] = data[idx];
    uint8[2] = data[idx + 1];
    uint8[1] = data[idx + 2];
    uint8[0] = data[idx + 3];
    const length = uint32[0];
    
    const name = String.fromCharCode(
      data[idx + 4],
      data[idx + 5],
      data[idx + 6],
      data[idx + 7]
    );
    
    if (name === 'IEND') {
      iendPos = idx;
      break;
    }
    
    idx += 8 + length + 4;
  }
  
  if (iendPos === -1) {
    throw new Error('未找到IEND chunk');
  }
  
  // 复制IEND之前的所有数据
  for (let i = 0; i < iendPos; i++) {
    result.push(data[i]);
  }
  
  // 创建tEXt chunk
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);
  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; // null分隔符
  chunkData.set(textBytes, keywordBytes.length + 1);
  
  // 写入tEXt chunk长度
  const chunkLength = chunkData.length;
  result.push(
    (chunkLength >>> 24) & 0xff,
    (chunkLength >>> 16) & 0xff,
    (chunkLength >>> 8) & 0xff,
    chunkLength & 0xff
  );
  
  // 写入tEXt chunk类型
  result.push(0x74, 0x45, 0x58, 0x74); // "tEXt"
  
  // 写入chunk数据
  for (let i = 0; i < chunkData.length; i++) {
    result.push(chunkData[i]);
  }
  
  // 计算并写入CRC
  const crcData = new Uint8Array(4 + chunkData.length);
  crcData.set([0x74, 0x45, 0x58, 0x74], 0);
  crcData.set(chunkData, 4);
  const crc = calculateCRC32(crcData);
  result.push(
    (crc >>> 24) & 0xff,
    (crc >>> 16) & 0xff,
    (crc >>> 8) & 0xff,
    crc & 0xff
  );
  
  // 复制IEND chunk
  for (let i = iendPos; i < data.length; i++) {
    result.push(data[i]);
  }
  
  return new Uint8Array(result);
}

// 计算CRC32校验码
function calculateCRC32(data: Uint8Array): number {
  const crcTable: number[] = [];
  
  // 生成CRC表
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    crcTable[i] = c;
  }
  
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// 已知字段列表
const knownFields = [
  'name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example',
  'creator_notes', 'system_prompt', 'post_history_instructions', 'alternate_greetings',
  'character_book', 'tags', 'creator', 'character_version', 'extensions'
];

// 计算其他未知字段
const otherFields = computed(() => {
  const fields = [];
  for (const [key, value] of Object.entries(props.character)) {
    if (!knownFields.includes(key) && value !== undefined && value !== null && value !== '') {
      fields.push({ key, value });
    }
  }
  return fields;
});

// 计算属性
const totalFields = computed(() => {
  return Object.keys(props.character).filter(key => 
    props.character[key] != null && props.character[key] !== ''
  ).length;
});

const dataSize = computed(() => {
  const jsonString = JSON.stringify(props.character);
  const bytes = new Blob([jsonString]).size;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
});

const totalSections = computed(() => {
  return Object.keys(props.character).filter(key => 
    props.character[key] != null && props.character[key] !== ''
  ).length;
});

// 折叠和搜索方法
function toggleSection(section: string) {
  const index = expandedSections.value.indexOf(section);
  if (index > -1) {
    expandedSections.value.splice(index, 1);
  } else {
    expandedSections.value.push(section);
  }
}

function expandAll() {
  expandedSections.value = Object.keys(props.character).filter(key => 
    props.character[key] != null && props.character[key] !== ''
  );
}

function collapseAll() {
  expandedSections.value = [];
}

function toggleSearch() {
  showSearch.value = !showSearch.value;
  if (!showSearch.value) {
    clearSearch();
  }
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
}

function getBasicInfoCount() {
  let count = 0;
  if (props.character.name) count++;
  if (props.character.creator) count++;
  if (props.character.character_version) count++;
  if (props.character.tags && props.character.tags.length > 0) count++;
  return count;
}

function getTextLength(text: string) {
  if (!text) return 0;
  return text.length;
}

function highlightSearch(text: string): string {
  if (!searchQuery.value || !text) return text;
  
  const query = searchQuery.value;
  const regex = new RegExp(
    searchOptions.value.caseSensitive ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    searchOptions.value.caseSensitive ? 'g' : 'gi'
  );
  
  return text.replace(regex, '<mark class="search-highlight">$&</mark>');
}

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    searchResults.value = [];
    return;
  }
  
  performSearch();
});

function performSearch() {
  const query = searchQuery.value.trim();
  if (!query) return;
  
  const results: Array<{section: string, field: string, content: string, index: number}> = [];
  const searchRegex = new RegExp(
    searchOptions.value.caseSensitive ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    searchOptions.value.caseSensitive ? 'g' : 'gi'
  );
  
  // 搜索所有字段
  for (const [key, value] of Object.entries(props.character)) {
    if (value == null || value === '') continue;
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (searchRegex.test(stringValue)) {
      // 找到匹配项，展开对应部分
      if (!expandedSections.value.includes(key)) {
        expandedSections.value.push(key);
      }
      
      // 记录搜索结果
      const matches = stringValue.match(searchRegex);
      if (matches) {
        results.push({
          section: key,
          field: key,
          content: stringValue.substring(0, 100) + '...',
          index: results.length
        });
      }
    }
  }
  
  searchResults.value = results;
}
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.edit-btn {
  background: rgba(40, 167, 69, 0.9);
  
  &:hover {
    background: rgba(40, 167, 69, 1);
  }
}

.export-btn {
  background: rgba(0, 123, 255, 0.9);
  
  &:hover {
    background: rgba(0, 123, 255, 1);
  }
}

.replace-btn {
  background: rgba(255, 193, 7, 0.9);
  
  &:hover {
    background: rgba(255, 193, 7, 1);
  }
}

.editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  z-index: 1001;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: auto;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .action-bar {
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .action-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .editor-modal {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
}

// 数据概览样式
.data-overview {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e9ecef;
}

.overview-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.overview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.overview-btn {
  padding: 8px 16px;
  border: 1px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
  }
}

// 搜索栏样式
.search-bar {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ffeaa7;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 12px;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.search-options {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.search-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;

  input[type="checkbox"] {
    margin: 0;
  }
}

.search-results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #d4edda;
  color: #155724;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.clear-search-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #c82333;
  }
}

// 折叠功能样式
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
  user-select: none;

  &:hover {
    background: rgba(102, 126, 234, 0.05);
    border-radius: 6px;
  }
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-count {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
}

.expand-icon {
  font-size: 16px;
  color: #667eea;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.info-section.collapsed .expand-icon {
  transform: rotate(-90deg);
}

.section-content {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 搜索高亮样式
.search-highlight {
  background: #fff3cd;
  color: #856404;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .overview-stats {
    gap: 16px;
  }
  
  .overview-actions {
    gap: 8px;
  }
  
  .overview-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .search-options {
    gap: 12px;
  }
}</style>

<style lang="scss" scoped>
.character-display {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e5e5;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .info-value {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
}

.tag {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 6px;
  margin-bottom: 4px;
}

.text-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;

  &.dialogue {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #667eea;
    font-style: italic;
  }

  &.code {
    background: #f1f3f4;
    padding: 16px;
    border-radius: 8px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    border: 1px solid #e0e0e0;
  }
}

.alternate-greetings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alternate-greeting {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  .greeting-index {
    background: #667eea;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .greeting-text {
    flex: 1;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;
    border-left: 3px solid #667eea;
  }
}

.character-book {
  .book-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: #f0f4ff;
    border-radius: 8px;

    .stat {
      font-size: 14px;
      color: #555;
      font-weight: 500;
    }
  }

  .book-entries {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .book-entry {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;

    .entry-header {
      background: #f8f9fa;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;
      border-bottom: 1px solid #e0e0e0;

      .entry-keys {
        font-weight: 600;
      }
    }

    .entry-content {
      padding: 12px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }
}

.extensions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.extension-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;

  .extension-key {
    background: #f1f3f4;
    padding: 8px 12px;
    font-weight: 600;
    font-size: 14px;
    color: #333;
    border-bottom: 1px solid #e0e0e0;
  }

  .extension-value {
    padding: 12px;
    
    pre {
      font-size: 12px;
      color: #555;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}

.other-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.other-field {
  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .field-value {
    font-size: 14px;
    color: #333;
    
    pre {
      background: #f1f3f4;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-section {
    padding: 16px;
  }

  .section-title {
    font-size: 16px;
  }

  .alternate-greeting {
    flex-direction: column;
    gap: 8px;

    .greeting-index {
      align-self: flex-start;
    }
  }

  .book-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
