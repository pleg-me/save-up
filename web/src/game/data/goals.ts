import { Settings } from "./Settings";

type LocaleName = {
  en: string;
  zhs: string;
}

export type Goal = {
  name: LocaleName;
  amount: number; // target amount to win
};

export const GOALS: Goal[] = [
  { name: { en: 'Game Console', zhs: '游戏主机' }, amount: 500 },
  { name: { en: 'Graduation Trip', zhs: '毕业旅行' }, amount: 1000 },
  { name: { en: 'Used Car', zhs: '二手车' }, amount: 3000 },
  { name: { en: 'Startup Fund', zhs: '创业基金' }, amount: 5000 },
];

export function getGoalName(goal: Goal | undefined ): string {
  const ln = goal?.name ?? { en: 'Unknown Goal', zhs: '未知目标' };
  switch(Settings.lang) {
      case "en":
          return ln.en;
      case "zhs":
          return ln.zhs;
      default:
          return ln.zhs;
  }
}