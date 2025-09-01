# MagVarUpdate - 变量管理系统文档

## 概述

MagVarUpdate是SillyTavern生态系统中的一个强大的变量管理框架，专门用于动态内容管理、角色状态跟踪和模板处理。

## 核心架构

### 变量系统

- **全局变量**: 跨对话持久化的系统级变量
- **局部变量**: 单次对话内有效的临时变量
- **角色变量**: 绑定到特定角色的状态变量
- **场景变量**: 与特定场景相关的环境变量

### 变量类型

- **字符串变量**: 文本内容存储
- **数值变量**: 数字和计算结果
- **布尔变量**: 开关状态
- **对象变量**: 复杂数据结构
- **数组变量**: 列表和集合

## 变量处理流水线

### 1. 变量预处理

```
输入文本 -> 变量识别 -> 类型验证 -> 作用域检查
```

### 2. 变量解析

```
模板语法解析 -> 表达式计算 -> 条件判断 -> 默认值处理
```

### 3. 变量替换

```
占位符替换 -> 格式化处理 -> 输出生成 -> 状态更新
```

### 4. 变量持久化

```
变量存储 -> 状态同步 -> 历史记录 -> 备份恢复
```

## 角色状态管理

### 状态跟踪

- **属性系统**: HP、MP、经验值等角色属性
- **状态效果**: 增益、减益、特殊状态
- **关系系统**: 角色间关系值和友好度
- **进度跟踪**: 任务进度、剧情节点

### 状态变更机制

- **事件触发**: 基于对话内容的自动状态更新
- **条件判断**: 复杂的状态变更逻辑
- **状态验证**: 防止无效状态和越界值
- **变更日志**: 完整的状态变更历史

## 高级功能

### 表达式引擎

- **数学运算**: 支持基本和高级数学运算
- **字符串操作**: 文本处理和格式化功能
- **逻辑运算**: 条件判断和布尔运算
- **函数调用**: 内置函数和自定义函数

### 模板系统

- **条件渲染**: 基于变量值的条件显示
- **循环处理**: 数组和对象的迭代渲染
- **嵌套模板**: 多层次模板结构
- **宏定义**: 可重用的模板片段

### 事件系统

- **变量监听**: 监听变量变化事件
- **自动触发**: 基于条件的自动操作
- **事件链**: 复杂的事件处理流程
- **异步处理**: 非阻塞的事件处理

## API 参考

### 核心变量操作

#### 获取变量

```javascript
// 获取全局变量
getGlobalVar(name)

// 获取角色变量
getCharVar(charId, name)

// 获取局部变量
getLocalVar(name)

// 批量获取变量
getBatchVars(varList)
```

#### 设置变量

```javascript
// 设置全局变量
setGlobalVar(name, value)

// 设置角色变量
setCharVar(charId, name, value)

// 设置局部变量
setLocalVar(name, value)

// 批量设置变量
setBatchVars(varObject)
```

#### 变量操作

```javascript
// 增加数值
incrementVar(name, amount)

// 减少数值
decrementVar(name, amount)

// 变量运算
calculateVar(expression)

// 变量重置
resetVar(name)
```

### 状态管理

#### 角色状态

```javascript
// 获取角色状态
getCharState(charId)

// 更新角色状态
updateCharState(charId, stateObject)

// 检查状态条件
checkStateCondition(charId, condition)

// 应用状态效果
applyStateEffect(charId, effect)
```

#### 关系管理

```javascript
// 获取关系值
getRelationship(char1, char2)

// 修改关系
modifyRelationship(char1, char2, change)

// 关系等级
getRelationshipLevel(char1, char2)
```

### 模板处理

#### 模板解析

```javascript
// 解析模板
parseTemplate(template, variables)

// 条件渲染
renderConditional(condition, trueTemplate, falseTemplate)

// 循环渲染
renderLoop(array, itemTemplate)

// 嵌套解析
parseNestedTemplate(template, context)
```

#### 表达式计算

```javascript
// 计算表达式
evaluateExpression(expression, context)

// 条件判断
evaluateCondition(condition, context)

// 函数调用
callFunction(functionName, args)
```

## 开发指南

### 变量命名规范

- **全局变量**: `global_*` 前缀
- **角色变量**: `char_*` 前缀
- **局部变量**: `local_*` 前缀
- **系统变量**: `sys_*` 前缀

### 最佳实践

1. **变量初始化**: 始终为变量设置默认值
2. **类型安全**: 确保变量类型的一致性
3. **作用域管理**: 合理使用不同作用域的变量
4. **性能优化**: 避免频繁的变量操作
5. **错误处理**: 实现完善的错误处理机制

### 调试技巧

- **变量监控**: 实时监控变量变化
- **日志记录**: 详细的操作日志
- **状态快照**: 关键节点的状态保存
- **错误追踪**: 完整的错误堆栈信息

## 示例用法

### 基本变量操作

```javascript
// 设置角色血量
setCharVar('主角', 'hp', 100);

// 减少血量
let currentHp = getCharVar('主角', 'hp');
setCharVar('主角', 'hp', currentHp - 10);

// 检查血量状态
if (getCharVar('主角', 'hp') <= 0) {
    setCharVar('主角', 'status', '死亡');
}
```

### 模板处理示例

```javascript
// 状态显示模板
let template = `
角色状态：
血量：{{char_hp}}/{{char_max_hp}}
魔力：{{char_mp}}/{{char_max_mp}}
{{#if char_poisoned}}
⚠️ 中毒状态
{{/if}}
`;

// 解析并显示
let result = parseTemplate(template, getCharState('主角'));
```

### 复杂状态管理

```javascript
// 战斗系统示例
function processBattleTurn(attacker, defender, damage) {
    // 计算伤害
    let finalDamage = calculateVar(`${damage} * (1 - ${getCharVar(defender, 'defense')} / 100)`);
    
    // 应用伤害
    decrementVar(`char_${defender}_hp`, finalDamage);
    
    // 检查死亡
    if (getCharVar(defender, 'hp') <= 0) {
        setCharVar(defender, 'status', '死亡');
        triggerEvent('character_death', {character: defender});
    }
    
    // 更新战斗日志
    let logEntry = parseTemplate('{{attacker}}对{{defender}}造成了{{damage}}点伤害', {
        attacker: attacker,
        defender: defender,
        damage: finalDamage
    });
    
    appendVar('battle_log', logEntry);
}
```

## 故障排除

### 常见问题

1. **变量未定义**: 检查变量名和作用域
2. **类型错误**: 确认变量类型匹配
3. **表达式错误**: 验证表达式语法
4. **模板解析失败**: 检查模板语法和变量引用
5. **状态不一致**: 验证状态更新逻辑

### 性能优化

- **减少变量查找**: 缓存频繁使用的变量
- **批量操作**: 使用批量API减少调用次数
- **延迟计算**: 只在需要时计算复杂表达式
- **内存管理**: 及时清理不需要的变量

### 调试工具

- **变量查看器**: 实时查看所有变量状态
- **表达式测试器**: 测试表达式计算结果
- **模板预览**: 预览模板渲染结果
- **事件监听器**: 监听变量变化事件

## 与SillyTavern集成

### 在预设中使用

```yaml
# 预设配置示例
variables:
  char_hp: 100
  char_mp: 50
  location: "新手村"

triggers:
  - condition: "{{char_hp}} <= 20"
    action: "设置紧急状态"
    
templates:
  status_display: |
    当前状态：
    生命值：{{char_hp}}
    魔法值：{{char_mp}}
    位置：{{location}}
```

### 在世界书中使用

```yaml
# 世界书条目示例
entries:
  - key: "商店"
    content: |
      {{#if global_money >= 100}}
      欢迎光临！您有{{global_money}}金币。
      {{else}}
      抱歉，您的金币不足。
      {{/if}}
```

### 在脚本中使用

```javascript
// 脚本集成示例
function onMessageReceived(message) {
    // 检查关键词并更新变量
    if (message.content.includes('购买')) {
        decrementVar('global_money', 10);
        incrementVar('char_items_count', 1);
    }
    
    // 更新对话计数
    incrementVar('conversation_count', 1);
    
    // 触发状态检查
    checkAndUpdateCharacterState();
}
```

## 高级配置

### 变量持久化设置

```javascript
// 配置变量存储
const varConfig = {
    persistence: {
        global: true,      // 全局变量持久化
        character: true,   // 角色变量持久化
        local: false,      // 局部变量不持久化
        session: true      // 会话变量持久化
    },
    
    backup: {
        enabled: true,     // 启用备份
        interval: 300,     // 备份间隔（秒）
        maxBackups: 10     // 最大备份数量
    }
};
```

### 自定义函数

```javascript
// 注册自定义函数
registerFunction('rollDice', function(sides) {
    return Math.floor(Math.random() * sides) + 1;
});

registerFunction('formatTime', function(timestamp) {
    return new Date(timestamp).toLocaleString();
});

// 在模板中使用
// {{rollDice(20)}} -> 随机1-20的数字
// {{formatTime(sys_timestamp)}} -> 格式化时间
```

这个MagVarUpdate系统为SillyTavern提供了强大而灵活的变量管理能力，使得复杂的角色扮演场景和动态内容生成成为可能。通过合理使用这些功能，可以创建出非常丰富和交互式的对话体验。
