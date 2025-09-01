<template>
  <div class="character-parser">
    <h1 class="title">角色卡解析器</h1>
    
    <!-- 文件上传区域 -->
    <div class="upload-area">
      <div 
        class="drop-zone"
        :class="{ 'drag-over': isDragOver, 'parsing': isParsing }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="$refs.fileInput.click()"
      >
        <div v-if="!isParsing" class="drop-content">
          <div class="upload-icon">📁</div>
          <p class="upload-text">点击或拖拽PNG角色卡文件到此处</p>
          <p class="upload-hint">支持 .png 格式的角色卡文件</p>
        </div>
        <div v-else class="parsing-content">
          <div class="loading-spinner"></div>
          <p>正在解析角色卡...</p>
        </div>
      </div>
      <input 
        ref="fileInput"
        type="file" 
        accept=".png" 
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- 解析结果展示 -->
    <div v-if="parseResult" class="result-section">
      <div v-if="parseResult.success" class="success-result">
        <h2 class="result-title">✅ 解析成功</h2>
        <CharacterDisplay 
          :character="parseResult.data" 
          :originalFile="originalFile"
          @update="onCharacterUpdate"
        />
      </div>
      <div v-else class="error-result">
        <h2 class="result-title">❌ 解析失败</h2>
        <p class="error-message">{{ parseResult.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { parsePngFile, type ParseResult } from './png解析器';
import CharacterDisplay from './角色卡展示.vue';

const isDragOver = ref(false);
const isParsing = ref(false);
const parseResult = ref<ParseResult | null>(null);
const fileInput = ref<HTMLInputElement>();
const originalFile = ref<File | null>(null);

// 处理文件拖拽
async function handleDrop(event: DragEvent) {
  isDragOver.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    await parseFile(files[0]);
  }
}

// 处理文件选择
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    await parseFile(files[0]);
  }
}

// 解析文件
async function parseFile(file: File) {
  if (!file.type.includes('png')) {
    toastr.error('请选择PNG格式的文件', '文件格式错误');
    return;
  }

  isParsing.value = true;
  parseResult.value = null;
  originalFile.value = file; // 保存原始文件

  try {
    const result = await parsePngFile(file);
    parseResult.value = result;
    
    if (result.success) {
      toastr.success('角色卡解析成功!', '成功');
      // 保存到历史记录
      saveToHistory(result);
    } else {
      toastr.error(result.error || '解析失败', '错误');
    }
  } catch (error) {
    toastr.error('解析过程中发生错误', '错误');
    console.error('解析错误:', error);
  } finally {
    isParsing.value = false;
  }
}

// 保存到历史记录
function saveToHistory(result: ParseResult) {
  try {
    const history = getVariables({ type: 'script', script_id: getScriptId() })?.parseHistory || [];
    history.unshift(result);
    // 只保留最近50条记录
    if (history.length > 50) {
      history.splice(50);
    }
    replaceVariables({ parseHistory: history }, { type: 'script', script_id: getScriptId() });
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
}

// 处理角色卡数据更新
function onCharacterUpdate(updatedData: any) {
  if (parseResult.value && parseResult.value.success) {
    parseResult.value.data = updatedData;
    toastr.success('角色卡数据已更新', '成功');
  }
}
</script>

<style lang="scss" scoped>
.character-parser {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.upload-area {
  margin-bottom: 30px;
}

.drop-zone {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;

  &:hover {
    border-color: #667eea;
    background: #f0f4ff;
  }

  &.drag-over {
    border-color: #667eea;
    background: #e6f0ff;
    transform: scale(1.02);
  }

  &.parsing {
    border-color: #ffa500;
    background: #fff5e6;
    cursor: not-allowed;
  }
}

.drop-content {
  .upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .upload-text {
    font-size: 18px;
    color: #333;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .upload-hint {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
}

.parsing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    font-size: 16px;
    color: #666;
    margin: 0;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.result-section {
  margin-top: 30px;
}

.result-title {
  font-size: 20px;
  margin-bottom: 20px;
  font-weight: 600;
}

.success-result {
  .result-title {
    color: #28a745;
  }
}

.error-result {
  .result-title {
    color: #dc3545;
  }

  .error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #f5c6cb;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .drop-zone {
    padding: 40px 16px;
  }

  .title {
    font-size: 24px;
  }

  .drop-content {
    .upload-icon {
      font-size: 36px;
    }

    .upload-text {
      font-size: 16px;
    }
  }
}
</style>
