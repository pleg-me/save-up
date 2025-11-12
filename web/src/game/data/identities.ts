import { Settings } from "./Settings";

type LocaleName = {
  en: string;
  zhs: string;
}

export type Identity = {
  name: LocaleName;
  income: number; // monthly income
  initCash: number; // starting wallet cash
  ap: number; // action points per month
};

export const IDENTITIES: Identity[] = [
  { name: { en: 'High School Student (Part-time)', zhs: '高中学生（兼职）' }, income: 300, initCash: 200, ap: 6 },
  { name: { en: 'Undergraduate Student', zhs: '大学生' }, income: 500, initCash: 300, ap: 7 },
  { name: { en: 'Summer Worker', zhs: '暑期工' }, income: 400, initCash: 250, ap: 6 },
  { name: { en: 'First-Time Job', zhs: '初入职场' }, income: 800, initCash: 500, ap: 8 },
];

export function getIdentityName(identity: Identity | undefined ): string {
  const ln = identity?.name ?? { en: 'Unknown Identity', zhs: '未知身份' };
  switch(Settings.lang) {
      case "en":
          return ln.en;
      case "zhs":
          return ln.zhs;
      default:
          return ln.zhs;
  }
}