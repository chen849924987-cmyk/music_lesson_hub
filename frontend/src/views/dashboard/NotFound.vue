<!--
 * NotFound - 404 页面组件
 *
 * 功能描述：DAW（数字音频工作站）主题的 404 错误页面，
 *           包含走调的旋律隐喻和波形动效。
 *
 * 设计参考：Vuestic UI 双主题设计体系，结合 DAW 创意美学
 -->

<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="not-found-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <h1 class="not-found-code gradient-text">404</h1>
      <p class="not-found-title">这个页面像走调的旋律...</p>
      <p class="not-found-desc">找不到你想要的页面，也许它从未被谱写</p>
      <router-link to="/" class="btn--primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        回到首页
      </router-link>
    </div>

    <!-- DAW 波形装饰 -->
    <div class="not-found-waveform">
      <span
        v-for="n in 16"
        :key="n"
        :style="{
          animationDelay: `${n * 0.08}s`,
          height: `${15 + Math.random() * 60}%`,
        }"
      ></span>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
 * NotFound 样式
 * 使用 --va-* 双主题 CSS 变量 + DAW 音乐美学元素
 * ============================================================ */

.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--va-background-primary);
  position: relative;
  overflow: hidden;
  padding: 40px;
}

.not-found-content {
  text-align: center;
  position: relative;
  z-index: 1;
  animation: sceneFadeIn 0.6s 0.3s ease both;
}

.not-found-icon {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
  filter: grayscale(0.2);
}

.not-found-code {
  font-size: 96px;
  font-family: var(--va-font-family);
  margin: 0 0 8px;
  line-height: 1;
}

.not-found-title {
  font-size: 22px;
  color: var(--va-on-background-primary);
  margin: 0 0 8px;
}

.not-found-desc {
  font-size: 14px;
  color: var(--va-on-background-element);
  margin: 0 0 32px;
}

/* ---- DAW 波形装饰 ---- */
.not-found-waveform {
  position: absolute;
  bottom: 80px;
  left: 10%;
  right: 10%;
  display: flex;
  gap: 4px;
  height: 80px;
  align-items: center;
  justify-content: center;
  opacity: 0.08;
}

.not-found-waveform span {
  width: 4px;
  border-radius: 2px;
  background: var(--va-primary);
  animation: wave 1.2s ease-in-out infinite alternate;
}
</style>
