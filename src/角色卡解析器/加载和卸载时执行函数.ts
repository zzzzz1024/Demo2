// 在界面加载好后执行某个函数
// 注意: 必须使用 `$()` 而不是 `document.addEventListener('DOMContentLoaded'`, 后者会让实时修改失效
$(() => {
  toastr.success('角色卡解析器已成功加载!', '欢迎使用!');
  
  // 在浏览器环境中添加一些额外的用户提示
  if (typeof (window as any).getScriptId === 'undefined' || (window as any).getScriptId() === 'mock-script-id') {
    setTimeout(() => {
      console.log('💡 提示: 当前运行在浏览器兼容模式下');
      console.log('📁 文件上传: 支持拖拽或点击上传PNG角色卡');
      console.log('💾 数据存储: 使用localStorage模拟酒馆变量系统');
    }, 1000);
  }
});

// 在界面卸载时执行某个函数
$(window).on('pagehide', () => {
  toastr.info('角色卡解析器已卸载!', '再见!');
});
