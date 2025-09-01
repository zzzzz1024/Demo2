/**
 * 环境兼容性处理
 * 确保项目既能在酒馆助手中运行，也能在浏览器中独立测试
 */

// 检测是否在酒馆助手环境中
function isInTavernHelper(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).getScriptId === 'function' &&
    typeof (window as any).toastr === 'object'
  );
}

// 模拟酒馆助手环境的必要函数
function setupMockEnvironment() {
  if (typeof window === 'undefined') return;

  const win = window as any;

  // 模拟jQuery
  if (!win.$) {
    // 简单的jQuery模拟
    win.$ = function (selector: any) {
      if (typeof selector === 'function') {
        // $(function() {}) 形式
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', selector);
        } else {
          selector();
        }
        return;
      }

      if (selector === window) {
        // $(window) 形式
        return {
          on: function (event: string, handler: Function) {
            window.addEventListener(event, handler);
          },
        };
      }

      // 其他选择器
      return document.querySelector(selector);
    };
  }

  // 模拟toastr
  if (!win.toastr) {
    win.toastr = {
      success: function (message: string, title?: string) {
        console.log(`✅ ${title || 'Success'}: ${message}`);
        // 可以在这里添加浏览器原生通知
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(title || 'Success', { body: message });
        }
      },
      error: function (message: string, title?: string) {
        console.error(`❌ ${title || 'Error'}: ${message}`);
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(title || 'Error', { body: message });
        }
      },
      info: function (message: string, title?: string) {
        console.info(`ℹ️ ${title || 'Info'}: ${message}`);
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(title || 'Info', { body: message });
        }
      },
      warning: function (message: string, title?: string) {
        console.warn(`⚠️ ${title || 'Warning'}: ${message}`);
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(title || 'Warning', { body: message });
        }
      },
    };
  }

  // 模拟酒馆助手函数
  if (!win.getScriptId) {
    win.getScriptId = function () {
      return 'mock-script-id';
    };
  }

  if (!win.getVariables) {
    win.getVariables = function (options: any) {
      const key = `tavern_variables_${options.type}_${options.script_id || 'default'}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    };
  }

  if (!win.replaceVariables) {
    win.replaceVariables = function (variables: any, options: any) {
      const key = `tavern_variables_${options.type}_${options.script_id || 'default'}`;
      localStorage.setItem(key, JSON.stringify(variables));
    };
  }

  // 模拟其他可能用到的函数
  if (!win.getCurrentMessageId) {
    win.getCurrentMessageId = function () {
      return 'mock-message-id';
    };
  }

  if (!win.getChatMessages) {
    win.getChatMessages = function (messageId: string) {
      return [
        {
          message: '这是一个模拟的消息内容',
          role: 'user',
        },
      ];
    };
  }

  if (!win.createChatMessages) {
    win.createChatMessages = async function (messages: any[]) {
      console.log('模拟创建消息:', messages);
    };
  }

  if (!win.triggerSlash) {
    win.triggerSlash = function (command: string) {
      console.log('模拟执行斜杠命令:', command);
    };
  }

  if (!win.substitudeMacros) {
    win.substitudeMacros = function (macro: string) {
      if (macro === '{{char}}') return '测试角色';
      return macro;
    };
  }
}

// 请求通知权限（如果在浏览器环境中）
function requestNotificationPermission() {
  if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// 初始化环境
export function initializeEnvironment() {
  if (!isInTavernHelper()) {
    console.log('🔧 检测到非酒馆助手环境，启用兼容性模式');
    setupMockEnvironment();
    requestNotificationPermission();

    // 添加一个提示信息
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #667eea;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      max-width: 300px;
    `;
    infoDiv.innerHTML = `
      <strong>🔧 兼容性模式</strong><br>
      当前在浏览器中运行，部分功能使用模拟实现。<br>
      Vue库已内置打包，无需CDN加载。
    `;

    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(infoDiv);

      // 5秒后自动隐藏
      setTimeout(() => {
        if (infoDiv.parentNode) {
          infoDiv.style.opacity = '0';
          infoDiv.style.transition = 'opacity 0.5s ease';
          setTimeout(() => {
            if (infoDiv.parentNode) {
              infoDiv.parentNode.removeChild(infoDiv);
            }
          }, 500);
        }
      }, 5000);
    });
  } else {
    console.log('✅ 检测到酒馆助手环境');
  }
}

// 立即执行环境初始化（确保在任何其他代码执行前完成）
initializeEnvironment();

// 导出环境检测函数
export { isInTavernHelper };
