import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { VictoryReport } from './scenes/VictoryReport';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 1024,
    parent: 'game-container',
    backgroundColor: '#028af8',
    // pixelArt: true,
    // render: { pixelArt: true, antialias: false },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        VictoryReport,
        GameOver
    ]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
