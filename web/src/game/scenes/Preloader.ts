import { Scene } from 'phaser';
import { Settings } from '../data/Settings';
import { DefaultMap } from '../data/DefaultMap';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 512, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', `logo_${Settings.locale.code}.png`);
        this.load.image('star', 'star.png');
        // 已移除 SVG 角色资源加载，角色改为运行时生成 PNG Atlas

        //  预加载建筑图片资源（键为建筑 key）
        DefaultMap.geoItems.forEach(b => {
            this.load.image(b.key, `geo_items/${b.key}.png`);
        });
        this.load.image('default_map', 'geo_items/default_map.png');
    }

    private prepareDefaultHero_SVG() {
        // 下（0,1,2）
        this.anims.create({ key: 'hero-walk-down', frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 2 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-down', frames: [{ key: 'hero', frame: 0 }] });
        // 左（3,4,5）
        this.anims.create({ key: 'hero-walk-left', frames: this.anims.generateFrameNumbers('hero', { start: 3, end: 5 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-left', frames: [{ key: 'hero', frame: 3 }] });
        // 右（6,7,8）
        this.anims.create({ key: 'hero-walk-right', frames: this.anims.generateFrameNumbers('hero', { start: 6, end: 8 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-right', frames: [{ key: 'hero', frame: 6 }] });
        // 上（9,10,11）
        this.anims.create({ key: 'hero-walk-up', frames: this.anims.generateFrameNumbers('hero', { start: 9, end: 11 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-up', frames: [{ key: 'hero', frame: 9 }] });
    }

    private buildHeroAtlas() {
        const frameWidth = 32, frameHeight = 32, cols = 3, rows = 4;
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth * cols;
        canvas.height = frameHeight * rows;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawFrame = (x: number, y: number, dir: 'down' | 'left' | 'right' | 'up', swing: 0 | 1 | 2) => {
            ctx.save();
            ctx.translate(x, y);

            // 清空当前帧区域，避免叠影
            ctx.clearRect(0, 0, frameWidth, frameHeight);

            // 基础配色
            const skin = '#f2c9a2';
            const hair = '#3b2f2f';
            const shirt = '#2d83d3';
            const pants = '#2e2e2e';
            const shoe = '#1a1a1a';

            // 阴影
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.beginPath();
            ctx.ellipse(16, 31, 8, 2.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // 头部（更小，清晰非方形）
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(16, 7, 5, 0, Math.PI * 2);
            ctx.fill();

            // 头发（上半圆覆盖）
            ctx.fillStyle = hair;
            ctx.beginPath();
            ctx.arc(16, 6.5, 6.2, Math.PI, 0);
            ctx.fill();

            // 眼睛
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(13, 8, 1, 1);
            ctx.fillRect(18, 8, 1, 1);

            // 嘴巴
            ctx.fillStyle = '#8b4a3b';
            ctx.fillRect(14, 11, 4, 1);

            // 身体（更窄）
            ctx.fillStyle = shirt;
            ctx.fillRect(12, 14, 8, 9);

            // 手臂摆动（更细）
            const armLShiftY = swing === 1 ? -1 : (swing === 2 ? 1 : 0);
            const armRShiftY = swing === 1 ? 1 : (swing === 2 ? -1 : 0);
            ctx.fillStyle = skin;
            ctx.fillRect(11, 16 + armLShiftY, 1, 6);
            ctx.fillRect(20, 16 + armRShiftY, 1, 6);

            // 裤子（更窄）
            ctx.fillStyle = pants;
            ctx.fillRect(12, 23, 8, 6);

            // 腿摆动（更细更短）
            const legLShiftX = swing === 1 ? -1 : 0;
            const legRShiftX = swing === 2 ? 1 : 0;
            ctx.fillRect(12 + legLShiftX, 24, 2, 5);
            ctx.fillRect(18 + legRShiftX, 24, 2, 5);

            // 鞋子（更短）
            ctx.fillStyle = shoe;
            ctx.fillRect(11 + legLShiftX, 29, 4, 2);
            ctx.fillRect(17 + legRShiftX, 29, 4, 2);

            // 方向提示（微调）
            if (dir === 'left') ctx.fillRect(12, 7, 1, 1);
            if (dir === 'right') ctx.fillRect(20, 7, 1, 1);
            if (dir === 'up') ctx.fillRect(13, 6, 6, 1);

            ctx.restore();
        };

        const dirs: Array<'down' | 'left' | 'right' | 'up'> = ['down', 'left', 'right', 'up'];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const swing = (c === 0 ? 0 : (c === 1 ? 1 : 2)) as 0 | 1 | 2;
                drawFrame(c * frameWidth, r * frameHeight, dirs[r], swing);
            }
        }

        // 使用 Phaser 内部 CanvasTexture，确保 WebGL 兼容
        const phTex = this.textures.createCanvas('heroSheet', canvas.width, canvas.height);
        const phCanvas = phTex?.getSourceImage() as HTMLCanvasElement;//HTMLCanvasElement
        const phCtx = phCanvas.getContext('2d');
        if (phCtx) {
            phCtx.clearRect(0, 0, phCanvas.width, phCanvas.height);
            phCtx.drawImage(canvas, 0, 0);
        }
        const source = phTex?.getSourceImage() as HTMLImageElement;// phCanvas;

        const frames: Record<string, any> = {};
        const prefix = ['down', 'left', 'right', 'up'];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const name = `${prefix[r]}_${c}`;
                frames[name] = {
                    frame: { x: c * frameWidth, y: r * frameHeight, w: frameWidth, h: frameHeight },
                    rotated: false,
                    trimmed: false,
                    spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
                    sourceSize: { w: frameWidth, h: frameHeight }
                };
            }
        }
        const atlasData = { frames, meta: { scale: '1' } } as any;
        this.textures.addAtlasJSONHash('heroAtlas', source, atlasData);

        // animations
        this.anims.create({ key: 'hero-walk-down', frames: this.anims.generateFrameNames('heroAtlas', { start: 0, end: 2, prefix: 'down_' }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-down', frames: [{ key: 'heroAtlas', frame: 'down_0' }] });
        this.anims.create({ key: 'hero-walk-left', frames: this.anims.generateFrameNames('heroAtlas', { start: 0, end: 2, prefix: 'left_' }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-left', frames: [{ key: 'heroAtlas', frame: 'left_0' }] });
        this.anims.create({ key: 'hero-walk-right', frames: this.anims.generateFrameNames('heroAtlas', { start: 0, end: 2, prefix: 'right_' }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-right', frames: [{ key: 'heroAtlas', frame: 'right_0' }] });
        this.anims.create({ key: 'hero-walk-up', frames: this.anims.generateFrameNames('heroAtlas', { start: 0, end: 2, prefix: 'up_' }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'hero-idle-up', frames: [{ key: 'heroAtlas', frame: 'up_0' }] });
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        // —— 运行时生成 PNG + JSON Atlas（无 SVG 依赖） ——
        this.buildHeroAtlas();

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
