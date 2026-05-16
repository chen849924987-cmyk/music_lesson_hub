<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
// 🎵 音乐教育平台 - 根组件
// 路由过渡动画定义在 style.css 中
</script>

<style>
/* 页面过渡 */
.page-enter-active {
  animation: sceneFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-leave-active {
  animation: sceneFadeOut 0.3s ease;
}
</style>
