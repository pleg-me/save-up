import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { gameState, initNewGame, startMonth, endMonth, depositToSavings, invest, partTime, study, consumeCash, depositEmergency, payFirstNecessaryExpense, resolveFirstUnexpected, isVictoryAchieved } from '../state/GameState';
import { ConsumptionAction, consumptionActions } from '../data/ActionsData';
import { DefaultMap } from '../data/DefaultMap';
import { IGeoItem } from '../../models/GeoItem';
import { PathUtils } from '../../tools/PathUtils';
import { Settings } from '../data/Settings';
import { LocaleUtils } from '../../tools/LocaleUtils';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    fascinatePalette: number[] = [0xff4081, 0xff9800, 0x9c27b0, 0xf44336, 0x00bcd4]; // 诱消费主题色
    fascinateHoverPalette: number[] = [0xff6ea1, 0xffb74d, 0xba68c8, 0xef5350, 0x26c6da];
    geoItems = DefaultMap.geoItems;
    necessaryList: Phaser.GameObjects.Text[] = [];
    unexpectedList: Phaser.GameObjects.Text[] = [];
    consumptionBtns: Phaser.GameObjects.Text[] = [];
    hero: Phaser.GameObjects.Sprite;
    pathNodes: {x: number, y: number}[] = [];
    isMovingForward: boolean = true; // 跟踪移动方向：true为正向，false为反向
    pauseMoving: boolean = false; // 暂停移动标志
    
    // 添加气泡跟随系统相关属性
    private activeBubbles: Array<{
        container: Phaser.GameObjects.Container;
        timer: Phaser.Time.TimerEvent;
        offsetY: number;
    }> = [];
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x898989);

        this.background = this.add.image(512, 512, 'default_map');
        //this.background.setAlpha(0.4);

        // 确保有开局身份与目标（避免月初生成必要支出为空）
        if (!gameState.identity || !gameState.goal) {
            initNewGame();
        }
        // 月初：发放收入与重置 AP
        startMonth();

        // —— 绘制九宫格建筑（3x3），图片尺寸 256x256，场景大小 1024x1024 ——
        this.drawMap();

        // 顶部 HUD 与心情条已由 Vue 面板接管展示，移除 Phaser 内置 HUD
        // 心情自然变化逻辑：
        // - 心情 > 150：每秒 -1
        // - 心情 101~149：每 2 秒 -1
        // - 心情 51~99：每 2 秒 +1
        // - 心情 <= 50：每秒 +1
        // - 不低于/不高于 100（向 100 回归）
        let moodSlowCounter = 0;
        let moodRecoverCounter = 0;
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                const m = gameState.mood ?? 100;
                if (m >= 141) {
                    // 高心情快速回落：每秒 -1，回归至 100
                    gameState.mood = Math.max(100, m - 1);
                    EventBus.emit('game-state-updated');
                    moodRecoverCounter = 0;
                } else if (m > 100) {
                    // 高心情慢速回落：每 2 秒 -1，回归至 100
                    moodSlowCounter += 1;
                    if (moodSlowCounter % 2 === 0) {
                        gameState.mood = Math.max(100, m - 1);
                        EventBus.emit('game-state-updated');
                    }
                    moodRecoverCounter = 0;
                } else if (m <= 50) {
                    // 低心情快速恢复：每秒 +1，回归至 100
                    gameState.mood = Math.min(100, m + 1);
                    EventBus.emit('game-state-updated');
                    moodSlowCounter = 0;
                } else if (m < 100) {
                    // 低心情慢速恢复：每 2 秒 +1，回归至 100
                    moodRecoverCounter += 1;
                    if (moodRecoverCounter % 2 === 0) {
                        gameState.mood = Math.min(100, m + 1);
                        EventBus.emit('game-state-updated');
                    }
                    moodSlowCounter = 0;
                } else {
                    // m === 100，归零计数器
                    moodSlowCounter = 0;
                    moodRecoverCounter = 0;
                }
            }
        });

        // 将“结束本月”按钮移动到场景右下角
        const endMargin = 16;
        const endX = this.camera.width - endMargin;
        const endY = this.camera.height - endMargin;
        const endMonthBtn = this.add.text(endX, endY, '▶ 结束本月',
        { fontFamily: 'Arial', fontSize: 22, color: '#ffffff', backgroundColor: '#0D9800', padding: { left: 14, right: 14, top: 6, bottom: 6 } })
            .setOrigin(1, 1)
            .setDepth(40)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                this.tweens.add({ targets: endMonthBtn, scale: 1.08, duration: 120, ease: 'Quad.easeOut' });
                endMonthBtn.setStyle({ backgroundColor: '#12B802' });
            })
            .on('pointerout', () => {
                this.tweens.add({ targets: endMonthBtn, scale: 1.0, duration: 120, ease: 'Quad.easeOut' });
                endMonthBtn.setStyle({ backgroundColor: '#0D9800' });
            })
            .on('pointerdown', () => {
                this.tweens.add({ targets: endMonthBtn, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
                endMonth();
                renderNecessaryList();
                // 同步刷新意外事件列表（可能在月初生成）
                if (typeof renderUnexpectedList === 'function') {
                    renderUnexpectedList();
                }
                refreshActionButtons();
                // 通知外部（Vue）状态已更新
                EventBus.emit('game-state-updated');
                // 通知外部（Vue）日志已更新（由右侧 Vue 面板显示）
                EventBus.emit('logs-updated');
                this.checkVictory();
            });

        // 顶部行动按钮布局参数（水平排列）
        const topStartX = 300;
        const topY = 16;
        const topSpacing = 90;
        const bottomStartX = 60;
        const bottomY = this.camera.height - 50; // 960
        const bottomSpacing = 128;
        let panelX = 10, panelY = 10;

        // 行动按钮集合与刷新逻辑（根据 AP 启用/禁用）
        const actionButtons: { btn: Phaser.GameObjects.Text; cost: number; isEnabled?: () => boolean }[] = [];
        const consuptionActionButtons: { btn: Phaser.GameObjects.Text; cost: number; isEnabled?: () => boolean }[] = [];
        const baseBtnStyle = {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff',
            backgroundColor: '#1f6fb2',
            padding: { left: 10, right: 10, top: 6, bottom: 6 },
            stroke: '#0b2545',
            strokeThickness: 2,
            shadowOffsetX: 0,
            shadowOffsetY: 2,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowStroke: true,
            shadowFill: true,
        } as Phaser.Types.GameObjects.Text.TextStyle;
        const hoverColor = '#2d83d3';
        // 警示按钮主题样式（更醒目、偏警告色）
        const highlightBtnStyle = {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#ffffff',
            backgroundColor: '#b91c1c',
            padding: { left: 12, right: 12, top: 7, bottom: 7 },
            stroke: '#dc2626',
            strokeThickness: 3,
            shadowOffsetX: 0,
            shadowOffsetY: 3,
            shadowColor: '#000000',
            shadowBlur: 6,
            shadowStroke: true,
            shadowFill: true,
        } as Phaser.Types.GameObjects.Text.TextStyle;
        const highlightHoverColor = '#dc2626';
        const fascinateBtnStyle = {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff',
            backgroundColor: 'transparent',
            padding: { left: 4, right: 4, top: 4, bottom: 4 },
            stroke: '#0b2545',
            strokeThickness: 2,
            shadowOffsetX: 0,
            shadowOffsetY: 2,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowStroke: true,
            shadowFill: true,
        } as Phaser.Types.GameObjects.Text.TextStyle;
        const disabledStyle = {
            backgroundColor: '#454545',
            color: '#cccccc',
        } as Partial<Phaser.Types.GameObjects.Text.TextStyle>;
        const mkActionBtn = (label: string, cost: number, onClick: () => void, isEnabled?: () => boolean, btnsArray: {btn: Phaser.GameObjects.Text; cost: number; isEnabled?: () => boolean}[] = actionButtons) => {
            const btn = this.add.text(panelX, panelY, label, baseBtnStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    // 按压反馈
                    this.tweens.add({ targets: btn, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
                    const notEnoughAP = cost > 0 && gameState.ap < cost;
                    const disabledByRule = isEnabled ? !isEnabled() : false;
                    if (notEnoughAP || disabledByRule) {
                        this.tweens.add({ targets: btn, alpha: { from: 1, to: 0.5 }, yoyo: true, duration: 120 });
                        return;
                    }
                    onClick();
                })
                .on('pointerover', () => {
                    btn.setStyle({ backgroundColor: hoverColor });
                    this.tweens.add({ targets: btn, scale: 1.06, duration: 120, ease: 'Quad.easeOut' });
                })
                .on('pointerout', () => {
                    btn.setStyle({ backgroundColor: baseBtnStyle.backgroundColor as string });
                    this.tweens.add({ targets: btn, scale: 1.0, duration: 120, ease: 'Quad.easeOut' });
                });
            // 确保按钮层级高于列表文本
            btn.setDepth(20);
            panelY += 26;
            btnsArray.push({ btn, cost, isEnabled });
            return btn;
        };
        // 顶部水平布局版本（指定坐标，不改变右侧面板纵向布局）
        const mkActionBtnAt = (x: number, y: number, label: string, cost: number, onClick: () => void, isEnabled?: () => boolean, btnStyle: Phaser.Types.GameObjects.Text.TextStyle = baseBtnStyle, btnsArray: {btn: Phaser.GameObjects.Text; cost: number; isEnabled?: () => boolean}[] = actionButtons) => {
            const btn = this.add.text(x, y, label, btnStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    // 按压反馈
                    this.tweens.add({ targets: btn, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
                    const notEnoughAP = cost > 0 && gameState.ap < cost;
                    const disabledByRule = isEnabled ? !isEnabled() : false;
                    if (notEnoughAP || disabledByRule) {
                        this.tweens.add({ targets: btn, alpha: { from: 1, to: 0.5 }, yoyo: true, duration: 120 });
                        return;
                    }
                    onClick();
                })
                .on('pointerover', () => {
                    btn.setStyle({ backgroundColor: hoverColor });
                    this.tweens.add({ targets: btn, scale: 1.06, duration: 120, ease: 'Quad.easeOut' });
                })
                .on('pointerout', () => {
                    btn.setStyle({ backgroundColor: btnStyle.backgroundColor as string });
                    this.tweens.add({ targets: btn, scale: 1.0, duration: 120, ease: 'Quad.easeOut' });
                });
            btn.setDepth(20);
            btnsArray.push({ btn, cost, isEnabled });
            return btn;
        };
        const mkConsumptionActionBtnAt = (x: number, y: number, label: string, cost: number, onClick: () => void, isEnabled?: () => boolean, btnStyle: Phaser.Types.GameObjects.Text.TextStyle = baseBtnStyle, btnsArray: {btn: Phaser.GameObjects.Text; cost: number; isEnabled?: () => boolean}[] = actionButtons) => {
            const btn = this.add.text(x, y, label, btnStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    // 按压反馈
                    this.tweens.add({ targets: btn, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
                    const notEnoughAP = cost > 0 && gameState.ap < cost;
                    const disabledByRule = isEnabled ? !isEnabled() : false;
                    if (notEnoughAP || disabledByRule) {
                        this.tweens.add({ targets: btn, alpha: { from: 1, to: 0.5 }, yoyo: true, duration: 120 });
                        return;
                    }
                    onClick();
                });
            btn.setDepth(20);
            btnsArray.push({ btn, cost, isEnabled });
            return btn;
        };
        const mkHighlightActionBtnAt = (x: number, y: number, label: string, cost: number, onClick: () => void, isEnabled?: () => boolean) => {
            const warnLabel = `⚠ ${label}`;
            // 将按钮、背景、图标放入容器，统一缩放，避免边框错位
            const group = this.add.container(x, y).setDepth(20);
            const btn = this.add.text(0, 0, warnLabel, highlightBtnStyle);
            const warnBg = this.add.rectangle(-6, -4, btn.width + 12, btn.height + 8, 0xfff3cd, 0.35)
                .setOrigin(0, 0)
                .setStrokeStyle(2, 0xf59e0b);
            const warnIcon = this.add.text(btn.width / 2, -12, '⚠', {
                fontFamily: 'Arial Black',
                fontSize: 18,
                color: '#f59e0b',
                stroke: '#3b0d0c',
                strokeThickness: 3,
            }).setOrigin(0.5, 1);
            group.add([warnBg, btn, warnIcon]);
            const disabledByRule = isEnabled ? !isEnabled() : false;
            // 脉冲动画吸引注意
            if(!disabledByRule) {
                this.tweens.add({ targets: warnBg, alpha: { from: 0.35, to: 0.7 }, yoyo: true, duration: 680, repeat: -1, ease: 'Sine.easeInOut' });
                this.tweens.add({ targets: warnIcon, y: { from: -12, to: -16 }, yoyo: true, duration: 520, repeat: -1, ease: 'Sine.easeInOut' });
            }

            // 交互挂在容器上，缩放容器以保证边框随之变化
            group.setSize(btn.width + 12, btn.height + 8);
            group.setInteractive(new Phaser.Geom.Rectangle(-6, -4, btn.width + 12, btn.height + 8), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => {
                // // 按压反馈：缩放容器
                // this.tweens.add({ targets: group, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
                // const notEnoughAP = cost > 0 && gameState.ap < cost;
                // if (notEnoughAP || disabledByRule) {
                //     this.tweens.add({ targets: group, alpha: { from: 1, to: 0.6 }, yoyo: true, duration: 120 });
                //     return;
                // }
                // onClick();
                handleHighlightBtcClick(group, cost, disabledByRule, onClick);
            }).on('pointerover', () => {
                this.tweens.add({ targets: group, scale: 1.08, duration: 120, ease: 'Quad.easeOut' });
            }).on('pointerout', () => {
                this.tweens.add({ targets: group, scale: 1.0, duration: 120, ease: 'Quad.easeOut' });
            });

            // 同时在文本层挂悬停样式，确保事件可被触发
            btn.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    btn.setStyle({ backgroundColor: highlightHoverColor });
                    this.tweens.add({ targets: group, scale: 1.08, duration: 120, ease: 'Quad.easeOut' });
                })
                .on('pointerout', () => {
                    btn.setStyle({ backgroundColor: highlightBtnStyle.backgroundColor as string });
                    this.tweens.add({ targets: group, scale: 1.0, duration: 120, ease: 'Quad.easeOut' });
                })
                .on('pointerdown', () => {
                    // // 文本层点击同样触发与容器一致的反馈与判断
                    // this.tweens.add({ targets: group, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
                    // const notEnoughAP = cost > 0 && gameState.ap < cost;
                    // //const disabledByRule = isEnabled ? !isEnabled() : false; // 运行时重新判断规则
                    // if (notEnoughAP || disabledByRule) {
                    //     this.tweens.add({ targets: group, alpha: { from: 1, to: 0.6 }, yoyo: true, duration: 120 });
                    //     return;
                    // }
                    // onClick();
                    handleHighlightBtcClick(group, cost, disabledByRule, onClick);
                });

            // 标记与引用，刷新逻辑可访问
            btn.setData('isHighlight', true);
            btn.setData('warnBg', warnBg);
            btn.setData('warnIcon', warnIcon);
            btn.setData('warnGroup', group);

            actionButtons.push({ btn, cost, isEnabled });
            return btn;
        };
        const handleHighlightBtcClick = (targets: Phaser.GameObjects.Container, cost: number, disabledByRule: boolean, onClick: () => void) => {
            // 按压反馈：缩放容器
            this.tweens.add({ targets: targets, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
            const notEnoughAP = cost > 0 && gameState.ap < cost;
            if (notEnoughAP || disabledByRule) {
                this.tweens.add({ targets: targets, alpha: { from: 1, to: 0.6 }, yoyo: true, duration: 120 });
                return;
            }
            onClick();
        };
        const refreshActionButtons = () => {//btnStyle: Phaser.Types.GameObjects.Text.TextStyle = baseBtnStyle
            actionButtons.forEach(({ btn, cost, isEnabled }) => {
                const enoughAP = cost === 0 || gameState.ap >= cost;
                const allowedByRule = isEnabled ? isEnabled() : true;
                const isHighlight = !!btn.getData('isHighlight');
                const warnBg = btn.getData('warnBg') as Phaser.GameObjects.Rectangle | undefined;
                const warnIcon = btn.getData('warnIcon') as Phaser.GameObjects.Text | undefined;
                if (enoughAP && allowedByRule) {
                    btn.setAlpha(1);
                    btn.setStyle(isHighlight
                        ? { backgroundColor: highlightBtnStyle.backgroundColor as string, color: highlightBtnStyle.color as string }
                        : { backgroundColor: baseBtnStyle.backgroundColor as string, color: baseBtnStyle.color as string });
                    btn.setInteractive({ useHandCursor: true });
                    const group = btn.getData('warnGroup') as Phaser.GameObjects.Container | undefined;
                    group?.setInteractive(new Phaser.Geom.Rectangle(0, 0, btn.width, btn.height), Phaser.Geom.Rectangle.Contains);
                    group?.setAlpha(1);
                    if (warnBg) warnBg.setAlpha(0.5);
                    if (warnIcon) warnIcon.setAlpha(1);
                } else {
                    btn.setAlpha(0.45);
                    btn.setStyle(disabledStyle);
                    btn.disableInteractive();
                    const group = btn.getData('warnGroup') as Phaser.GameObjects.Container | undefined;
                    group?.disableInteractive();
                    group?.setAlpha(0.85);
                    if (warnBg) warnBg.setAlpha(0.25);
                    if (warnIcon) warnIcon.setAlpha(0.5);
                }
            });
            consuptionActionButtons.forEach(({ btn, cost, isEnabled }) => {
                const enoughAP = cost === 0 || gameState.ap >= cost;
                const allowedByRule = isEnabled ? isEnabled() : true;
                const isHighlight = !!btn.getData('isHighlight');
                const warnBg = btn.getData('warnBg') as Phaser.GameObjects.Rectangle | undefined;
                const warnIcon = btn.getData('warnIcon') as Phaser.GameObjects.Text | undefined;
                if (enoughAP && allowedByRule) {
                    btn.setAlpha(1);
                    btn.setStyle(isHighlight
                        ? { backgroundColor: highlightBtnStyle.backgroundColor as string, color: highlightBtnStyle.color as string }
                        : { backgroundColor: fascinateBtnStyle.backgroundColor as string, color: fascinateBtnStyle.color as string });
                    btn.setInteractive({ useHandCursor: true });
                    const group = btn.getData('warnGroup') as Phaser.GameObjects.Container | undefined;
                    group?.setInteractive(new Phaser.Geom.Rectangle(0, 0, btn.width, btn.height), Phaser.Geom.Rectangle.Contains);
                    group?.setAlpha(1);
                    if (warnBg) warnBg.setAlpha(0.5);
                    if (warnIcon) warnIcon.setAlpha(1);
                } else {
                    btn.setAlpha(0.45);
                    btn.setStyle(disabledStyle);
                    btn.disableInteractive();
                    const group = btn.getData('warnGroup') as Phaser.GameObjects.Container | undefined;
                    group?.disableInteractive();
                    group?.setAlpha(0.85);
                    if (warnBg) warnBg.setAlpha(0.25);
                    if (warnIcon) warnIcon.setAlpha(0.5);
                }
            });
        };

        // 金额对话框（滑条选择）：用于储蓄/投资
        const openAmountDialog = (title: string, onConfirm: (amount: number) => boolean) => {
            const minVal = 10;
            const halfWallet = Math.floor(gameState.accounts.wallet * 0.5);
            const maxVal = Math.max(minVal, halfWallet);
            let current = Math.max(minVal, Math.min(100, maxVal));

            // 遮罩与面板
            const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.55).setDepth(200);
            const panel = this.add.rectangle(512, 360, 440, 190, 0x0e1a2b, 0.95)
                .setStrokeStyle(2, 0x88aaff, 0.8).setDepth(210);
            const titleText = this.add.text(512, 300, `${title}金额`, {
                fontFamily: 'Arial', fontSize: 20, color: '#ffffff'
            }).setOrigin(0.5).setDepth(220);
            const rangeText = this.add.text(512, 324, `范围：$${minVal} - $${maxVal}`, {
                fontFamily: 'Arial', fontSize: 14, color: '#bde'
            }).setOrigin(0.5).setDepth(220);
            const valueText = this.add.text(512, 346, `金额：$${current}`, {
                fontFamily: 'Arial', fontSize: 18, color: '#ffffff'
            }).setOrigin(0.5).setDepth(220);

            // 滑条
            const trackW = 300;
            const trackX = 512, trackY = 370;
            const track = this.add.rectangle(trackX, trackY, trackW, 6, 0xaaaaaa).setDepth(220).setOrigin(0.5);
            const left = trackX - trackW / 2;
            const right = trackX + trackW / 2;
            const toX = (val: number) => left + ((val - minVal) / (maxVal - minVal)) * trackW;
            const handle = this.add.circle(toX(current), trackY, 8, 0x00aaff).setDepth(230).setInteractive({ useHandCursor: true });
            // 拖拽
            this.input.setDraggable(handle);
            const updateByX = (dragX: number) => {
                const x = Math.max(left, Math.min(right, dragX));
                handle.setPosition(x, trackY);
                const ratio = (x - left) / trackW;
                const val = Math.round(minVal + ratio * (maxVal - minVal));
                current = val;
                valueText.setText(`金额：$${current}`);
            };
            this.input.on('drag', (pointer: Phaser.Input.Pointer, obj: any, dragX: number, dragY: number) => {
                if (obj !== handle) return;
                updateByX(dragX);
            });
            track.setInteractive({ useHandCursor: true }).on('pointerdown', (p: Phaser.Input.Pointer) => {
                updateByX(p.x);
            });

            // 确认 / 取消
            const okBtn = this.add.text(472, 402, '确认', { fontFamily: 'Arial', fontSize: 18, color: '#ffffff', backgroundColor: '#0a7', padding: { left: 12, right: 12, top: 6, bottom: 6 } })
                .setDepth(230).setInteractive({ useHandCursor: true });
            const cancelBtn = this.add.text(552, 402, '取消', { fontFamily: 'Arial', fontSize: 18, color: '#ffffff', backgroundColor: '#a22', padding: { left: 12, right: 12, top: 6, bottom: 6 } })
                .setDepth(230).setInteractive({ useHandCursor: true });
            const destroyDialog = () => {
                overlay.destroy(); panel.destroy(); titleText.destroy(); rangeText.destroy(); valueText.destroy(); track.destroy(); handle.destroy(); okBtn.destroy(); cancelBtn.destroy();
                // 移除拖拽监听避免多次累积
                this.input.off('drag');
            };
            okBtn.on('pointerdown', () => {
                const ok = onConfirm(current);
                if (ok) {
                    destroyDialog();
                } else {
                    // 确认失败：轻微反馈
                    this.tweens.add({ targets: [panel], alpha: { from: 0.95, to: 0.6 }, yoyo: true, duration: 160 });
                }
            });
            cancelBtn.on('pointerdown', () => { destroyDialog(); });
        };

        // 顶部水平排列：储蓄、投资、学习、兼职、应急基金存入
        // 顶部动作按钮：收拢到一个带边框与背景色的长条容器中
        const bSavings = mkActionBtnAt(topStartX + topSpacing * 0, topY, '💰储蓄', 1, () => {
            openAmountDialog('储蓄', (amt) => {
                const ok = depositToSavings(amt);
                if (ok) {
                    refreshActionButtons();
                    EventBus.emit('game-state-updated');
                    // this.checkVictory(); // 只在【结束本月】的时候检查是否通关
                }
                return ok;
            });
        });
        const bInvest = mkActionBtnAt(topStartX + topSpacing * 1, topY, '📉投资📈', 1, () => {
            openAmountDialog('投资', (amt) => {
                const ok = invest(amt);
                if (ok) {
                    refreshActionButtons();
                    EventBus.emit('game-state-updated');
                    // this.checkVictory(); // 只在【结束本月】的时候检查是否通关
                }
                return ok;
            });
        });
        const bStudy = mkActionBtnAt(topStartX + topSpacing * 2 + 15, topY, '📚学习', 2, () => {
            if (study()) {
                refreshActionButtons();
                EventBus.emit('game-state-updated');
            }
        });
        const bPartTime = mkActionBtnAt(topStartX + topSpacing * 3 + 15, topY, '👷‍♂️兼职', 2, () => {
            const earn = partTime();
            if (earn) {
                refreshActionButtons();
                EventBus.emit('game-state-updated');
            }
        });
        const bEmergency = mkActionBtnAt(topStartX + topSpacing * 4 + 15, topY, '🚨应急基金存入', 1, () => {
            openAmountDialog('应急基金存入', (amt) => {
                const ok = depositEmergency(amt);
                if (ok) {
                    refreshActionButtons();
                    EventBus.emit('game-state-updated');
                }
                return ok;
            });
        });

        // 计算包裹区域（基于按钮的外接矩形）
        const btns = [bSavings, bInvest, bStudy, bPartTime, bEmergency].filter(Boolean) as Phaser.GameObjects.Text[];
        const {strip: topStrip, stripBg: stripBg, offsetX, offsetY} = this.computeGroupContainer(btns);
        btns.forEach(b => {
            b.setPosition(b.x - offsetX, b.y - offsetY);
        });
        topStrip.add([stripBg, ...btns]);
        topStrip.setDepth(38); // 在普通元素之上，但低于主CTA（结束本月，40）

        // 底部的N个消费按钮
        consumptionActions.forEach((ca, i) => {
            // 消费按钮消耗0AP
            const cbtn = mkConsumptionActionBtnAt(bottomStartX + bottomSpacing * i, bottomY, ca.text, 0, () => { this.handleConsumption(ca); }, undefined, fascinateBtnStyle, consuptionActionButtons);
            // 记录消费成本用于可用性与悬停控制
            cbtn.setData('consCost', ca.cost);
            this.consumptionBtns.push(cbtn);
        });
        const cbtns: Phaser.GameObjects.Text[] = this.consumptionBtns;
        // 将消费按钮放入一个长条容器（边框 + 背景），并为每个按钮增加彩色底板与脉冲效果
        if (cbtns.length > 0) {
            const {strip: bottomStrip, stripBg: stripBg2, offsetX, offsetY} = this.computeGroupContainer(cbtns,
                parseInt("D1CFD1", 16), parseInt("D1CFD1", 16));

            // 消费按钮的彩色底板与脉冲效果
            const palette: number[] = this.fascinatePalette;
            const hoverPalette: number[] = this.fascinateHoverPalette;
            const groups: Phaser.GameObjects.Container[] = [];

            cbtns.forEach((btn, i) => {
                const col = palette[i % palette.length];
                const hcol = hoverPalette[i % hoverPalette.length];
                // 为每个按钮创建一个独立容器，添加彩色圆角底板
                const grpX = btn.x - offsetX - 6;
                const grpY = btn.y - offsetY - 4;
                const grp = this.add.container(grpX, grpY);
                const bg = this.add.rectangle(0, 0, btn.width + 12, btn.height + 8, col, 0.18)
                    .setOrigin(0, 0)
                    .setStrokeStyle(2, col, 0.9);

                // 将文本移动到容器内的相对坐标
                btn.setPosition(6, 4);
                grp.add([bg, btn]);
                grp.setDepth(36);

                // 轻微脉冲动画，吸引点击；默认运行，在禁用时暂停
                const pulse = this.tweens.add({ targets: grp, scale: { from: 1.0, to: 1.035 }, yoyo: true, duration: 900, repeat: -1, ease: 'Sine.easeInOut' });

                // 悬停高亮与按压反馈（根据可用性决定是否触发）
                btn
                .on('pointerdown', () => {
                    const cost = (btn.getData('consCost') as number) ?? 0;
                    const disabled = !(gameState.ap > 0 && gameState.accounts.wallet >= cost);
                    // 按压反馈（禁用时轻微闪烁，不缩放）
                    if (disabled) {
                        this.tweens.add({ targets: grp, alpha: { from: grp.alpha, to: 0.75 }, yoyo: true, duration: 100 });
                    } else {
                        this.tweens.add({ targets: grp, scale: 0.95, yoyo: true, duration: 90, ease: 'Quad.easeOut' });
                    }
                })
                .on('pointerover', () => {
                    btn.setStyle({ backgroundColor: `#${hcol.toString(16)}` }); //hoverColor
                    //this.tweens.add({ targets: btn, scale: 1.06, duration: 120, ease: 'Quad.easeOut' });
                })
                .on('pointerout', () => {
                    btn.setStyle({ backgroundColor: fascinateBtnStyle.backgroundColor as string });
                    //this.tweens.add({ targets: btn, scale: 1.0, duration: 120, ease: 'Quad.easeOut' });
                });

                // 存储引用，供刷新函数控制
                btn.setData('consGroup', grp);
                btn.setData('consBg', bg);
                btn.setData('consPulse', pulse);
                btn.setData('consColor', col);
                btn.setData('consHoverColor', hcol);
                groups.push(grp);
            });

            bottomStrip.add([stripBg2, ...groups]);
            bottomStrip.setDepth(36);
        }

        const neX = 10, neY = 10;
        let payBtn: Phaser.GameObjects.Text = mkHighlightActionBtnAt(neX, neY, '支付必要支出*', 1, () => {
            if (payFirstNecessaryExpense()) {
                renderNecessaryList();
                EventBus.emit('game-state-updated');
            }
        }, () => gameState.events.some(e => e.type === 'necessary' && !e.paid));
        const renderNecessaryList = () => {
            this.necessaryList.forEach(t => t.destroy());
            this.necessaryList.length = 0;
            // 按钮固定在上方，信息列表在按钮下方
            const payGroup = payBtn.getData('warnGroup') as Phaser.GameObjects.Container | undefined;
            if (payGroup) {
                payGroup.setPosition(neX, neY);
                payGroup.setDepth(30);
            } else {
                payBtn.setPosition(neX, neY);
                payBtn.setDepth(30);
            }
            let y = neY + payBtn.height + 4;
            gameState.events.forEach((e) => {
                const label = `${e.name} $${e.cost} ${e.paid ? '（已付）' : ''}`;
                const t = this.add.text(neX, y, label, { fontFamily: 'Arial', fontSize: 14, color: '#eee' });
                // 列表文本层级低于按钮，避免遮挡
                t.setDepth(10);
                this.necessaryList.push(t);
                y += 20;
            });
            // 列表变化后刷新支付按钮可用性
            refreshActionButtons();
            return y;
        };

        // 首次渲染必要支出列表（确保在按钮之后，以免被按钮覆盖）
        const lastY = renderNecessaryList();
        const ueX = 880, ueY = 10;
        // 意外事件列表与处理按钮（按钮在上，信息在下）
        let resolveUnexpectedBtn: Phaser.GameObjects.Text = mkHighlightActionBtnAt(ueX, ueY, '处理意外*', 1, () => {
            if (resolveFirstUnexpected()) {
                renderUnexpectedList();
                EventBus.emit('game-state-updated');
            }
        }, () => {
            const idx = gameState.unexpected.findIndex(e => !e.resolved);
            if (idx === -1) return false;
            const ev = gameState.unexpected[idx];
            return gameState.accounts.emergencyFund >= ev.cost || gameState.accounts.wallet >= ev.cost;
        });
        {
            const unGroup = resolveUnexpectedBtn.getData('warnGroup') as Phaser.GameObjects.Container | undefined;
            if (unGroup) {
                unGroup.setDepth(30);
            } else {
                resolveUnexpectedBtn.setDepth(30);
            }
        }
        let unexpectedY = ueY + resolveUnexpectedBtn.height + 4;
        const renderUnexpectedList = () => {
            this.unexpectedList.forEach(t => t.destroy());
            this.unexpectedList.length = 0;
            let y = unexpectedY;
            gameState.unexpected.forEach((e) => {
                const src = e.source === 'emergency' ? '应急' : e.source === 'wallet' ? '钱包' : e.source === 'mood' ? '心情' : '';
                const label = `${e.name} $${e.cost} ${e.resolved ? `（已处理${src ? ' - ' + src : ''}）` : ''}`;
                const t = this.add.text(ueX, y, label, { fontFamily: 'Arial', fontSize: 14, color: '#eee' });
                // 列表文本层级低于按钮，避免遮挡
                t.setDepth(10);
                this.unexpectedList.push(t);
                y += 20;
            });
            refreshActionButtons();
        };

        renderUnexpectedList();

        // 初始刷新按钮状态（确保在必要支出为空时禁用支付按钮）
        refreshActionButtons();

        // 初始化并订阅状态更新，确保消费按钮脉冲与可用性随钱包/AP变化
        this.refreshConsumptionBtns();
        EventBus.on('game-state-updated', () => {
            this.refreshConsumptionBtns();
            // this.checkVictory(); // 只在【结束本月】的时候检查是否通关
        });

        // 日志面板由右侧 Vue 组件负责显示
        EventBus.emit('current-scene-ready', this);

        this.installHero();
    }

    private computeGroupContainer(btns: Phaser.GameObjects.Text[], bgColor: number = 0x15496b, borderColor: number = 0x1976d2){
        const left = Math.min(...btns.map(b => b.x));
        const right = Math.max(...btns.map(b => b.x + b.width));
        const top = Math.min(...btns.map(b => b.y));
        const bottom = Math.max(...btns.map(b => b.y + b.height));
        const paddingX = 16;
        const paddingY = 10;
        const stripWidth = right - left + paddingX * 2;
        const stripHeight = bottom - top + paddingY * 2;

        // 创建容器与背景（长条、圆角、边框）
        const strip = this.add.container(left - paddingX, top - paddingY);
        const stripBg = this.add.graphics();
        stripBg.fillStyle(bgColor, 0.12); // 背景色（轻微）
        stripBg.lineStyle(2, borderColor, 0.9); // 边框色
        //stripBg.lineGradientStyle(0, 0, stripWidth, 0, 0x1976d2, 0x1976d2);
        stripBg.fillRoundedRect(0, 0, stripWidth, stripHeight, 10);
        stripBg.strokeRoundedRect(0, 0, stripWidth, stripHeight, 10);
        // 将按钮坐标转换为容器内的相对坐标
        const offsetX = left - paddingX;
        const offsetY = top - paddingY;

        return {strip, stripBg, offsetX, offsetY};
    }

    // 生成并复用径向软边遮罩（256x256）：圆内 r=120 不透明，至 r=128 渐隐为透明
    private ensureRadialMaskTexture(): string {
        const key = 'mask_circle_256_r120_soft8';
        if (this.textures.exists(key)) return key;

        const size = 256;
        const cx = size / 2, cy = size / 2;
        const inner = 120;  // 清晰半径
        const outer = 130;  // 软边到透明半径（软边宽度 8 像素）

        const tex = this.textures.createCanvas(key, size, size);
        const ctx = tex?.context as CanvasRenderingContext2D;

        const grd = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, size, size);
        tex?.refresh();

        return key;
    }

    // 生成环形柔光纹理：中心透明、在建筑边缘处有柔和白色光晕、外缘再过渡为透明
    private ensureRingGlowTexture(): string {
        const key = 'ring_glow_256_r118_130_soft';
        if (this.textures.exists(key)) return key;

        const size = 256;
        const cx = size / 2, cy = size / 2;
        const inner = 118;  // 光环开始半径（内缘透明）
        const outer = 130;  // 光环结束半径（外缘透明）

        const tex = this.textures.createCanvas(key, size, size);
        const ctx = tex?.context as CanvasRenderingContext2D;

        // 使用多段色标制造更柔的边缘，仅在环区域高亮
        const grd = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
        grd.addColorStop(0.00, 'rgba(255,255,255,0)');
        grd.addColorStop(0.06, 'rgba(255,255,255,0.85)');
        grd.addColorStop(0.35, 'rgba(255,255,255,0.40)');
        grd.addColorStop(0.70, 'rgba(255,255,255,0.18)');
        grd.addColorStop(1.00, 'rgba(255,255,255,0)');

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, size, size);
        tex?.refresh();

        return key;
    }

    // 绘制地图（3x3 网格，每个建筑 256x256 像素，间距 32 像素）
    private drawMap() {
        {
            const tileSize = 256;
            const grid = 3;
            const sceneSize = 1024;
            const gap = 48; // 适当的间距，保证布局更清晰
            const totalSize = grid * tileSize + (grid - 1) * gap;
            const margin = (sceneSize - totalSize) / 2; // 居中留白
            const yOffset = -32; // 上移整体位置，抵消视觉偏下的偏差
            const centerStartX = margin + tileSize / 2;
            const centerStartY = margin + tileSize / 2 + yOffset;
            const maskKey = this.ensureRadialMaskTexture();
            this.geoItems.forEach((b, i) => {
                // const row = Math.floor(i / grid);
                // const col = i % grid;
                // b.centerX = centerStartX + col * (tileSize + gap);
                // b.centerY = centerStartY + row * (tileSize + gap);
                
                const img = this.add.image(b.centerX, b.centerY, b.key);
                img.setDepth(5);
                // 设置唯一名称，便于通过 getByName 获取并高亮
                img.setName(b.key);
                // 应用软边圆形遮罩，实现圆外淡出
                const maskSprite = this.add.image(b.centerX, b.centerY, maskKey).setVisible(false);
                const mask = new Phaser.Display.Masks.BitmapMask(this, maskSprite);
                img.setMask(mask);

                // 在图片下方绘制名称，水平居中
                const labelYOffset = tileSize / 2 + 10; // 位于图片底部下方 10 像素
                const label = this.add.text(b.centerX, b.centerY + labelYOffset, b.name, {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3,
                }).setOrigin(0.5);
                label.setDepth(6);
            });
        }
    }

    private handleConsumption(action: ConsumptionAction) {
        this.pauseMoving = true;
        this.hero.stop();
        consumeCash(action.cost, action.happyPoints);
        const geoItem = this.geoItems.find(b => b.key === action.buildingKey);
        if(geoItem){
            this.highlightGeoItem(geoItem);
            
            const msg = action.random[Math.floor(Math.random() * action.random.length)];
            const newPos = geoItem.postions[Math.floor(Math.random() * geoItem.postions.length)];
            this.placeHeroAt(newPos.x, newPos.y, msg, 3000);
        }
        EventBus.emit('game-state-updated');
        this.refreshConsumptionBtns();
    }

    private highlightGeoItem(geoItem: IGeoItem) {
        if (geoItem) {
            const img = this.children.getByName(geoItem.key) as Phaser.GameObjects.Image;
            if (img) {
                // 清除可能存在的旧色调
                img.clearTint();

                // 使用环形柔光纹理，避免出现可见的同心圆线条
                const ringKey = this.ensureRingGlowTexture();
                const glow = this.add.image(geoItem.centerX, geoItem.centerY, ringKey);
                glow.setDepth(5.5); // 位于建筑之上、标签之下
                glow.setBlendMode(Phaser.BlendModes.ADD);
                glow.setAlpha(0.0);

                const tween = this.tweens.add({
                    targets: glow,
                    alpha: { from: 0.20, to: 0.65 },
                    yoyo: true,
                    duration: 420,
                    repeat: 6,
                });

                // 3 秒后销毁叠加层
                this.time.delayedCall(3000, () => {
                    tween.remove();
                    glow.destroy();
                });
            }
        }
    }

    private showMessageOnGeoItem(geoItem: IGeoItem, msg: string) {
        if (geoItem) {
            // 创建消息容器
            const messageContainer = this.add.container(geoItem.centerX, geoItem.centerY - 30);
            
            // 创建文本对象来测量尺寸
            const tempText = this.add.text(0, 0, msg, {
                fontFamily: 'Arial',
                fontSize: 14,
                color: '#ffffff'
            }).setOrigin(0.5);
            
            // 获取文本尺寸
            const textWidth = tempText.width;
            const textHeight = tempText.height;
            
            // 计算气泡尺寸（添加内边距）
            const bubbleWidth = textWidth + 20;
            const bubbleHeight = textHeight + 12;
            
            // 创建气泡背景
            const bubble = this.add.graphics();
            
            // 绘制圆角矩形气泡
            bubble.fillStyle(0xFF4500, 0.9); // 热情的橙红色背景，90%透明度
            bubble.fillRoundedRect(-bubbleWidth/2, -bubbleHeight/2, bubbleWidth, bubbleHeight, 8);
            
            bubble.lineStyle(2, 0xFFFFFF, 1); // 白色边框，2像素宽度
            bubble.strokeRoundedRect(-bubbleWidth/2, -bubbleHeight/2, bubbleWidth, bubbleHeight, 8);
            
            // 绘制气泡尖角（指向地理项目）
            const triangleSize = 6;
            bubble.fillStyle(0xFF4500, 0.9); // 重新设置填充样式为橙红色
            bubble.fillTriangle(
                -triangleSize, bubbleHeight/2,
                triangleSize, bubbleHeight/2,
                0, bubbleHeight/2 + triangleSize
            );
            
            bubble.lineStyle(2, 0xffffff, 1); // 重新设置线条样式
            bubble.strokeTriangle(
                -triangleSize, bubbleHeight/2,
                triangleSize, bubbleHeight/2,
                0, bubbleHeight/2 + triangleSize
            );
            
            // 重新创建文本对象（销毁临时的）
            tempText.destroy();
            const msgText = this.add.text(0, 0, msg, {
                fontFamily: 'Arial',
                fontSize: 14,
                color: '#ffffff'
            }).setOrigin(0.5);
            
            // 将气泡和文本添加到容器
            messageContainer.add([bubble, msgText]);
            messageContainer.setDepth(10);
            
            // 添加淡入动画
            messageContainer.setAlpha(0);
            this.tweens.add({
                targets: messageContainer,
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
            
            // 2.5-3.8 秒后淡出并移除消息
            const randomDelay = Phaser.Math.Between(2600, 3800);
            this.time.delayedCall(randomDelay, () => {
                this.tweens.add({
                    targets: messageContainer,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        messageContainer.destroy();
                    }
                });
            });
        }
    }

    private showAdsByPos(posX: number, posY: number) {
        const items = this.geoItems.filter(b => b.postions.some(p => p.x === posX && p.y === posY));
        if(items && items.length > 0){
            items.forEach(item => {
                const ads = LocaleUtils.getItemsByLangCode(item.advertising, Settings.locale.code);
                const ad = ads[Math.floor(Math.random() * ads.length)];
                this.showMessageOnGeoItem(item, ad);
            });
        }
    }

    private showMessageOnHero(msg: string) {
        if (!this.hero) return;

        // 清理已过期的气泡
        this.cleanupExpiredBubbles();

        // 创建气泡容器
        const bubbleContainer = this.add.container(this.hero.x, this.hero.y);
        bubbleContainer.setDepth(100); // 确保气泡在最上层

        // 计算气泡的垂直偏移量（避免重叠）
        const baseOffsetY = -40; // 基础偏移量
        const bubbleSpacing = 25; // 气泡间距
        const offsetY = baseOffsetY - (this.activeBubbles.length * bubbleSpacing);

        // 创建气泡背景（圆角矩形）
        const padding = 8;
        const textStyle = {
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#333333',
            wordWrap: { width: 200 }
        };
        
        // 先创建文本以获取尺寸
        const tempText = this.add.text(0, 0, msg, textStyle);
        const textWidth = tempText.width;
        const textHeight = tempText.height;
        tempText.destroy();

        // 创建气泡背景
        const bubbleWidth = textWidth + padding * 2;
        const bubbleHeight = textHeight + padding * 2;
        
        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 0.95);
        bubble.lineStyle(2, 0x666666, 0.8);
        bubble.fillRoundedRect(-bubbleWidth/2, offsetY - bubbleHeight/2, bubbleWidth, bubbleHeight, 8);
        bubble.strokeRoundedRect(-bubbleWidth/2, offsetY - bubbleHeight/2, bubbleWidth, bubbleHeight, 8);

        // 创建气泡尾巴（指向角色）
        const tailSize = 8;
        bubble.fillStyle(0xffffff, 0.95);
        bubble.lineStyle(2, 0x666666, 0.8);
        bubble.beginPath();
        bubble.moveTo(-tailSize/2, offsetY + bubbleHeight/2);
        bubble.lineTo(0, offsetY + bubbleHeight/2 + tailSize);
        bubble.lineTo(tailSize/2, offsetY + bubbleHeight/2);
        bubble.closePath();
        bubble.fillPath();
        bubble.strokePath();

        // 创建文本
        const messageText = this.add.text(0, offsetY, msg, textStyle);
        messageText.setOrigin(0.5);

        // 将元素添加到容器
        bubbleContainer.add([bubble, messageText]);

        // 添加入场动画
        bubbleContainer.setAlpha(0);
        bubbleContainer.setScale(0.5);
        this.tweens.add({
            targets: bubbleContainer,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // 创建跟随更新定时器
        const followTimer = this.time.addEvent({
            delay: 16, // 约60FPS
            loop: true,
            callback: () => {
                if (this.hero && bubbleContainer.active) {
                    bubbleContainer.setPosition(this.hero.x, this.hero.y);
                }
            }
        });

        // 创建自动销毁定时器
        const destroyTimer = this.time.delayedCall(3000, () => {
            this.removeBubble(bubbleContainer, followTimer);
        });

        // 添加到活跃气泡列表
        this.activeBubbles.push({
            container: bubbleContainer,
            timer: followTimer,
            offsetY: offsetY
        });
    }

    // 清理已过期的气泡
    private cleanupExpiredBubbles() {
        this.activeBubbles = this.activeBubbles.filter(bubble => {
            if (!bubble.container.active) {
                bubble.timer.remove();
                return false;
            }
            return true;
        });
    }

    // 移除指定气泡
    private removeBubble(container: Phaser.GameObjects.Container, timer: Phaser.Time.TimerEvent) {
        // 添加退场动画
        this.tweens.add({
            targets: container,
            alpha: 0,
            scale: 0.5,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                container.destroy();
                timer.remove();
                
                // 从活跃列表中移除
                const index = this.activeBubbles.findIndex(b => b.container === container);
                if (index !== -1) {
                    this.activeBubbles.splice(index, 1);
                }
            }
        });
    }

    private refreshConsumptionBtns() {
        const cash = gameState.accounts.wallet;
        const ap = gameState.ap;
        this.consumptionBtns.forEach(btn => {
            const grp = btn.getData('consGroup') as Phaser.GameObjects.Container | undefined;
            const bg = btn.getData('consBg') as Phaser.GameObjects.Rectangle | undefined;
            const pulse = btn.getData('consPulse') as Phaser.Tweens.Tween | undefined;
            const baseCol = btn.getData('consColor') as number | undefined;
            const cost = (btn.getData('consCost') as number) ?? 0;
            const timer: Phaser.Time.TimerEvent | undefined = btn.getData('heartTimer');
            if (!grp || !bg || baseCol === undefined) return;
            const enabled = ap > 0 && cash >= cost;
            if (enabled) {
                btn.setAlpha(1);
                grp.setAlpha(1);
                bg.setFillStyle(baseCol, 0.18);
                pulse?.resume();
                // 当启用时，始终显示爱心冒泡效果
                if (!timer) {
                    const spawnHeart = () => {
                        // 允许在按钮外侧约 10 像素范围内生成
                        const localX = -10 + Math.random() * (btn.width + 20);
                        const localY = 4 + btn.height - 6;
                        const heart = this.add.text(localX, localY, '❤', {
                            fontFamily: 'Arial',
                            fontSize: 16,
                            color: `#${baseCol.toString(16)}`,
                        } as Phaser.Types.GameObjects.Text.TextStyle)
                        .setAlpha(0.95);
                        grp.add(heart);
                        this.tweens.add({
                            targets: heart,
                            // 上升到超出顶部约 10 像素
                            y: localY - (btn.height + 20 + Math.random() * 12),
                            scale: { from: 0.7, to: 1.5 },
                            alpha: { from: 0.95, to: 0 },
                            duration: 1500,
                            ease: 'Sine.easeOut',
                            onComplete: () => heart.destroy(),
                        });
                    };
                    // 立即生成一个，然后循环生成
                    spawnHeart();
                    const newTimer = this.time.addEvent({ delay: 220, loop: true, callback: spawnHeart });
                    btn.setData('heartTimer', newTimer);
                }
            } else {
                // 禁用态：降低透明度并暂停脉冲动画
                btn.setAlpha(0.6);
                grp.setAlpha(0.85);
                bg.setFillStyle(baseCol, 0.12);
                pulse?.pause();
                // 禁用时停止冒泡效果
                if (timer) {
                    timer.remove(false);
                    btn.setData('heartTimer', undefined);
                }
            }
        });
    }

    private findPath(posX: number, posY: number) {
        // 遍历 DefaultMap.paths 查找包含 posX, posY 的路径
        const paths = DefaultMap.paths ?? [];
        const filteredPaths = paths.filter(p => p.nodes.findIndex(n => n.x === posX && n.y === posY) !== -1);
        const p = filteredPaths[Math.floor(Math.random() * filteredPaths.length)];
        return p;
    }

    // 根据移动方向切换行走动画
    private setAnimationByDirection(dx: number, dy: number) {
        let anim = 'hero-walk-down';
        if (Math.abs(dx) >= Math.abs(dy)) {
            anim = dx >= 0 ? 'hero-walk-right' : 'hero-walk-left';
        } else {
            anim = dy >= 0 ? 'hero-walk-down' : 'hero-walk-up';
        }
        this.hero.play(anim);
        return anim;
    };

    private moveTo(targetX: number, targetY: number, movingCompleted?: () => void) {
        // 获取角色当前位置
        const currentX = this.hero.x;
        const currentY = this.hero.y;
        
        // 如果已经在目标位置，立即调用回调并返回
        if (currentX === targetX && currentY === targetY) {
            if (movingCompleted) {
                movingCompleted();
            }
            return [];
        }
        
        // 构建路径图：将所有路径节点连接成图
        const pathGraph = PathUtils.buildPathGraph(DefaultMap.paths);
        
        // 使用 A* 算法计算最短路径
        const path = PathUtils.findShortestPath(
            { x: currentX, y: currentY },
            { x: targetX, y: targetY },
            pathGraph
        );
        
        // 如果找到路径，沿路径移动到目标位置并停止
        if (path.length > 0) {
            this.moveHeroAlongPath(path, movingCompleted);
        } else if (movingCompleted) {
            // 如果没有找到路径，也要调用回调
            movingCompleted();
        }
    }

    /**
     * 沿指定路径移动角色到目标位置并停止
     */
    private moveHeroAlongPath(path: {x: number, y: number}[], movingCompleted?: () => void) {
        if (path.length === 0) {
            if (movingCompleted) {
                movingCompleted();
            }
            return;
        }
        
        let currentIndex = 0;
        
        const moveToNextNode = () => {
            if (currentIndex >= path.length) {
                // 到达路径终点，停止移动并切换到待机动画
                const currentAnim = this.hero.anims.currentAnim?.key || 'hero-walk-down';
                const idleAnim = currentAnim.replace('walk', 'idle');
                this.hero.play(idleAnim);
                
                // 调用移动完成回调
                if (movingCompleted) {
                    movingCompleted();
                }
                return;
            }
            
            const targetNode = path[currentIndex];
            const dx = targetNode.x - this.hero.x;
            const dy = targetNode.y - this.hero.y;
            
            // 设置行走动画并获取动画名称
            const walkAnim = this.setAnimationByDirection(dx, dy);
            
            // 移动到下一个节点
            this.tweens.add({
                targets: this.hero,
                x: targetNode.x,
                y: targetNode.y,
                duration: 1000,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    currentIndex++;
                    // 如果这是最后一个节点，切换到对应的待机动画并调用回调
                    if (currentIndex >= path.length) {
                        const idleAnim = walkAnim.replace('walk', 'idle');
                        this.hero.play(idleAnim);
                        
                        // 调用移动完成回调
                        if (movingCompleted) {
                            movingCompleted();
                        }
                    } else {
                        // 继续移动到下一个节点
                        moveToNextNode();
                    }
                }
            });
        };
        
        // 开始移动
        moveToNextNode();
    }

    private placeHeroAt(posX: number, posY: number, msg: string, stayInMilliseconds: number = 0) {
        // 使用回调机制，在移动完成后显示消息
        this.moveTo(posX, posY, () => {
            // 移动完成后显示消息
            this.showMessageOnHero(msg);
            
            if(stayInMilliseconds > 0) {
                // 等待指定的时间
                this.time.delayedCall(stayInMilliseconds, () => {
                    this.walkOnRandomPath(posX, posY);
                });
            }
            else this.walkOnRandomPath(posX, posY);
        });
    }

    private walkOnRandomPath(posX: number, posY: number) {
        const randomPath = this.findPath(posX, posY);
        if (randomPath) {
            this.pathNodes = randomPath.nodes;
            const posIndex = this.pathNodes.findIndex(n => n.x === posX && n.y === posY);
            this.isMovingForward = true;
            this.pauseMoving = false;
            this.moveHeroTo(posIndex + 1);
        }
    }

    private getNextIndex(currentIdx: number) {
        if (this.isMovingForward) {
            // 正向移动：到达最后一个点时切换为反向
            if (currentIdx === this.pathNodes.length - 1) {
                this.isMovingForward = false;
                return currentIdx - 1;
            }
            return currentIdx + 1;
        } else {
            // 反向移动：到达第一个点时切换为正向
            if (currentIdx === 0) {
                this.isMovingForward = true;
                return currentIdx + 1;
            }
            return currentIdx - 1;
        }
    };

    private moveHeroTo(targetIdx: number) {
        const to = this.pathNodes[targetIdx];
        const speed = 60; // px/s
        
        const idleFromWalk = (walkAnim: string) => walkAnim.replace('walk', 'idle');

        const dx = to.x - this.hero.x;
        const dy = to.y - this.hero.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const walkAnim = this.setAnimationByDirection(dx, dy);
        this.tweens.add({
            targets: this.hero,
            x: to.x,
            y: to.y,
            duration: Math.max(200, (dist / speed) * 1000),
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.hero.play(idleFromWalk(walkAnim));
                this.showAdsByPos(this.hero.x, this.hero.y);
                // 到达目标节点后，检查是否需要暂停移动
                if (this.pauseMoving) {
                    return;
                }
                
                // 计算下一个目标索引
                const nextIdx = this.getNextIndex(targetIdx);
                // 短暂停顿再继续前往下一个节点
                this.time.delayedCall(2600, () => this.moveHeroTo(nextIdx));
            }
        });
    }

    private installHero() {
        // 基于 DefaultMap.paths 的节点，驱动角色沿路径循环移动
        const paths = DefaultMap.paths ?? [];
        if (!paths.length) {
            // 无路径数据则回退到静态预览位置
            const w = this.scale.width;
            const h = this.scale.height;
            const cx = w / 2;
            const cy = h / 2;
            const fallback = this.add.sprite(cx - 220, cy + 120, 'heroAtlas', 'down_0');
            fallback.setScale(2);
            fallback.play('hero-walk-down');
            fallback.setDepth(90);
            return;
        }

        // 随机选择一条可用路径
        const pathDef = paths[Math.floor(Math.random() * paths.length)];
        this.pathNodes = pathDef.nodes ?? [];

        if (this.pathNodes.length < 2) {
            // 节点不足则回退
            const w = this.scale.width;
            const h = this.scale.height;
            const cx = w / 2;
            const cy = h / 2;
            const fallback = this.add.sprite(cx - 220, cy + 120, 'heroAtlas', 'down_0');
            fallback.setScale(2);
            fallback.play('hero-walk-down');
            fallback.setDepth(90);
            return;
        }

        // 角色初始放在第一个节点
        this.hero = this.add.sprite(this.pathNodes[0].x, this.pathNodes[0].y, 'heroAtlas', 'down_0');
        this.hero.setScale(2);
        this.hero.setDepth(90);

        // 从第二个节点开始移动（初始已在第一个节点）
        this.moveHeroTo(1);
    }

    checkVictory() {
        if (isVictoryAchieved()) {
            this.scene.start('VictoryReport');
        }
    };

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}

