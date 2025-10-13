export type Goal = {
  name: string;
  amount: number; // target amount to win
};

export const GOALS: Goal[] = [
  { name: '游戏主机', amount: 500 },
  { name: '毕业旅行', amount: 1000 },
  { name: '二手车', amount: 3000 },
  { name: '创业基金', amount: 5000 },
];