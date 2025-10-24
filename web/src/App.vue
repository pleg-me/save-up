<script setup lang="ts">
import { ref, toRaw, onMounted } from 'vue';
import type Phaser from 'phaser';
import PhaserGame from './PhaserGame.vue';
import PlayerInfoPanel from './components/PlayerInfoPanel.vue';
import SettlementLogsPanel from './components/SettlementLogsPanel.vue';
import type { Game } from './game/scenes/Game';
import SponsorPanel from './components/SponsorPanel.vue';

const phaserRef = ref<any>();
const inGame = ref(false);

const currentScene = (scene: Phaser.Scene) => {
  const key = scene?.scene?.key;
  inGame.value = (key === 'Game');
};

onMounted(() => {
  // no-op; layout initialized
});
</script>

<template>
  <div class="app-layout">
    <aside class="left-panel">
      <PlayerInfoPanel v-if="inGame" />
    </aside>
    <main class="center-panel">
      <PhaserGame ref="phaserRef" @current-active-scene="currentScene" />
    </main>
    <aside class="right-panel">
      <SettlementLogsPanel v-if="inGame" />
      <SponsorPanel />
    </aside>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  grid-template-rows: 100%;
  height: 100vh;
  box-sizing: border-box;
}
.left-panel {
  border-right: 1px solid #1e2a37;
  background: #0e1a2b;
  padding: 12px;
  overflow: auto;
}
.center-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #041527;
}
.right-panel {
  border-left: 1px solid #1e2a37;
  background: #0e1a2b;
  padding: 12px;
  overflow: auto;
}
</style>
