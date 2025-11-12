<script setup lang="ts">
import { Settings } from '../game/data/Settings';
import { Sponsors } from '../game/data/Sponsors';

// 打开链接的函数
const openLink = (url: string) => {
  window.open(url, '_blank');
};
</script>

<template>
  <div class="sponsor-panel">
    <div class="header">
      <h3 class="title">🙏🏻 {{ Settings.SponsorName }}</h3>
      <div class="subtitle">{{ Settings.locale.Sponsors }}</div>
    </div>
    
    <div class="divider" />
    
    <div class="links-container">
      <!-- <div class="links-title">{{ Settings.locale.Sponsors }}</div> -->
      <div class="links-grid">
        <button 
          v-for="link in Sponsors.Links" 
          :key="link.name"
          class="link-button"
          @click="openLink(link.url)"
          :title="`${Settings.locale.Visit} ${link.name}`"
        >
          <span class="link-icon">🔗</span>
          <span class="link-name">{{ link.name }}</span>
        </button>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-text">{{ Settings.locale.ThankSponsors }}</div>
    </div>
  </div>
</template>

<style scoped>
.sponsor-panel {
  color: #e6f4ff;
  font-family: Arial, sans-serif;
  background: linear-gradient(180deg, #0f1f33 0%, #0a1626 100%);
  border: 1px solid #1e2a37;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  margin-bottom: 12px;
}

.header {
  margin-bottom: 8px;
}

.title {
  margin: 0;
  font-size: 16px;
  color: #bde;
  letter-spacing: 0.2px;
  font-weight: 600;
}

.subtitle {
  font-size: 13px;
  color: #9fb3c8;
  margin-top: 4px;
}

.divider {
  height: 1px;
  background: #1e2a37;
  margin: 10px 0;
  opacity: 0.8;
}

.links-container {
  margin-bottom: 12px;
}

.links-title {
  font-size: 14px;
  color: #cbd;
  margin-bottom: 8px;
  font-weight: 500;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.link-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #133a5a 0%, #0c2a45 100%);
  border: 1px solid #235;
  border-radius: 6px;
  color: #d9f0ff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
}

.link-button:hover {
  background: linear-gradient(180deg, #1a4a6f 0%, #134055 100%);
  border-color: #3a6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.link-button:active {
  transform: translateY(0);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
}

.link-icon {
  font-size: 12px;
  opacity: 0.8;
}

.link-name {
  font-weight: 500;
  flex: 1;
  text-align: left;
}

.footer {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #1e2a37;
}

.footer-text {
  font-size: 12px;
  color: #9fb3c8;
  font-style: italic;
}
</style>