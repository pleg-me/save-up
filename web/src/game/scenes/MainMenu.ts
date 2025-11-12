import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { initNewGame } from '../state/GameState';
import { Settings, switchLang } from '../data/Settings';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const w = this.scale.width;
        const h = this.scale.height;
        const cx = w / 2;
        const cy = h / 2;

        this.background = this.add.image(cx, cy, 'background');
        // Ensure background fits the current viewport size
        this.background.setDisplaySize(w, h);

        this.logo = this.add.image(cx, cy - 104, 'logo').setDepth(100);

        this.title = this.add.text(cx, cy + 36, Settings.locale.SubTitle, {
            fontFamily: 'Arial Black', fontSize: 36, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        const startText = this.add.text(cx, cy + 116, Settings.locale.Menu_NewGame, {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        startText.on('pointerdown', () => {
            initNewGame();
            this.changeScene();
        });

        const ttX = cx;
        const ttY = cy + 200;
        const trackW = 120;
        const trackH = 30;
        const handleR = 13;
        const track = this.add.rectangle(ttX, ttY, trackW, trackH, 0x345).setStrokeStyle(2, 0xffffff).setDepth(100).setRounded(5);
        const handle = this.add.circle(ttX - trackW / 2 + handleR + 2, ttY, handleR, 0xffffff).setDepth(101);
        // const langLabel = this.add.text(ttX, ttY - 28, Settings.locale.name, {
        //     fontFamily: 'Arial', fontSize: 18, color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 3,
        //     align: 'center'
        // }).setOrigin(0.5).setDepth(100);
        const leftLabel = this.add.text(ttX - trackW / 2 - 50, ttY, '简体中文', {
            fontFamily: 'Arial', fontSize: 16, color: '#ffffff',
            stroke: '#000000', strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        const rightLabel = this.add.text(ttX + trackW / 2 + 50, ttY, 'English', {
            fontFamily: 'Arial', fontSize: 16, color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        const toggleArea = this.add.zone(ttX, ttY, trackW, trackH).setInteractive({ useHandCursor: true });
        const updateToggle = () => {
            const isEn = Settings.lang === 'en';
            const targetX = isEn ? ttX + trackW / 2 - handleR - 2 : ttX - trackW / 2 + handleR + 2;
            this.tweens.add({ targets: handle, x: targetX, duration: 140, ease: 'Quad.easeOut' });
            track.setFillStyle(isEn ? 0x2d83d3 : 0x1f6fb2, 1);
            leftLabel.setStyle({ color: isEn ? '#aaaaaa' : '#ffffff' });
            rightLabel.setStyle({ color: isEn ? '#ffffff' : '#aaaaaa' });
            //langLabel.setText(Settings.locale.name);
            this.title.setText(Settings.locale.SubTitle);
            startText.setText(Settings.locale.Menu_NewGame);
        };
        updateToggle();
        toggleArea.on('pointerdown', () => {
            switchLang();
            updateToggle();
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            initNewGame();
            this.changeScene();
        });

        EventBus.emit('current-scene-ready', this);
    }
    
    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }
        this.scene.start('Game');
    }

}
