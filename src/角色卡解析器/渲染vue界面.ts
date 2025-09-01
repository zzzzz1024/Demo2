// 静态导入Vue库和组件
import { createApp } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import AppComponent from './app.vue';
import CharacterParserComponent from './角色卡解析器.vue';
import ParseHistoryComponent from './解析历史.vue';

// 启动Vue应用
function startVueApp() {
  try {
    console.log('🚀 启动Vue应用...');
    console.log('📦 使用打包的Vue库和组件');

    // 创建路由器
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: '/parser' },
        { path: '/parser', component: CharacterParserComponent },
        { path: '/history', component: ParseHistoryComponent },
      ],
    });

    // 创建并启动Vue应用
    createApp(AppComponent).use(router).mount('#app');
    console.log('✅ Vue应用启动成功');
  } catch (error) {
    console.error('❌ Vue应用启动失败:', error);
    showErrorMessage('应用启动失败', `Vue应用启动失败: ${error.message}`);
  }
}

// 显示错误信息
function showErrorMessage(title: string, message: string) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f8d7da;
    color: #721c24;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #f5c6cb;
    max-width: 400px;
    text-align: center;
    z-index: 10001;
  `;
  errorDiv.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
    <button onclick="location.reload()" style="
      background: #dc3545;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    ">刷新页面</button>
  `;
  document.body.appendChild(errorDiv);
}

// 初始化应用
function initializeApp() {
  console.log('📦 Vue库已打包，直接启动应用');
  startVueApp();
}

// 等待DOM准备好
$(() => {
  initializeApp();
});
