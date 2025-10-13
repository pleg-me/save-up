export type Identity = {
  name: string;
  income: number; // monthly income
  initCash: number; // starting wallet cash
  ap: number; // action points per month
};

export const IDENTITIES: Identity[] = [
  { name: '高中生（兼职）', income: 300, initCash: 200, ap: 6 },
  { name: '大学生', income: 500, initCash: 300, ap: 7 },
  { name: '暑期工', income: 400, initCash: 250, ap: 6 },
  { name: '初入职场', income: 800, initCash: 500, ap: 8 },
];