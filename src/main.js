import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { EscenaArranque } from './escenas/EscenaArranque.js';

new Phaser.Game({
	type: Phaser.AUTO,
	width: CONFIG.ANCHO,
	height: CONFIG.ALTO,
	parent: 'juego',
	backgroundColor: '#1a1612',
	// Pixel art: sin suavizado y con coordenadas enteras para que no se vea borroso.
	pixelArt: true,
	roundPixels: true,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	physics: {
		default: 'arcade',
		arcade: { debug: false },
	},
	scene: [EscenaArranque],
});
