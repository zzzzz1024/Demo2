/**
 * SillyTavern 角色卡解析器 - 主应用
 * 独立的角色卡解析、编辑和导出工具
 */

class CharacterCardParser {
  constructor() {
    this.currentCard = null;
    this.currentCardId = null;
    this.parseHistory = this.loadHistory();
    this.activeTab = 'basic';

    this.initializeEventListeners();
    this.renderHistory();

    console.log('角色卡解析器已初始化');
  }

  /**
   * 初始化事件监听器
   */
  initializeEventListeners() {
    // 文件上传
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    fileInput.addEventListener('change', e => this.handleFileSelect(e));

    // 拖拽上传
    uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      this.processFiles(files);
    });

    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });
  }

  /**
   * 处理文件选择
   */
  handleFileSelect(event) {
    const files = event.target.files;
    this.processFiles(files);
  }

  /**
   * 处理多个文件
   */
  async processFiles(files) {
    if (!files || files.length === 0) return;

    this.showLoading(true);

    for (const file of files) {
      try {
        await this.parseFile(file);
      } catch (error) {
        this.showError(`解析文件 ${file.name} 失败: ${error.message}`);
      }
    }

    this.showLoading(false);
  }

  /**
   * 解析单个文件
   */
  async parseFile(file) {
    try {
      console.log(`开始解析文件: ${file.name}`);

      const extension = file.name.toLowerCase().split('.').pop();
      let cardData = null;

      switch (extension) {
        case 'json':
          cardData = await this.parseJSONFile(file);
          break;
        case 'png':
          cardData = await this.parsePNGFile(file);
          break;
        case 'webp':
          cardData = await this.parseWebPFile(file);
          break;
        case 'jpg':
        case 'jpeg':
          cardData = await this.parseJPEGFile(file);
          break;
        default:
          throw new Error(`不支持的文件格式: ${extension}`);
      }

      if (!cardData) {
        throw new Error('无法从文件中提取角色卡数据');
      }

      // 添加到历史记录
      const historyItem = {
        id: this.generateId(),
        name: cardData.name || file.name,
        fileName: file.name,
        parseTime: new Date().toLocaleString(),
        data: cardData,
        originalData: JSON.parse(JSON.stringify(cardData)), // 深拷贝原始数据
      };

      this.parseHistory.unshift(historyItem);
      this.saveHistory();
      this.renderHistory();

      // 显示解析结果
      this.displayCard(historyItem);
      this.showSuccess(`成功解析角色卡: ${historyItem.name}`);
    } catch (error) {
      console.error('文件解析错误:', error);
      throw error;
    }
  }

  /**
   * 解析JSON文件
   */
  async parseJSONFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          // 处理可能的嵌套结构
          const cardData = data.data || data;
          resolve(cardData);
        } catch (error) {
          reject(new Error('JSON文件格式错误'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 解析PNG文件 - 使用SillyTavern官方算法
   */
  async parsePNGFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const arrayBuffer = e.target.result;
          const data = new Uint8Array(arrayBuffer);
          const cardData = this.extractDataFromPng(data, 'chara');

          if (!cardData) {
            reject(new Error('PNG文件中未找到角色卡数据'));
            return;
          }

          resolve(cardData);
        } catch (error) {
          reject(new Error(`PNG解析失败: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 从PNG数据中提取角色卡信息 - SillyTavern官方算法
   */
  extractDataFromPng(data, identifier = 'chara') {
    const uint8 = new Uint8Array(4);
    const uint32 = new Uint32Array(uint8.buffer);

    // 检查PNG文件头
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
      throw new Error('无效的PNG文件');
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
      const chunkType = new Uint8Array(4);
      chunkType[0] = data[idx++];
      chunkType[1] = data[idx++];
      chunkType[2] = data[idx++];
      chunkType[3] = data[idx++];

      const name = String.fromCharCode(...chunkType);

      if (name === 'IEND') break;

      // 读取chunk数据
      const chunkData = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        chunkData[i] = data[idx++];
      }
      idx += 4; // 跳过CRC

      // 处理tEXt chunk
      if (name === 'tEXt') {
        let nullIndex = -1;
        for (let i = 0; i < chunkData.length; i++) {
          if (chunkData[i] === 0) {
            nullIndex = i;
            break;
          }
        }

        if (nullIndex !== -1) {
          const keyword = new TextDecoder('utf8').decode(chunkData.slice(0, nullIndex));
          const textData = chunkData.slice(nullIndex + 1);

          if (keyword === identifier || keyword.toLowerCase().includes('chara')) {
            try {
              // 尝试UTF-8解码
              const textString = new TextDecoder('utf8').decode(textData);

              // 尝试Base64解码
              let decodedData;
              try {
                decodedData = atob(textString);
              } catch (e) {
                decodedData = textString;
              }

              const parsed = JSON.parse(decodedData);
              return parsed;
            } catch (e) {
              console.warn('JSON解析失败:', e);
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * 解析WebP文件
   */
  async parseWebPFile(file) {
    // 简化的WebP解析实现
    throw new Error('WebP格式解析功能正在开发中');
  }

  /**
   * 解析JPEG文件
   */
  async parseJPEGFile(file) {
    // 简化的JPEG解析实现
    throw new Error('JPEG格式解析功能正在开发中');
  }

  /**
   * 显示角色卡数据
   */
  displayCard(historyItem) {
    this.currentCard = historyItem.data;
    this.currentCardId = historyItem.id;

    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('dataPanel').style.display = 'flex';

    // 更新历史列表选中状态
    document.querySelectorAll('.history-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-id="${historyItem.id}"]`)?.classList.add('active');

    this.renderTabContent();
  }

  /**
   * 切换标签页
   */
  switchTab(tabName) {
    this.activeTab = tabName;

    // 更新标签页状态
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    this.renderTabContent();
  }

  /**
   * 渲染标签页内容
   */
  renderTabContent() {
    if (!this.currentCard) return;

    const content = document.getElementById('tabContent');

    switch (this.activeTab) {
      case 'basic':
        content.innerHTML = this.renderBasicInfo();
        break;
      case 'advanced':
        content.innerHTML = this.renderAdvancedSettings();
        break;
      case 'worldbook':
        content.innerHTML = this.renderWorldbook();
        break;
      case 'regex':
        content.innerHTML = this.renderRegexPatterns();
        break;
      case 'raw':
        content.innerHTML = this.renderRawData();
        break;
    }
  }

  /**
   * 渲染基本信息
   */
  renderBasicInfo() {
    const card = this.currentCard;
    return `
            <div class="data-section">
                <div class="data-title">👤 角色基本信息</div>
                
                <div class="data-item">
                    <div class="data-label">角色名称</div>
                    <input type="text" class="editable-field" 
                           value="${this.escapeHtml(card.name || '')}" 
                           onchange="parser.updateField('name', this.value)">
                </div>
                
                <div class="data-item">
                    <div class="data-label">角色描述</div>
                    <textarea class="editable-field" rows="6" 
                              onchange="parser.updateField('description', this.value)">${this.escapeHtml(card.description || '')}</textarea>
                </div>
                
                <div class="data-item">
                    <div class="data-label">性格特征</div>
                    <textarea class="editable-field" rows="4" 
                              onchange="parser.updateField('personality', this.value)">${this.escapeHtml(card.personality || '')}</textarea>
                </div>
                
                <div class="data-item">
                    <div class="data-label">场景设定</div>
                    <textarea class="editable-field" rows="4" 
                              onchange="parser.updateField('scenario', this.value)">${this.escapeHtml(card.scenario || '')}</textarea>
                </div>
                
                <div class="data-item">
                    <div class="data-label">开场白</div>
                    <textarea class="editable-field" rows="3" 
                              onchange="parser.updateField('first_mes', this.value)">${this.escapeHtml(card.first_mes || '')}</textarea>
                </div>
                
                <div class="data-item">
                    <div class="data-label">对话示例</div>
                    <textarea class="editable-field" rows="6" 
                              onchange="parser.updateField('mes_example', this.value)">${this.escapeHtml(card.mes_example || '')}</textarea>
                </div>
            </div>

            <div class="data-section">
                <div class="data-title">🏷️ 元数据</div>
                
                <div class="data-item">
                    <div class="data-label">创建者</div>
                    <input type="text" class="editable-field" 
                           value="${this.escapeHtml(card.creator || '')}" 
                           onchange="parser.updateField('creator', this.value)">
                </div>
                
                <div class="data-item">
                    <div class="data-label">版本</div>
                    <input type="text" class="editable-field" 
                           value="${this.escapeHtml(card.character_version || '')}" 
                           onchange="parser.updateField('character_version', this.value)">
                </div>
                
                <div class="data-item">
                    <div class="data-label">标签</div>
                    <input type="text" class="editable-field" 
                           value="${Array.isArray(card.tags) ? card.tags.join(', ') : card.tags || ''}" 
                           onchange="parser.updateField('tags', this.value.split(',').map(t => t.trim()).filter(t => t))"
                           placeholder="使用逗号分隔多个标签">
                </div>
            </div>
        `;
  }

  /**
   * 渲染高级设置
   */
  renderAdvancedSettings() {
    const card = this.currentCard;
    const extensions = card.extensions || {};

    return `
            <div class="data-section">
                <div class="data-title">⚙️ 高级设置</div>
                
                <div class="data-item">
                    <div class="data-label">扩展数据</div>
                    <div class="data-value">
                        已加载 ${Object.keys(extensions).length} 个扩展：
                        ${Object.keys(extensions)
                          .map(
                            ext =>
                              `<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; margin: 2px; display: inline-block;">${ext}</span>`,
                          )
                          .join('')}
                    </div>
                </div>
                
                <div class="data-item">
                    <div class="data-label">备用问候语</div>
                    <textarea class="editable-field" rows="4" 
                              onchange="parser.updateField('alternate_greetings', this.value.split('\\n').filter(g => g.trim()))">${Array.isArray(card.alternate_greetings) ? card.alternate_greetings.join('\n') : ''}</textarea>
                    <small style="color: #666;">每行一个备用问候语</small>
                </div>
                
                <div class="data-item">
                    <div class="data-label">系统提示词</div>
                    <textarea class="editable-field" rows="4" 
                              onchange="parser.updateField('system_prompt', this.value)">${this.escapeHtml(card.system_prompt || '')}</textarea>
                </div>
                
                <div class="data-item">
                    <div class="data-label">后置历史指令</div>
                    <textarea class="editable-field" rows="3" 
                              onchange="parser.updateField('post_history_instructions', this.value)">${this.escapeHtml(card.post_history_instructions || '')}</textarea>
                </div>
            </div>
        `;
  }

  /**
   * 渲染世界书
   */
  renderWorldbook() {
    const card = this.currentCard;
    const worldbook = card.character_book || card.characterBook || null;

    if (!worldbook || !worldbook.entries || worldbook.entries.length === 0) {
      return `
                <div class="data-section">
                    <div class="data-title">📚 世界书</div>
                    <div style="text-align: center; padding: 40px; color: #999;">
                        该角色卡没有世界书数据
                    </div>
                </div>
            `;
    }

    return `
            <div class="data-section">
                <div class="data-title">📚 世界书 (${worldbook.entries.length} 个条目)</div>
                
                <div class="data-item">
                    <div class="data-label">世界书名称</div>
                    <input type="text" class="editable-field" 
                           value="${this.escapeHtml(worldbook.name || '')}" 
                           onchange="parser.updateWorldbookField('name', this.value)">
                </div>
                
                <div class="data-item">
                    <div class="data-label">世界书描述</div>
                    <textarea class="editable-field" rows="3" 
                              onchange="parser.updateWorldbookField('description', this.value)">${this.escapeHtml(worldbook.description || '')}</textarea>
                </div>
                
                ${worldbook.entries
                  .map(
                    (entry, index) => `
                    <div class="data-item" style="border-left-color: #ff6b6b;">
                        <div class="data-label">条目 ${index + 1}</div>
                        <div style="margin-bottom: 10px;">
                            <strong>关键词:</strong> 
                            <input type="text" class="editable-field" style="margin-top: 5px;"
                                   value="${Array.isArray(entry.keys) ? entry.keys.join(', ') : entry.keys || ''}"
                                   onchange="parser.updateWorldbookEntry(${index}, 'keys', this.value.split(',').map(k => k.trim()).filter(k => k))">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>内容:</strong>
                            <textarea class="editable-field" rows="4" style="margin-top: 5px;"
                                      onchange="parser.updateWorldbookEntry(${index}, 'content', this.value)">${this.escapeHtml(entry.content || '')}</textarea>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                            <div>
                                <strong>启用:</strong>
                                <input type="checkbox" ${entry.enabled ? 'checked' : ''} 
                                       onchange="parser.updateWorldbookEntry(${index}, 'enabled', this.checked)">
                            </div>
                            <div>
                                <strong>优先级:</strong>
                                <input type="number" class="editable-field" style="width: 80px;"
                                       value="${entry.priority || 0}"
                                       onchange="parser.updateWorldbookEntry(${index}, 'priority', parseInt(this.value))">
                            </div>
                        </div>
                    </div>
                `,
                  )
                  .join('')}
            </div>
        `;
  }

  /**
   * 渲染正则表达式
   */
  renderRegexPatterns() {
    const card = this.currentCard;
    const extensions = card.extensions || {};
    const regexExtension = extensions.regex_scripts || extensions.regex || null;

    if (!regexExtension) {
      return `
                <div class="data-section">
                    <div class="data-title">🔤 正则表达式</div>
                    <div style="text-align: center; padding: 40px; color: #999;">
                        该角色卡没有正则表达式配置
                    </div>
                </div>
            `;
    }

    return `
            <div class="data-section">
                <div class="data-title">🔤 正则表达式配置</div>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap;">${JSON.stringify(regexExtension, null, 2)}</pre>
            </div>
        `;
  }

  /**
   * 渲染原始数据
   */
  renderRawData() {
    return `
            <div class="data-section">
                <div class="data-title">🔧 原始JSON数据</div>
                <textarea class="editable-field" rows="25" style="font-family: 'Courier New', monospace; font-size: 12px;"
                          onchange="parser.updateRawData(this.value)">${JSON.stringify(this.currentCard, null, 2)}</textarea>
            </div>
        `;
  }

  /**
   * 更新字段值
   */
  updateField(field, value) {
    if (this.currentCard) {
      this.currentCard[field] = value;
      this.markAsModified();
    }
  }

  /**
   * 更新世界书字段
   */
  updateWorldbookField(field, value) {
    if (this.currentCard && this.currentCard.character_book) {
      this.currentCard.character_book[field] = value;
      this.markAsModified();
    }
  }

  /**
   * 更新世界书条目
   */
  updateWorldbookEntry(index, field, value) {
    if (this.currentCard && this.currentCard.character_book && this.currentCard.character_book.entries) {
      this.currentCard.character_book.entries[index][field] = value;
      this.markAsModified();
    }
  }

  /**
   * 更新原始数据
   */
  updateRawData(jsonString) {
    try {
      const newData = JSON.parse(jsonString);
      this.currentCard = newData;
      this.markAsModified();
      this.showSuccess('原始数据更新成功');
    } catch (error) {
      this.showError('JSON格式错误: ' + error.message);
    }
  }

  /**
   * 标记为已修改
   */
  markAsModified() {
    // 更新历史记录中的数据
    const historyItem = this.parseHistory.find(item => item.id === this.currentCardId);
    if (historyItem) {
      historyItem.data = JSON.parse(JSON.stringify(this.currentCard));
    }
  }

  /**
   * 保存修改
   */
  saveChanges() {
    this.saveHistory();
    this.showSuccess('修改已保存');
  }

  /**
   * 导出角色卡
   */
  exportCard() {
    if (!this.currentCard) return;

    const dataStr = JSON.stringify(this.currentCard, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${this.currentCard.name || 'character'}.json`;
    link.click();

    this.showSuccess('角色卡已导出');
  }

  /**
   * 复制角色卡
   */
  duplicateCard() {
    if (!this.currentCard) return;

    const duplicatedCard = JSON.parse(JSON.stringify(this.currentCard));
    duplicatedCard.name = (duplicatedCard.name || 'Character') + ' - 副本';

    const historyItem = {
      id: this.generateId(),
      name: duplicatedCard.name,
      fileName: '复制创建',
      parseTime: new Date().toLocaleString(),
      data: duplicatedCard,
      originalData: JSON.parse(JSON.stringify(duplicatedCard)),
    };

    this.parseHistory.unshift(historyItem);
    this.saveHistory();
    this.renderHistory();
    this.displayCard(historyItem);

    this.showSuccess('角色卡已复制');
  }

  /**
   * 渲染历史列表
   */
  renderHistory() {
    const historyList = document.getElementById('historyList');

    if (this.parseHistory.length === 0) {
      historyList.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #999;">
                    暂无解析历史
                </div>
            `;
      return;
    }

    historyList.innerHTML = this.parseHistory
      .map(
        item => `
            <div class="history-item" data-id="${item.id}" onclick="parser.selectHistoryItem('${item.id}')">
                <div class="history-info">
                    <div class="history-name">${this.escapeHtml(item.name)}</div>
                    <div class="history-time">${item.parseTime} • ${item.fileName}</div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-small" onclick="event.stopPropagation(); parser.deleteHistoryItem('${item.id}')" title="删除">🗑️</button>
                </div>
            </div>
        `,
      )
      .join('');
  }

  /**
   * 选择历史项目
   */
  selectHistoryItem(id) {
    const item = this.parseHistory.find(item => item.id === id);
    if (item) {
      this.displayCard(item);
    }
  }

  /**
   * 删除历史项目
   */
  deleteHistoryItem(id) {
    if (confirm('确定要删除这个解析记录吗？')) {
      this.parseHistory = this.parseHistory.filter(item => item.id !== id);
      this.saveHistory();
      this.renderHistory();

      // 如果删除的是当前显示的卡片，清空显示
      if (this.currentCardId === id) {
        this.currentCard = null;
        this.currentCardId = null;
        document.getElementById('dataPanel').style.display = 'none';
        document.getElementById('welcomeMessage').style.display = 'block';
      }

      this.showSuccess('解析记录已删除');
    }
  }

  /**
   * 清空历史
   */
  clearHistory() {
    if (confirm('确定要清空所有解析历史吗？')) {
      this.parseHistory = [];
      this.saveHistory();
      this.renderHistory();

      this.currentCard = null;
      this.currentCardId = null;
      document.getElementById('dataPanel').style.display = 'none';
      document.getElementById('welcomeMessage').style.display = 'block';

      this.showSuccess('解析历史已清空');
    }
  }

  /**
   * 加载历史记录
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem('characterCardParseHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('加载历史记录失败:', error);
      return [];
    }
  }

  /**
   * 保存历史记录
   */
  saveHistory() {
    try {
      localStorage.setItem('characterCardParseHistory', JSON.stringify(this.parseHistory));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }

  /**
   * 显示加载状态
   */
  showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
  }

  /**
   * 显示错误消息
   */
  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  /**
   * 显示成功消息
   */
  showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
      successElement.style.display = 'none';
    }, 3000);
  }

  /**
   * 转义HTML
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// 全局函数定义（供HTML调用）
let parser;

function switchTab(tabName) {
  parser.switchTab(tabName);
}

function saveChanges() {
  parser.saveChanges();
}

function exportCard() {
  parser.exportCard();
}

function duplicateCard() {
  parser.duplicateCard();
}

function clearHistory() {
  parser.clearHistory();
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  parser = new CharacterCardParser();
});

console.log('角色卡解析器脚本已加载');
