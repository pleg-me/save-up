import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { gameState, getVictoryReport, initNewGame } from '../state/GameState';
import { Settings } from '../data/Settings';

export class VictoryReport extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  background!: Phaser.GameObjects.Image;

  constructor() {
    super('VictoryReport');
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x0b1220);

    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    this.background = this.add.image(cx, cy, 'background');
    this.background.setDisplaySize(w, h);
    this.background.setAlpha(0.35);

    const title = this.add.text(cx, 120, Settings.locale.ReportTitle, {
      fontFamily: 'Arial Black', fontSize: 40, color: '#ffffff', stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(10);

    const report = getVictoryReport();

    const line = (y: number, label: string, value: string) => {
      const l = this.add.text(cx - 220, y, label, { fontFamily: 'Arial', fontSize: 20, color: '#bde' }).setOrigin(0, 0.5);
      const v = this.add.text(cx + 40, y, value, { fontFamily: 'Arial', fontSize: 22, color: '#ffffff' }).setOrigin(0, 0.5);
      return { l, v };
    };

    line(200, `${Settings.locale.Identity}`, report.identityName);
    line(240, `${Settings.locale.Goal}`, `${report.goalName}（$${report.goalAmount}）`);
    line(280, `${Settings.locale.Months}`, `${report.months} 个月`);
    line(320, `${Settings.locale.Progress}`, `$${report.progress}（${Settings.locale.Savings} $${report.totalSavings} + ${Settings.locale.Investment} $${report.totalInvestment}）`);
    line(360, `${Settings.locale.SavingsRate}`, `${Math.round(report.savingsRate * 100)}%`);
    line(400, `${Settings.locale.InvestWinRate}`, `${Math.round(report.investWinRate * 100)}%（${Settings.locale.Win} ${report.investWins} / ${Settings.locale.Loss} ${report.investLosses}）`);

    const u = report.unexpectedBySource;
    line(460, `${Settings.locale.HandlingUnexpected}·${Settings.locale.Emergency}`, `x${u.emergency.count}  ${Settings.locale.Total} $${u.emergency.amount}`);
    line(500, `${Settings.locale.HandlingUnexpected}·${Settings.locale.Wallet}`, `x${u.wallet.count}  ${Settings.locale.Total} $${u.wallet.amount}`);
    line(540, `${Settings.locale.HandlingUnexpected}·${Settings.locale.Mood}`, `x${u.mood.count}  ${Settings.locale.Total} $${u.mood.amount}`);

    // 操作按钮
    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Arial', fontSize: 22, color: '#ffffff', backgroundColor: '#1976d2',
      padding: { left: 16, right: 16, top: 10, bottom: 10 }, stroke: '#0b2545', strokeThickness: 3,
    };
    const backBtn = this.add.text(100, h - 140, Settings.locale.ReturnMainMenu, btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    // const replayBtn = this.add.text(cx + 120, h - 140, '再玩一次', btnStyle)
    //   .setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.tweens.add({ targets: backBtn, scale: 0.95, yoyo: true, duration: 90 });
      this.scene.start('MainMenu');
    });
    // replayBtn.on('pointerdown', () => {
    //   this.tweens.add({ targets: replayBtn, scale: 0.95, yoyo: true, duration: 90 });
    //   initNewGame();
    //   this.scene.start('Game');
    // });

    EventBus.emit('current-scene-ready', this);
  }
}