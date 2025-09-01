<template>
  <div class="character-parser-app">
    <nav class="nav-bar">
      <button 
        class="nav-button" 
        :class="{ active: $route.path === '/parser' }"
        @click="$router.push('/parser')"
      >
        角色卡解析器
      </button>
      <button 
        class="nav-button" 
        :class="{ active: $route.path === '/history' }"
        @click="$router.push('/history')"
      >
        解析历史
      </button>
    </nav>
    <div class="content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue 3 Composition API
</script>

<style lang="scss" scoped>
.character-parser-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.nav-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.nav-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-height: 600px;
}
</style>
