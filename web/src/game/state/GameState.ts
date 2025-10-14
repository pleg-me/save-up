import { IDENTITIES, type Identity } from '../data/identities';
import { GOALS, type Goal } from '../data/goals';

export type Accounts = {
  wallet: number;
  savings: number;
  investment: number;
  emergencyFund: number;
};

export type NecessaryExpense = {
  type: 'necessary';
  name: string;
  cost: number;
  paid: boolean;
};

export type UnexpectedEvent = {
  type: 'unexpected';
  name: string;
  cost: number;
  resolved: boolean;
  source?: 'emergency' | 'wallet' | 'mood';
};

export type GameState = {
  month: number;
  identity?: Identity;
  goal?: Goal;
  accounts: Accounts;
  ap: number;
  mood: number; // optional system
  events: NecessaryExpense[]; // necessary expenses for now
  unexpected: UnexpectedEvent[]; // unexpected events (auto-offset by emergency fund)
  incomeBonus: number; // from study action
  logs?: SettlementSummary[]; // recent month settlement summaries
  savingsInterestRemainder?: number; // fractional remainder to accumulate
};

export const gameState: GameState = {
  month: 0,
  identity: undefined,
  goal: undefined,
  accounts: { wallet: 0, savings: 0, investment: 0, emergencyFund: 0 },
  ap: 0,
  mood: 100,
  events: [],
  unexpected: [],
  incomeBonus: 0,
  logs: [],
  savingsInterestRemainder: 0,
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function initNewGame() {
  const id = pickRandom(IDENTITIES);
  const gl = pickRandom(GOALS);

  gameState.month = 1;
  gameState.identity = id;
  gameState.goal = gl;
  gameState.accounts.wallet = id.initCash;
  gameState.accounts.savings = 0;
  gameState.accounts.investment = 0;
  gameState.accounts.emergencyFund = 0;
  gameState.ap = id.ap;
  gameState.mood = 100;
  gameState.events = [];
  gameState.unexpected = [];
  gameState.incomeBonus = 0;
}

export function startMonth() {
  const id = gameState.identity;
  if (!id) return;
  // 发放月收入
  gameState.accounts.wallet += (id.income + gameState.incomeBonus);
  // 重置当月 AP
  gameState.ap = id.ap;
  // 生成当月必要支出（示例：每月 1 项）
  gameState.events.push(generateNecessaryExpense());
  // 随机生成 0-1 个意外事件（约 40% 概率）
  if (Math.random() < 0.4) {
    gameState.unexpected.push(generateUnexpectedEvent());
  }
}

export function updateMood(delta: number) {
  //gameState.mood = Math.max(0, Math.min(100, gameState.mood + delta));
  const m =  gameState.mood + delta;
  if(m < 0) gameState.mood = 0;
  else if(m > 200) gameState.mood = 200;
  else gameState.mood = m;
}

// —— 月末结算（M3）：储蓄利息、投资收益与必要支出后果 ——
const SAVINGS_RATE_MONTHLY = 0.002; // 储蓄月利率：0.2%

// MVP：统一投资池，收益率为随机 [-10%, +10%]
export type UnexpectedResolutionSummary = { name: string; cost: number; source: 'emergency' | 'wallet' | 'mood' };
export type SettlementSummary = {
  month: number;
  savingsInterest: number;
  investmentDelta: number;
  latePenalty: number;
  unexpectedResolutions: UnexpectedResolutionSummary[];
};

export function settleMonth(): SettlementSummary {
  const summary: SettlementSummary = {
    month: gameState.month,
    savingsInterest: 0,
    investmentDelta: 0,
    latePenalty: 0,
    unexpectedResolutions: [],
  };

  // 储蓄利息
  const savings = gameState.accounts.savings;
  if (savings > 0) {
    const raw = savings * SAVINGS_RATE_MONTHLY + (gameState.savingsInterestRemainder ?? 0);
    const interest = Math.floor(raw);
    gameState.savingsInterestRemainder = raw - interest;
    gameState.accounts.savings += interest;
    summary.savingsInterest = interest;
  }

  // 投资收益（统一随机收益率）
  const invest = gameState.accounts.investment;
  if (invest > 0) {
    const pct = (Math.random() * 0.2) - 0.1; // [-0.1, 0.1]
    const delta = Math.round(invest * pct);
    gameState.accounts.investment = Math.max(0, invest + delta);
    summary.investmentDelta = delta;
  }

  // 未支付必要支出的后果：滞纳金（10%）,心情 -10（若钱包不足）
  const unpaid = gameState.events.filter(e => e.type === 'necessary' && !e.paid);
  if (unpaid.length > 0) {
    const totalPenalty = unpaid.reduce((sum, e) => sum + Math.floor(e.cost * 0.1), 0);
    if (totalPenalty > 0) {
      if (gameState.accounts.wallet >= totalPenalty) {
        gameState.accounts.wallet -= totalPenalty;
        updateMood(-5);
      } else {
        updateMood(-20);
      }
      summary.latePenalty = totalPenalty;
    }
  }

  // 意外事件自动抵消：优先用应急基金；其次钱包；否则心情 -10
  gameState.unexpected.forEach(ev => {
    if (ev.resolved) return;
    const cost = ev.cost;
    if (gameState.accounts.emergencyFund >= cost) {
      // 心情不变
      gameState.accounts.emergencyFund -= cost;
      ev.resolved = true;
      ev.source = 'emergency';
      summary.unexpectedResolutions.push({ name: ev.name, cost: ev.cost, source: 'emergency' });
    } else if (gameState.accounts.wallet >= cost) {
      updateMood(-5);
      gameState.accounts.wallet -= cost;
      ev.resolved = true;
      ev.source = 'wallet';
      summary.unexpectedResolutions.push({ name: ev.name, cost: ev.cost, source: 'wallet' });
    } else {
      updateMood(-20);
      ev.resolved = true;
      ev.source = 'mood';
      summary.unexpectedResolutions.push({ name: ev.name, cost: ev.cost, source: 'mood' });
    }
  });

  return summary;
}

export function endMonth() {
  // 先进行本月结算（利息、投资收益、未支付后果），并记录摘要
  const summary = settleMonth();
  // 记录最近 N 条结算日志（默认 5 条）
  const maxLogs = 5;
  (gameState.logs ??= []).push(summary);
  if ((gameState.logs?.length ?? 0) > maxLogs) {
    gameState.logs?.shift();
  }
  // 月份递增
  gameState.month += 1;
  // 下月开始前清理当月事件列表（占位，后续引擎接管）
  gameState.events = [];
  gameState.unexpected = [];
  // 开启新月份
  startMonth();
}

export function consumeAP(amount: number = 1) {
  gameState.ap = Math.max(0, gameState.ap - amount);
}

export function depositToSavings(amount: number) {
  amount = Math.floor(Math.max(0, amount));
  if (gameState.accounts.wallet >= amount && amount > 0) {
    gameState.accounts.wallet -= amount;
    gameState.accounts.savings += amount;
    updateMood(2);
    consumeAP(1);
    return true;
  }
  return false;
}

export function invest(amount: number) {
  amount = Math.floor(Math.max(0, amount));
  if (gameState.accounts.wallet >= amount && amount > 0) {
    gameState.accounts.wallet -= amount;
    gameState.accounts.investment += amount;
    updateMood(2);
    consumeAP(1);
    return true;
  }
  return false;
}

export function partTime() {
  // 2 AP，获得 60–180，心情 -10
  if (gameState.ap < 2) return false;
  const earn = 60 + Math.floor(Math.random() * 121); // 60-180
  gameState.accounts.wallet += earn;
  updateMood(-10);
  consumeAP(2);
  return earn;
}

export const INCOME_BONUS_CAP = 200; // 学习加成上限，总加成为 200

export function study() {
  if (gameState.ap < 2) return false;
  const before = gameState.incomeBonus;
  const after = Math.min(INCOME_BONUS_CAP, before + 50);
  updateMood(1);
  if (after === before) {
    // 已达上限，不消耗AP
    return false;
  }
  updateMood(2);
  gameState.incomeBonus = after;
  consumeAP(2);
  return true;
}

export function consumeCash(amount: number, mood: number = 1) {
  amount = Math.floor(Math.max(0, amount));
  if (gameState.accounts.wallet >= amount && amount > 0) {
    gameState.accounts.wallet -= amount;
    //gameState.mood = (gameState.mood ?? 100) + 10; // 上限取消，允许超过 140 进入“快乐”阈值
    updateMood(mood);
    consumeAP(1);
    return true;
  }
  return false;
}

// —— 胜利与复盘（M5） ——
export type VictoryReport = {
  identityName: string;
  goalName: string;
  goalAmount: number;
  months: number;
  totalSavings: number;
  totalInvestment: number;
  progress: number;
  savingsRate: number; // 0..1，储蓄/(储蓄+投资)
  investWins: number;
  investLosses: number;
  investWinRate: number; // 0..1
  unexpectedBySource: {
    emergency: { count: number; amount: number };
    wallet: { count: number; amount: number };
    mood: { count: number; amount: number };
  };
};

export function isVictoryAchieved() {
  const target = gameState.goal?.amount ?? Infinity;
  const progress = (gameState.accounts.savings || 0) + (gameState.accounts.investment || 0);
  return progress >= target && target !== Infinity;
}

export function getVictoryReport(): VictoryReport {
  const identityName = gameState.identity?.name ?? '未知身份';
  const goalName = gameState.goal?.name ?? '未知目标';
  const goalAmount = gameState.goal?.amount ?? 0;
  const months = gameState.month;
  const totalSavings = gameState.accounts.savings;
  const totalInvestment = gameState.accounts.investment;
  const progress = totalSavings + totalInvestment;
  const denom = totalSavings + totalInvestment;
  const savingsRate = denom > 0 ? totalSavings / denom : 0;
  const logs = gameState.logs ?? [];
  let wins = 0, losses = 0;
  logs.forEach(l => {
    if (l.investmentDelta > 0) wins += 1;
    else if (l.investmentDelta < 0) losses += 1;
  });
  const investWinRate = (wins + losses) > 0 ? wins / (wins + losses) : 0;
  const accUnexpected = { emergency: { count: 0, amount: 0 }, wallet: { count: 0, amount: 0 }, mood: { count: 0, amount: 0 } };
  logs.forEach(l => {
    l.unexpectedResolutions.forEach(u => {
      const s = accUnexpected[u.source];
      if (s) {
        s.count += 1;
        s.amount += u.cost;
      }
    });
  });
  return {
    identityName,
    goalName,
    goalAmount,
    months,
    totalSavings,
    totalInvestment,
    progress,
    savingsRate,
    investWins: wins,
    investLosses: losses,
    investWinRate,
    unexpectedBySource: accUnexpected,
  };
}

export function depositEmergency(amount: number) {
  amount = Math.floor(Math.max(0, amount));
  if (gameState.accounts.wallet >= amount && amount > 0) {
    gameState.accounts.wallet -= amount;
    gameState.accounts.emergencyFund += amount;
    updateMood(1);
    consumeAP(1);
    return true;
  }
  return false;
}

export function generateNecessaryExpense(): NecessaryExpense {
  const names = ['手机话费', '水电费', '学习资料'];
  const name = names[Math.floor(Math.random() * names.length)];
  const cost = 40 + Math.floor(Math.random() * 81); // 40-120
  return { type: 'necessary', name, cost, paid: false };
}

export function generateUnexpectedEvent(): UnexpectedEvent {
  const names = ['看病费用', '家电维修', '交通事故'];
  const name = names[Math.floor(Math.random() * names.length)];
  const cost = 100 + Math.floor(Math.random() * 201); // 100-300
  return { type: 'unexpected', name, cost, resolved: false };
}

export function payFirstNecessaryExpense() {
  const idx = gameState.events.findIndex(e => e.type === 'necessary' && !e.paid);
  if (idx === -1) return false;
  const ev = gameState.events[idx];
  if (gameState.accounts.wallet >= ev.cost) {
    updateMood(-5);
    gameState.accounts.wallet -= ev.cost;
    ev.paid = true;
    // 不消耗 AP（必要支出支付不计入行动点）
    return true;
  }
  updateMood(-20);
  return false;
}

export function resolveFirstUnexpected() {
  const idx = gameState.unexpected.findIndex(e => e.type === 'unexpected' && !e.resolved);
  if (idx === -1) return false;
  const ev = gameState.unexpected[idx];
  const cost = ev.cost;
  if (gameState.accounts.emergencyFund >= cost) {
    // 心情不变
    gameState.accounts.emergencyFund -= cost;
    ev.resolved = true;
    ev.source = 'emergency';
    return true;
  }
  if (gameState.accounts.wallet >= cost) {
    updateMood(-5);
    gameState.accounts.wallet -= cost;
    ev.resolved = true;
    ev.source = 'wallet';
    return true;
  }
  return false;
}