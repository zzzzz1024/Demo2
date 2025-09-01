<template>
  <div class="character-editor">
    <div class="editor-header">
      <h2 class="editor-title">✏️ 编辑角色卡数据</h2>
      <div class="editor-actions">
        <button @click="resetChanges" class="reset-btn" :disabled="!hasChanges">
          🔄 重置更改
        </button>
        <button @click="saveChanges" class="save-btn" :disabled="!hasChanges">
          💾 保存更改
        </button>
        <button @click="$emit('close')" class="close-btn">
          ❌ 关闭编辑器
        </button>
      </div>
    </div>

    <div class="editor-content">
      <!-- 基础信息编辑 -->
      <div class="edit-section">
        <h3 class="section-title">📝 基础信息</h3>
        <div class="edit-grid">
          <div class="edit-item">
            <label>姓名</label>
            <input v-model="editData.name" type="text" placeholder="角色姓名" />
          </div>
          <div class="edit-item">
            <label>创作者</label>
            <input v-model="editData.creator" type="text" placeholder="创作者名称" />
          </div>
          <div class="edit-item">
            <label>版本</label>
            <input v-model="editData.character_version" type="text" placeholder="版本号" />
          </div>
          <div class="edit-item">
            <label>标签 (用逗号分隔)</label>
            <input v-model="tagsString" type="text" placeholder="标签1, 标签2, 标签3" />
          </div>
        </div>
      </div>

      <!-- 角色描述编辑 -->
      <div class="edit-section">
        <h3 class="section-title">👤 角色描述</h3>
        <textarea 
          v-model="editData.description" 
          placeholder="请输入角色的详细描述..."
          rows="4"
        ></textarea>
      </div>

      <!-- 性格特征编辑 -->
      <div class="edit-section">
        <h3 class="section-title">🎭 性格特征</h3>
        <textarea 
          v-model="editData.personality" 
          placeholder="请输入角色的性格特征..."
          rows="3"
        ></textarea>
      </div>

      <!-- 场景设定编辑 -->
      <div class="edit-section">
        <h3 class="section-title">🌍 场景设定</h3>
        <textarea 
          v-model="editData.scenario" 
          placeholder="请输入场景背景设定..."
          rows="3"
        ></textarea>
      </div>

      <!-- 开场白编辑 -->
      <div class="edit-section">
        <h3 class="section-title">💬 开场白</h3>
        <textarea 
          v-model="editData.first_mes" 
          placeholder="请输入角色的开场白..."
          rows="4"
        ></textarea>
      </div>

      <!-- 对话示例编辑 -->
      <div class="edit-section">
        <h3 class="section-title">📖 对话示例</h3>
        <textarea 
          v-model="editData.mes_example" 
          placeholder="请输入对话示例..."
          rows="5"
        ></textarea>
      </div>

      <!-- 备用问候语编辑 -->
      <div class="edit-section">
        <h3 class="section-title">🔄 备用问候语</h3>
        <div class="alternate-greetings-editor">
          <div 
            v-for="(greeting, index) in editData.alternate_greetings" 
            :key="index" 
            class="greeting-item"
          >
            <div class="greeting-header">
              <span class="greeting-number">{{ index + 1 }}</span>
              <button @click="removeGreeting(index)" class="remove-btn">🗑️</button>
            </div>
            <textarea 
              v-model="editData.alternate_greetings[index]" 
              placeholder="请输入备用问候语..."
              rows="2"
            ></textarea>
          </div>
          <button @click="addGreeting" class="add-greeting-btn">
            ➕ 添加备用问候语
          </button>
        </div>
      </div>

      <!-- 系统提示编辑 -->
      <div class="edit-section">
        <h3 class="section-title">⚙️ 系统提示</h3>
        <textarea 
          v-model="editData.system_prompt" 
          placeholder="请输入系统提示..."
          rows="3"
        ></textarea>
      </div>

      <!-- 历史后指令编辑 -->
      <div class="edit-section">
        <h3 class="section-title">📜 历史后指令</h3>
        <textarea 
          v-model="editData.post_history_instructions" 
          placeholder="请输入历史后指令..."
          rows="3"
        ></textarea>
      </div>

      <!-- 创作者注释编辑 -->
      <div class="edit-section">
        <h3 class="section-title">📝 创作者注释</h3>
        <textarea 
          v-model="editData.creator_notes" 
          placeholder="请输入创作者注释..."
          rows="3"
        ></textarea>
      </div>

      <!-- JSON原始数据编辑 -->
      <div class="edit-section">
        <h3 class="section-title">🔧 高级编辑 (JSON)</h3>
        <div class="json-editor">
          <textarea 
            v-model="jsonString" 
            class="json-textarea"
            placeholder="JSON格式的原始数据..."
            rows="10"
            @input="onJsonChange"
          ></textarea>
          <div v-if="jsonError" class="json-error">
            ❌ JSON格式错误: {{ jsonError }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { CharacterData } from './png解析器';

const props = defineProps<{
  character: CharacterData;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: CharacterData];
}>();

// 编辑数据的响应式副本
const editData = ref<CharacterData>({ ...props.character });
const originalData = ref<CharacterData>({ ...props.character });

// 标签字符串处理
const tagsString = computed({
  get: () => editData.value.tags?.join(', ') || '',
  set: (value: string) => {
    editData.value.tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
});

// JSON编辑器
const jsonString = ref('');
const jsonError = ref('');

// 检查是否有更改
const hasChanges = computed(() => {
  return JSON.stringify(editData.value) !== JSON.stringify(originalData.value);
});

// 初始化JSON字符串
onMounted(() => {
  updateJsonString();
});

// 监听编辑数据变化，更新JSON字符串
watch(editData, () => {
  updateJsonString();
}, { deep: true });

function updateJsonString() {
  try {
    jsonString.value = JSON.stringify(editData.value, null, 2);
    jsonError.value = '';
  } catch (error) {
    jsonError.value = (error as Error).message;
  }
}

function onJsonChange() {
  try {
    const parsed = JSON.parse(jsonString.value);
    editData.value = { ...parsed };
    jsonError.value = '';
  } catch (error) {
    jsonError.value = (error as Error).message;
  }
}

function addGreeting() {
  if (!editData.value.alternate_greetings) {
    editData.value.alternate_greetings = [];
  }
  editData.value.alternate_greetings.push('');
}

function removeGreeting(index: number) {
  if (editData.value.alternate_greetings) {
    editData.value.alternate_greetings.splice(index, 1);
  }
}

function resetChanges() {
  editData.value = { ...originalData.value };
  toastr.info('已重置所有更改', '提示');
}

function saveChanges() {
  try {
    // 验证必要字段
    if (!editData.value.name?.trim()) {
      toastr.error('角色姓名不能为空', '保存失败');
      return;
    }

    emit('save', { ...editData.value });
    originalData.value = { ...editData.value };
    toastr.success('角色卡数据已保存', '保存成功');
  } catch (error) {
    toastr.error('保存失败: ' + (error as Error).message, '错误');
  }
}
</script>

<style lang="scss" scoped>
.character-editor {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.editor-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.editor-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.editor-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.save-btn {
  background: #28a745;
  color: white;

  &:hover:not(:disabled) {
    background: #218838;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.close-btn {
  background: #dc3545;
  color: white;

  &:hover {
    background: #c82333;
    transform: translateY(-2px);
  }
}

.editor-content {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.edit-section {
  margin-bottom: 32px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 20px;
  background: #fafafa;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.edit-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-item label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.edit-item input,
.edit-section textarea {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  transition: border-color 0.3s ease;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #999;
  }
}

.alternate-greetings-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.greeting-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  background: white;
}

.greeting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.greeting-number {
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
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: #c82333;
  }
}

.add-greeting-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  align-self: flex-start;

  &:hover {
    background: #218838;
    transform: translateY(-2px);
  }
}

.json-editor {
  position: relative;
}

.json-textarea {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  width: 100%;
  min-height: 200px;
}

.json-error {
  background: #f8d7da;
  color: #721c24;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
  font-size: 12px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .editor-actions {
    justify-content: center;
  }

  .edit-grid {
    grid-template-columns: 1fr;
  }

  .editor-content {
    padding: 16px;
  }

  .edit-section {
    padding: 16px;
  }
}
</style>
