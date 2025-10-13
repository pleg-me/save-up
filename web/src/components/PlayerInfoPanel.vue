<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { EventBus } from '../game/EventBus';
import { gameState, type Accounts } from '../game/state/GameState';

type InfoSnapshot = {
  month: number;
  identity?: { name: string };
  goal?: { name: string; amount: number };
  accounts: Accounts;
  ap: number;
  mood?: number;
};

const info = ref<InfoSnapshot>({
  month: gameState.month,
  identity: gameState.identity ? { name: gameState.identity.name } : undefined,
  goal: gameState.goal ? { name: gameState.goal.name, amount: gameState.goal.amount } : undefined,
  accounts: { ...gameState.accounts },
  ap: gameState.ap,
  mood: gameState.mood,
});

const getMoodInfo = (v = 100) => {
  if (v <= 60) return { label: '绝望', color: '#ff4d4f' };
  if (v <= 80) return { label: '难过', color: '#faad14' };
  if (v <= 120) return { label: '平静', color: '#1890ff' };
  if (v <= 140) return { label: '愉悦', color: '#52c41a' };
  return { label: '快乐', color: '#73d13d' };
};

const onUpdate = () => {
  info.value = {
    month: gameState.month,
    identity: gameState.identity ? { name: gameState.identity.name } : undefined,
    goal: gameState.goal ? { name: gameState.goal.name, amount: gameState.goal.amount } : undefined,
    accounts: { ...gameState.accounts },
    ap: gameState.ap,
    mood: gameState.mood,
  };
};

const moodPercent = computed(() => {
  const v = info.value.mood ?? 100;
  return Math.max(0, Math.min(100, Math.round((v / 200) * 100)));
});

const goalPercent = computed(() => {
  const amt = info.value.goal?.amount ?? 0;
  if (!amt || amt <= 0) return 0;
  const progress = (info.value.accounts?.savings ?? 0) + (info.value.accounts?.investment ?? 0);
  return Math.max(0, Math.min(100, Math.round((progress / amt) * 100)));
});

onMounted(() => {
  onUpdate();
  EventBus.on('game-state-updated', onUpdate);
});

onUnmounted(() => {
  EventBus.off('game-state-updated', onUpdate);
});
</script>

<template>
  <div class="panel">
    <div class="header">
      <div class="title-row">
        <span class="title">玩家信息</span>
      </div>
      <div class="sub">
        <span class="label">身份：</span>
        <strong class="value">{{ info.identity?.name ?? '未知身份' }}</strong>
        <span class="dot">•</span>
        <span class="label">目标：</span>
        <strong class="value">{{ info.goal?.name ?? '未知目标' }}</strong>
        <!-- <span class="goal-amt">（${{ info.goal?.amount ?? 0 }}）</span> -->
      </div>
    </div>

    <div class="divider" />

    <div class="stats-grid">
      <div class="stat-card wallet">
        <div class="stat-label">💼 钱包</div>
        <div class="stat-value">${{ info.accounts.wallet }}</div>
      </div>
      <div class="stat-card emergency">
        <div class="stat-label">🆘 应急基金</div>
        <div class="stat-value">${{ info.accounts.emergencyFund }}</div>
      </div>
      <div class="stat-card savings">
        <div class="stat-label">🏦 储蓄</div>
        <div class="stat-value">${{ info.accounts.savings }}</div>
      </div>
      <div class="stat-card investment">
        <div class="stat-label">📈 投资</div>
        <div class="stat-value">${{ info.accounts.investment }}</div>
      </div>
    </div>

    <div class="divider" />

    <div class="row goal">
      <span class="label">目标：${{ info.goal?.amount ?? 0 }}</span>
    </div>
    <div class="goal-bar">
      <div class="goal-fill" :style="{ width: goalPercent + '%'}" />
      <div class="goal-label">{{ goalPercent }}%</div>
    </div>

    <div class="row mood">
      <span class="label">心情</span>
    </div>
    <div class="mood-bar">
      <div class="mood-fill" :style="{ width: moodPercent + '%', background: getMoodInfo(info.mood).color }" />
      <div class="mood-label">{{ getMoodInfo(info.mood).label }}（{{ info.mood }}）</div>
    </div>

    <div class="divider" />

    <div class="footer">
      <span class="badge month">第 {{ info.month }} 月</span>
      <span class="ap-wrap">
        <span class="label">可用行动点数：</span>
        <span class="badge ap">{{ info.ap }}</span>
      </span>
    </div>
  </div>
  
</template>

<style scoped>
.panel { color: #e6f4ff; font-family: Arial, sans-serif; background: linear-gradient(180deg, #0f1f33 0%, #0a1626 100%); border: 1px solid #1e2a37; border-radius: 10px; padding: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.35); }
.header { margin-bottom: 6px; }
.title-row { display: flex; align-items: center; justify-content: flex-start; gap: 8px; }
.title { margin: 0; font-size: 16px; color: #bde; letter-spacing: 0.2px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; line-height: 18px; background: linear-gradient(180deg, #133a5a 0%, #0c2a45 100%); color: #d9f0ff; border: 1px solid #235;
  box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }
.badge.month { font-weight: 600; }
.sub { margin-top: 4px; font-size: 13px; color: #cbd; }
.label { color: #9fb3c8; }
.value { color: #e6f4ff; }
.dot { margin: 0 6px; color: #3a546f; }
.divider { height: 1px; background: #1e2a37; margin: 10px 0; opacity: 0.8; }
.row { margin: 6px 0; font-size: 14px; }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.stat-card { background: #132036; border: 1px solid #243a57; border-radius: 8px; padding: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.25); }
.stat-label { font-size: 12px; color: #9fb3c8; letter-spacing: 0.3px; }
.stat-value { font-size: 18px; color: #eaf6ff; font-weight: 600; margin-top: 2px; text-shadow: 0 0 8px rgba(70,140,200,0.25); }
.stat-card.wallet .stat-value { color: #c8f8d0; }
.stat-card.savings .stat-value { color: #bfe2ff; }
.stat-card.investment .stat-value { color: #e3c8ff; }
.stat-card.emergency .stat-value { color: #ffd7a8; }

.footer { display: flex; align-items: center; justify-content: space-between; }
.ap-wrap { display: inline-flex; align-items: center; gap: 8px; }
.badge.ap { background: linear-gradient(180deg, #17543a 0%, #0f3a29 100%); border-color: #2a6b52; color: #eafff5; font-weight: 700; }

.row.goal { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.goal-bar { position: relative; width: 100%; height: 14px; background: linear-gradient(180deg, #1a2a3f 0%, #142132 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 6px); border: 1px solid #335; border-radius: 6px; overflow: hidden; margin-bottom: 6px; }
.goal-fill { height: 100%; transition: width 0.25s ease; background: linear-gradient(180deg, #3ad16d 0%, #2aa152 100%); box-shadow: 0 0 10px rgba(82,196,26,0.35); }
.goal-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.6); pointer-events: none; }

.mood { font-weight: 600; }
.mood-bar { position: relative; width: 100%; height: 14px; background: linear-gradient(180deg, #1a2a3f 0%, #142132 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 6px); border: 1px solid #335; border-radius: 6px; overflow: hidden; }
.mood-fill { height: 100%; transition: width 0.25s ease; }
.mood-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.6); pointer-events: none; }
</style>