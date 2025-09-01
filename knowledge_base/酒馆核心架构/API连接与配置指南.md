# SillyTavern API连接与配置指南

## API连接概述

SillyTavern支持广泛的LLM API连接，包括本地API和云端API。每种API都有其独特的优势、劣势和适用场景。

## Chat Completions vs Text Completions

### Chat Completions



- **结构化对话**: 将提示词构建为用户(User)、助手(Assistant)和系统(System)之间的消息序列
- **对话感**: 创造真实的聊天体验，AI"回应"最后一条消息
- **典型应用**: ChatGPT网站后台使用的就是Chat Completions API



### Text Completions

- **文本续写**: 将所有内容合并为一个长字符串，模型尝试继续这个文本
- **模式延续**: 如果消息格式为"用户: xxx\n角色: xxx"，模型会延续这个模式
- **指令模板**: 大多数Text Completion模型需要特定的"Instruct Template"来正确响应



## 本地API选项



### KoboldCpp

**特点**:

- 易于使用，支持CPU卸载(对低VRAM用户友好)
- 单一二进制文件，支持Windows、Mac、Linux

- 支持GGUF模型格式

- 支持流式输出

**性能**: 比GPU专用加载器慢，但兼容性好



**链接**: [GitHub](https://github.com/LostRuins/koboldcpp)


### llama.cpp


**特点**:

- KoboldCpp和Ollama的原始源代码
- 提供预编译二进制文件和源码编译选项

- 支持GGUF模型



- 轻量级CLI界面

**链接**: [GitHub](https://github.com/ggml-org/llama.cpp)

### Ollama


**特点**:



- 所有llama.cpp系API中最易设置
- 一键下载模型的精美目录
- 支持GGUF模型(包装为Ollama格式)


**链接**: [官网](https://ollama.com/) | [GitHub](https://github.com/ollama/ollama)



### Oobabooga TextGeneration WebUI

**特点**:

- 一体化Gradio UI，支持流式输出
- 最广泛的量化模型支持(AWQ, Exl2, GGML, GGUF, GPTQ)和FP16模型
- 一键安装器
- 定期更新(有时可能破坏与SillyTavern的兼容性)





**连接方法**:

1. 确保使用最新版本的Oobabooga TextGen
2. 编辑CMD_FLAGS.txt文件，添加`--api`标志
3. 重启Ooba服务器

4. 连接ST到`http://localhost:5000/`(默认)，不勾选'Legacy API'


**链接**: [GitHub](https://github.com/oobabooga/text-generation-webui)

### TabbyAPI



**特点**:



- 轻量级Exllamav2 API，支持流式输出
- 支持Exl2、GPTQ和FP16模型
- 官方扩展允许直接从SillyTavern加载/卸载模型
- 不适合低VRAM用户(无CPU卸载)


**链接**: [GitHub](https://github.com/theroyallab/tabbyAPI)




## 云端API选项

### AI Horde

**特点**:

- SillyTavern开箱即用，无需额外设置



- 使用志愿者的GPU处理响应

- 依赖于Worker的生成等待时间、AI设置和可用模型

**链接**: [官网](https://aihorde.net/)

### OpenAI (ChatGPT)


**特点**:



- 易于设置和获取API密钥

- 需要预付费用，按提示收费
- 逻辑性强，创意风格可能重复和可预测
- 新模型(gpt-4-turbo, gpt-4o)支持多模态



**链接**: [平台](https://platform.openai.com/)

### Claude (Anthropic)



**特点**:



- 推荐给希望AI聊天具有创意和独特写作风格的用户
- 需要预付费用，按提示收费
- 最新模型(Claude 3)支持多模态
- 需要特定的提示风格和预填充技术

**链接**: [控制台](https://console.anthropic.com/)




### Google AI Studio 和 Vertex AI

**特点**:

- 有免费层和速率限制(Gemini Flash)
- AI Studio通常有最新模型和功能
- Vertex AI设置较复杂但更稳定




**链接**: [AI Studio](https://aistudio.google.com/) | [Vertex AI](https://console.cloud.google.com/vertex-ai/studio)

### Mistral AI


**特点**:

- 各种尺寸和用例的高效模型

- 32k到128k上下文大小，编程模型可达256k


- 有免费层和速率限制
- 合理的内容审查政策

**链接**: [控制台](https://console.mistral.ai/)

### OpenRouter



**特点**:

- 提供统一API访问市场上所有主要LLM
- 按令牌付费系统，也有免费模型(每日限制)
- 无强制审查(除非LLM供应商要求)


**链接**: [官网](https://openrouter.ai/)

### DeepSeek



**特点**:

- 提供DeepSeek V3和DeepSeek R1模型
- 需要付费(最低$2)，但模型性价比高
- API无审查，但模型可能拒绝某些提示


**链接**: [平台](https://platform.deepseek.com/)


### NovelAI

**特点**:


- 无内容过滤，最新模型基于Llama 3
- 需要付费订阅，订阅等级决定最大上下文长度

**链接**: [官网](https://novelai.net/)

### 其他服务


- **AI21**: Jamba系列开放模型
- **Cohere**: 最新Cohere模型(command-r, command-a等)
- **Perplexity**: 独特的在线Sonar模型

- **Mancer AI**: 无限制模型托管服务
- **DreamGen**: 专为创意写作调优的模型
- **Pollinations**: 无需设置，免费使用


## 配置最佳实践

### 本地部署建议

1. **硬件要求**: 根据模型大小选择合适的硬件配置

2. **模型选择**: 从HuggingFace下载适合的模型(5-50GB)
3. **参数调优**: 根据用途调整温度、top-p等参数
4. **性能优化**: 合理分配CPU和GPU资源

### 云端API使用建议

1. **成本控制**: 监控API使用量和费用
2. **模型选择**: 根据任务需求选择合适的模型

3. **提示优化**: 优化提示词以获得更好的结果
4. **备用方案**: 配置多个API作为备选


### 安全考虑

1. **API密钥管理**: 安全存储和定期轮换API密钥
2. **内容过滤**: 了解各API的内容政策
3. **数据隐私**: 考虑敏感内容的处理方式
4. **访问控制**: 限制API访问权限

## 故障排除

### 常见问题

1. **连接失败**: 检查网络连接和API端点
2. **认证错误**: 验证API密钥和权限
3. **速率限制**: 了解并遵守API速率限制

4. **模型不可用**: 确认模型是否可用和正确配置

### 性能优化

1. **缓存策略**: 合理使用缓存减少API调用
2. **批处理**: 批量处理多个请求
3. **并发控制**: 合理控制并发请求数量
4. **超时设置**: 设置合适的请求超时时间

### 监控和日志

1. **请求日志**: 记录API请求和响应
2. **错误追踪**: 详细的错误信息和堆栈
3. **性能监控**: 监控响应时间和成功率
4. **使用统计**: 分析API使用模式和趋势

## 与SillyTavern集成

### 基本配置

```javascript
// API配置示例

const apiConfig = {
    type: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: 'your-api-key',
    model: 'gpt-4',
    
    parameters: {
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
    }
};
```

### 高级配置

```javascript
// 多API配置
const multiApiConfig = {
    primary: {
        type: 'openai',
        model: 'gpt-4'
    },
    
    fallback: {
        type: 'claude',
        model: 'claude-3-sonnet'
    },
    
    fallbackConditions: [
        'rate_limit_exceeded',
        'model_unavailable',
        'timeout'
    ]
};
```

### 自定义API处理

```javascript
// 自定义API处理器
class CustomAPIHandler {
    constructor(config) {
        this.config = config;
    }
    
    async generateResponse(messages) {
        try {
            const response = await this.callAPI(messages);
            return this.processResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }
    
    async callAPI(messages) {
        // 实现API调用逻辑
    }
    
    processResponse(response) {
        // 处理API响应
    }
    
    handleError(error) {
        // 错误处理逻辑
    }
}
```

这个指南涵盖了SillyTavern支持的各种API连接选项，帮助用户根据自己的需求选择最合适的配置方案。
