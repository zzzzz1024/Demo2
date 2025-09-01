<template>
  <div class="parse-history">
    <div class="history-header">
      <h1 class="title">解析历史</h1>
      <div class="header-actions">
        <button @click="clearHistory" class="clear-btn" v-if="history.length > 0">
          🗑️ 清空历史
        </button>
        <button @click="exportHistory" class="export-btn" v-if="history.length > 0">
          📤 导出历史
        </button>
      </div>
    </div>

    <div v-if="history.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>暂无解析历史</h3>
      <p>解析角色卡后，历史记录将显示在这里</p>
      <button @click="$router.push('/parser')" class="goto-parser-btn">
        开始解析角色卡
      </button>
    </div>

    <div v-else class="history-list">
      <div class="history-stats">
        <div class="stat-item">
          <span class="stat-label">总解析次数</span>
          <span class="stat-value">{{ history.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">成功解析</span>
          <span class="stat-value success">{{ successCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">解析失败</span>
          <span class="stat-value error">{{ failureCount }}</span>
        </div>
      </div>

      <div class="filter-bar">
        <select v-model="filterStatus" class="filter-select">
          <option value="all">全部状态</option>
          <option value="success">仅成功</option>
          <option value="error">仅失败</option>
        </select>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索角色名或文件名..."
          class="search-input"
        />
      </div>

      <div class="history-items">
        <div 
          v-for="item in filteredHistory" 
          :key="item.timestamp"
          class="history-item"
          :class="{ success: item.success, error: !item.success }"
        >
          <div class="item-header">
            <div class="item-info">
              <span class="status-icon">{{ item.success ? '✅' : '❌' }}</span>
              <div class="item-details">
                <h3 class="character-name">
                  {{ item.success ? item.data?.name || '未命名角色' : '解析失败' }}
                </h3>
                <div class="item-meta">
                  <span class="filename">{{ item.filename }}</span>
                  <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
                </div>
              </div>
            </div>
            <div class="item-actions">
              <button 
                v-if="item.success" 
                @click="toggleExpanded(item.timestamp)"
                class="expand-btn"
              >
                {{ expandedItems.has(item.timestamp) ? '收起' : '展开' }}
              </button>
              <button @click="deleteItem(item.timestamp)" class="delete-btn">
                删除
              </button>
            </div>
          </div>

          <div v-if="!item.success" class="error-info">
            <p class="error-message">{{ item.error }}</p>
          </div>

          <div 
            v-if="item.success && expandedItems.has(item.timestamp)" 
            class="item-content"
          >
            <CharacterDisplay :character="item.data!" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ParseResult } from './png解析器';
import CharacterDisplay from './角色卡展示.vue';

const history = ref<ParseResult[]>([]);
const expandedItems = ref<Set<number>>(new Set());
const filterStatus = ref<'all' | 'success' | 'error'>('all');
const searchQuery = ref('');

// 统计信息
const successCount = computed(() => history.value.filter(item => item.success).length);
const failureCount = computed(() => history.value.filter(item => !item.success).length);

// 过滤后的历史记录
const filteredHistory = computed(() => {
  let filtered = history.value;

  // 状态过滤
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(item => 
      filterStatus.value === 'success' ? item.success : !item.success
    );
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item => {
      const filename = item.filename?.toLowerCase() || '';
      const characterName = item.success ? (item.data?.name?.toLowerCase() || '') : '';
      return filename.includes(query) || characterName.includes(query);
    });
  }

  return filtered;
});

// 加载历史记录
function loadHistory() {
  try {
    const savedHistory = getVariables({ type: 'script', script_id: getScriptId() })?.parseHistory || [];
    history.value = savedHistory;
  } catch (error) {
    console.error('加载历史记录失败:', error);
    toastr.error('加载历史记录失败', '错误');
  }
}

// 保存历史记录
function saveHistory() {
  try {
    replaceVariables({ parseHistory: history.value }, { type: 'script', script_id: getScriptId() });
  } catch (error) {
    console.error('保存历史记录失败:', error);
    toastr.error('保存历史记录失败', '错误');
  }
}

// 清空历史
function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？此操作无法撤销。')) {
    history.value = [];
    expandedItems.value.clear();
    saveHistory();
    toastr.success('历史记录已清空', '成功');
  }
}

// 导出历史
function exportHistory() {
  try {
    const dataStr = JSON.stringify(history.value, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_parse_history_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toastr.success('历史记录已导出', '成功');
  } catch (error) {
    console.error('导出失败:', error);
    toastr.error('导出失败', '错误');
  }
}

// 删除单个项目
function deleteItem(timestamp: number) {
  if (confirm('确定要删除这条记录吗？')) {
    history.value = history.value.filter(item => item.timestamp !== timestamp);
    expandedItems.value.delete(timestamp);
    saveHistory();
    toastr.success('记录已删除', '成功');
  }
}

// 切换展开状态
function toggleExpanded(timestamp: number) {
  if (expandedItems.value.has(timestamp)) {
    expandedItems.value.delete(timestamp);
  } else {
    expandedItems.value.add(timestamp);
  }
}

// 格式化时间
function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

onMounted(() => {
  loadHistory();
});
</script>

<style lang="scss" scoped>
.parse-history {
  max-width: 1200px;
  margin: 0 auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;

  .title {
    color: #333;
    font-size: 28px;
    font-weight: 600;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .clear-btn, .export-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }

  .clear-btn {
    background: #dc3545;
    color: white;

    &:hover {
      background: #c82333;
    }
  }

  .export-btn {
    background: #28a745;
    color: white;

    &:hover {
      background: #218838;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  h3 {
    font-size: 24px;
    margin-bottom: 12px;
    color: #333;
  }

  p {
    font-size: 16px;
    margin-bottom: 30px;
  }

  .goto-parser-btn {
    padding: 12px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #5a67d8;
      transform: translateY(-2px);
    }
  }
}

.history-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: center;

  .stat-item {
    background: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    min-width: 120px;

    .stat-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #333;

      &.success {
        color: #28a745;
      }

      &.error {
        color: #dc3545;
      }
    }
  }
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;

  .filter-select, .search-input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease;

    &:focus {
      border-color: #667eea;
    }
  }

  .filter-select {
    min-width: 120px;
  }

  .search-input {
    flex: 1;
    max-width: 300px;
  }
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e5e5;
  overflow: hidden;

  &.success {
    border-left: 4px solid #28a745;
  }

  &.error {
    border-left: 4px solid #dc3545;
  }
}

.item-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .status-icon {
    font-size: 20px;
  }

  .character-name {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 4px 0;
  }

  .item-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #666;

    .filename {
      font-weight: 500;
    }
  }
}

.item-actions {
  display: flex;
  gap: 8px;

  button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f0f0f0;
    }
  }

  .expand-btn {
    color: #667eea;
    border-color: #667eea;

    &:hover {
      background: #f0f4ff;
    }
  }

  .delete-btn {
    color: #dc3545;
    border-color: #dc3545;

    &:hover {
      background: #fff5f5;
    }
  }
}

.error-info {
  padding: 16px 20px;

  .error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 12px;
    border-radius: 6px;
    font-size: 14px;
    margin: 0;
  }
}

.item-content {
  padding: 20px;
}

@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .header-actions {
      justify-content: center;
    }
  }

  .history-stats {
    flex-direction: column;
    gap: 12px;
  }

  .filter-bar {
    flex-direction: column;
    gap: 8px;

    .search-input {
      max-width: none;
    }
  }

  .item-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .item-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .status-icon {
      align-self: flex-start;
    }
  }

  .item-actions {
    justify-content: center;
  }
}
</style>
