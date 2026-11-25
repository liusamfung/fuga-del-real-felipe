import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { EscenaArranque } from './escenas/EscenaArranque.js';
import { EscenaDeletreo } from './escenas/EscenaDeletreo.js';
import { EscenaHUD } from './escenas/EscenaHUD.js';
import { EscenaJuego } from './escenas/EscenaJuego.js';

// Agregar ?debug a la dirección (http://localhost:5173/?debug) activa el modo de depuración:
// muestra los cuerpos de choque y deja el juego accesible desde la consola como `window.juego`.
const modoDebug = new URLSearchParams(window.location.search).has('debug');

const juego = new Phaser.Game({
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
		arcade: { debug: modoDebug },
	},
	scene: [EscenaArranque, EscenaJuego, EscenaHUD, EscenaDeletreo],
});

if (modoDebug) {
	window.juego = juego;
}
