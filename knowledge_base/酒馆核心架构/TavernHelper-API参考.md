# 酒馆助手 (TavernHelper) API 参考

## 全局API概览

TavernHelper 提供了超过70个函数的完整API，涵盖以下主要功能域：

### 1. 变量管理 API

#### 基础变量操作
```javascript
// 获取变量
TavernHelper.variables.get(name, scope)
// 设置变量
TavernHelper.variables.set(name, value, scope)
// 删除变量
TavernHelper.variables.delete(name, scope)
// 检查变量是否存在
TavernHelper.variables.exists(name, scope)
```

#### 高级变量操作
```javascript
// 监听变量变化
TavernHelper.variables.watch(name, callback)
// 批量操作
TavernHelper.variables.batch({
  'var1': 'value1',
  'var2': 'value2'
}, scope)
// 获取所有变量
TavernHelper.variables.getAll(scope)
```

### 2. 事件系统 API

#### 事件监听
```javascript
// 注册事件监听器
TavernHelper.events.on(eventName, callback)
// 一次性监听
TavernHelper.events.once(eventName, callback)
// 移除监听器
TavernHelper.events.off(eventName, callback)
```

#### 事件发送
```javascript
// 发送事件
TavernHelper.events.emit(eventName, data)
// 异步事件
TavernHelper.events.emitAsync(eventName, data)
```

### 3. 聊天消息 API

#### 消息获取
```javascript
// 获取当前消息
TavernHelper.chat.getCurrentMessage()
// 获取历史消息
TavernHelper.chat.getHistory(count)
// 获取最后一条消息
TavernHelper.chat.getLastMessage()
```

#### 消息操作
```javascript
// 发送消息
TavernHelper.chat.sendMessage(content)
// 修改消息
TavernHelper.chat.editMessage(index, content)
// 删除消息
TavernHelper.chat.deleteMessage(index)
```

### 4. 用户界面 API

#### 组件管理
```javascript
// 注册Vue组件
TavernHelper.ui.registerComponent(name, component)
// 显示模态框
TavernHelper.ui.showModal(componentName, options)
// 隐藏模态框
TavernHelper.ui.hideModal()
```

#### 界面元素
```javascript
// 添加按钮
TavernHelper.ui.addButton(selector, text, callback)
// 显示通知
TavernHelper.ui.showNotification(message, type)
// 显示提示
TavernHelper.ui.showTooltip(element, text)
```

### 5. 世界书和正则 API

#### 世界书操作
```javascript
// 获取世界书条目
TavernHelper.worldbook.getEntry(id)
// 添加条目
TavernHelper.worldbook.addEntry(entry)
// 更新条目
TavernHelper.worldbook.updateEntry(id, changes)
// 删除条目
TavernHelper.worldbook.deleteEntry(id)
```

#### 正则表达式
```javascript
// 注册正则规则
TavernHelper.regex.register(pattern, replacement)
// 应用正则替换
TavernHelper.regex.apply(text)
// 获取所有规则
TavernHelper.regex.getAll()
```

### 6. 存储和配置 API

#### 本地存储
```javascript
// 存储数据
TavernHelper.storage.setItem(key, value)
// 读取数据
TavernHelper.storage.getItem(key)
// 删除数据
TavernHelper.storage.removeItem(key)
```

#### 配置管理
```javascript
// 获取配置
TavernHelper.config.get(path)
// 设置配置
TavernHelper.config.set(path, value)
// 重置配置
TavernHelper.config.reset()
```

## 常用事件类型

### 系统事件
- `system:ready` - 系统就绪
- `system:shutdown` - 系统关闭
- `extension:loaded` - 扩展加载完成

### 聊天事件
- `chat:messageSent` - 消息发送
- `chat:messageReceived` - 消息接收
- `chat:messageEdited` - 消息编辑

### 界面事件
- `ui:componentMounted` - 组件挂载
- `ui:componentUnmounted` - 组件卸载
- `ui:modalShown` - 模态框显示

### 变量事件
- `variable:changed` - 变量值改变
- `variable:created` - 变量创建
- `variable:deleted` - 变量删除

## 最佳实践

### 1. 错误处理
```javascript
try {
  const result = TavernHelper.variables.get('myVar', 'global');
} catch (error) {
  console.error('获取变量失败:', error);
  TavernHelper.ui.showNotification('操作失败', 'error');
}
```

### 2. 异步操作
```javascript
async function processMessage() {
  const message = await TavernHelper.chat.getCurrentMessage();
  const processed = await processContent(message.content);
  await TavernHelper.chat.sendMessage(processed);
}
```

### 3. 内存管理
```javascript
// 组件销毁时清理事件监听器
beforeDestroy() {
  TavernHelper.events.off('chat:messageSent', this.handleMessage);
}
```
