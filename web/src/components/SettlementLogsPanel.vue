<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { EventBus } from '../game/EventBus';
import { gameState, type SettlementSummary } from '../game/state/GameState';
import { Settings } from '../game/data/Settings';

const logs = ref<SettlementSummary[]>([]);
const containerRef = ref<HTMLDivElement | null>(null);
const isOpen = ref(true);

const GREEN = '#52c41a';
const RED = '#ff4d4f';
const GREY = '#aaaaaa';

const updateLogs = () => {
  logs.value = [...(gameState.logs ?? [])];
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  });
};

onMounted(() => {
  updateLogs();
  EventBus.on('logs-updated', updateLogs);
});

onUnmounted(() => {
  EventBus.off('logs-updated', updateLogs);
});

const srcMap: Record<string, string> = { emergency: Settings.locale.Emergency, wallet: Settings.locale.Wallet, mood: Settings.locale.Mood };
</script>

<template>
  <div class="panel">
    <div class="accordion">
      <button class="acc-header" @click="isOpen = !isOpen">
        <span class="chev">{{ isOpen ? '▾' : '▸' }}</span>
        <span class="title">{{ Settings.locale.SettlementLogs }}</span>
      </button>
      <div v-show="isOpen" class="acc-body">
        <div ref="containerRef" class="logs">
          <div v-for="s in logs" :key="s.month" class="log">
            <span class="t">[M{{ s.month }}] {{ Settings.locale.Interest }} </span>
            <span :style="{ color: s.savingsInterest > 0 ? GREEN : GREY }">+${{ s.savingsInterest }}</span>
            <span class="t">{{ ", " + Settings.locale.Investment }} </span>
            <span :style="{ color: s.investmentDelta >= 0 ? GREEN : RED }">{{ s.investmentDelta >= 0 ? '+' : '-' }}${{ Math.abs(s.investmentDelta) }}</span>
            <span class="t">{{ ", " + Settings.locale.LatePenalty }} </span>
            <span :style="{ color: s.latePenalty > 0 ? RED : GREY }">{{ s.latePenalty > 0 ? '-' : '' }}${{ s.latePenalty || 0 }}</span>
            <span class="t">{{ "; " + Settings.locale.Unexpected + ": " }}</span>
            <span class="t">{{ (s.unexpectedResolutions?.length ?? 0) > 0 ? s.unexpectedResolutions.map(u => `${u.name} $${u.cost}->${srcMap[u.source]}`).join('; ') : Settings.locale.NA }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel { color: #e6f4ff; font-family: Arial, sans-serif; }
/* 右侧面板宽度为 320px，左右 padding 为 12px，因此内容区约 296px */
.accordion { width: 296px; background: #0e1a2b; border: 1px solid #1e2a37; box-sizing: border-box; }
.acc-header { width: 100%; text-align: left; background: transparent; border: none; color: #eee; cursor: pointer; padding: 8px; display: flex; align-items: center; gap: 6px; }
.acc-body { padding: 0 8px 8px; }
.title { font-size: 16px; color: #bde; }
.chev { color: #cbd; width: 1em; display: inline-block; }
.logs { width: 100%; height: 240px; overflow-y: auto; background: #0e1a2b; border-top: 1px solid #1e2a37; padding: 8px 0; box-sizing: border-box; }
.log { font-size: 13px; color: #eee; line-height: 20px; white-space: normal; word-break: break-word; overflow-wrap: anywhere; }
.t { color: #cbd; }
</style>