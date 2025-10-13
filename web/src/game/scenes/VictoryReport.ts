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

    const title = this.add.text(cx, 120, '🎉 通关！复盘报告', {
      fontFamily: 'Arial Black', fontSize: 40, color: '#ffffff', stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(10);

    const report = getVictoryReport();

    const line = (y: number, label: string, value: string) => {
      const l = this.add.text(cx - 220, y, label, { fontFamily: 'Arial', fontSize: 20, color: '#bde' }).setOrigin(0, 0.5);
      const v = this.add.text(cx + 40, y, value, { fontFamily: 'Arial', fontSize: 22, color: '#ffffff' }).setOrigin(0, 0.5);
      return { l, v };
    };

    line(200, '身份', report.identityName);
    line(240, '目标', `${report.goalName}（$${report.goalAmount}）`);
    line(280, '用时', `${report.months} 个月`);
    line(320, '最终进度', `$${report.progress}（储蓄 $${report.totalSavings} + 投资 $${report.totalInvestment}）`);
    line(360, '储蓄率', `${Math.round(report.savingsRate * 100)}%`);
    line(400, '投资胜率', `${Math.round(report.investWinRate * 100)}%（胜 ${report.investWins} / 负 ${report.investLosses}）`);

    const u = report.unexpectedBySource;
    line(460, '意外抵消·应急', `${u.emergency.count} 次，总计 $${u.emergency.amount}`);
    line(500, '意外抵消·钱包', `${u.wallet.count} 次，总计 $${u.wallet.amount}`);
    line(540, '意外抵消·心情', `${u.mood.count} 次，总计 $${u.mood.amount}`);

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